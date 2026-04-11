/**
 * 周考服务 - Weekly Exam Service
 * 每周六生成周考，基于当周毕业的单词
 */

const fs = require('fs');
const path = require('path');
const { OBSIDIAN_PATH, getLearnedWords } = require('./obsidian');
const { buildCefrMap } = require('./petVocab');
const { getTodayDateCST } = require('../utils/date');

// Read config fresh each time (so ParentView changes take effect without restart)
function getQuizConfig() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'config', 'quiz-config.json'), 'utf-8')
  );
}
function getWeeklyExamConfig() {
  return getQuizConfig().weeklyExamConfig;
}
function getFillBlankHideRatio() {
  return getQuizConfig().fillBlankHideRatio || 0.5;
}

// Persistence paths
const STATUS_FILE = path.join(OBSIDIAN_PATH, '.weekly-exam-status.json');
const WRONG_POOL_FILE = path.join(OBSIDIAN_PATH, '周考错题池.json');
const RECORD_FILE = path.join(OBSIDIAN_PATH, '周考记录.md');

// ─── Pure functions (exported for testing) ───

/**
 * Get the most recent examDay date at or before `now`.
 * examDay: 0=Sunday .. 6=Saturday
 * Returns YYYY-MM-DD string.
 */
function getExamCycleDate(now, examDay) {
  // Work in CST by extracting components
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const dateStr = formatter.format(now); // YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map(Number);
  // Get day-of-week in CST
  const dowFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    weekday: 'short',
  });
  const dowStr = dowFormatter.format(now);
  const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDow = dowMap[dowStr];

  let diff = currentDow - examDay;
  if (diff < 0) diff += 7;

  const dt = new Date(y, m - 1, d - diff);
  const ry = dt.getFullYear();
  const rm = String(dt.getMonth() + 1).padStart(2, '0');
  const rd = String(dt.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

/**
 * Check if a graduatedDate is within windowWeeks before cycleDate (inclusive).
 */
function isWithinWindow(graduatedDate, cycleDate, windowWeeks) {
  if (!graduatedDate) return false;
  const cycle = new Date(cycleDate + 'T00:00:00');
  const grad = new Date(graduatedDate + 'T00:00:00');
  const diffMs = cycle.getTime() - grad.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < windowWeeks * 7;
}

/**
 * Simple seeded PRNG (mulberry32).
 */
function seededRng(seed) {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  let state = h >>> 0;
  if (state === 0) state = 1;
  return function () {
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Pick question type based on weighted ratios using rng.
 * ratios: { choice: N, fillBlank: N, spelling: N } summing to 100
 */
function pickQuestionType(ratios, rng) {
  const val = rng() * 100;
  if (val < ratios.choice) return 'choice';
  if (val < ratios.choice + ratios.fillBlank) return 'fillBlank';
  return 'spelling';
}

/**
 * Unbiased Fisher-Yates shuffle using provided rng.
 */
function fisherYatesShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate hint mask for fillBlank questions.
 * Shows first letter, hides ~50% of remaining.
 * @param {string} word
 * @param {function} rng - seeded random number generator
 */
function generateHintMask(word, rng) {
  if (word.length <= 1) return word;
  const hideRatio = getFillBlankHideRatio();
  const chars = word.split('');
  const result = [chars[0]]; // always show first letter
  for (let i = 1; i < chars.length; i++) {
    result.push(rng() < hideRatio ? '_' : chars[i]);
  }
  // Ensure at least one underscore for words > 1 char
  if (!result.slice(1).includes('_')) {
    result[result.length - 1] = '_';
  }
  return result.join('');
}

// ─── Service logic ───

/**
 * Read wrong pool JSON, filtered to window.
 */
function readWrongPool(cycleDate, windowWeeks) {
  try {
    if (!fs.existsSync(WRONG_POOL_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(WRONG_POOL_FILE, 'utf-8'));
    // Each entry: { word, meaning, addedDate }
    return (data || []).filter(w => isWithinWindow(w.addedDate, cycleDate, windowWeeks));
  } catch {
    return [];
  }
}

/**
 * Write wrong pool JSON.
 */
function writeWrongPool(pool) {
  fs.writeFileSync(WRONG_POOL_FILE, JSON.stringify(pool, null, 2), 'utf-8');
}

/**
 * Read exam status.
 */
function readStatus() {
  try {
    if (!fs.existsSync(STATUS_FILE)) return null;
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Write exam status.
 */
function writeStatus(status) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf-8');
}

/**
 * Generate exam questions for a cycle.
 */
function generateExam(cycleDate) {
  const cfg = getWeeklyExamConfig();
  const examDay = cfg.examDay;
  const windowWeeks = cfg.windowWeeks;
  const sampleRates = cfg.sampleRates;
  const questionTypes = cfg.questionTypes;
  const rng = seededRng(cycleDate);

  // 1. Get all learned words within window
  const allLearned = getLearnedWords();
  const windowWords = allLearned.filter(w => isWithinWindow(w.date, cycleDate, windowWeeks));

  // 2. Get wrong pool within window
  const wrongPool = readWrongPool(cycleDate, windowWeeks);
  const wrongWordSet = new Set(wrongPool.map(w => w.word.toLowerCase()));

  // 3. Separate wrong words from regular words
  const wrongWordsInWindow = windowWords.filter(w => wrongWordSet.has(w.word.toLowerCase()));
  const regularWords = windowWords.filter(w => !wrongWordSet.has(w.word.toLowerCase()));

  // 4. CEFR classification
  let cefrMap;
  try {
    cefrMap = buildCefrMap();
  } catch {
    cefrMap = new Map();
  }

  function getLevel(word) {
    return cefrMap.get(word.toLowerCase()) || 'A2';
  }

  // 5. Sample regular words by CEFR level
  const byLevel = { A1: [], A2: [], 'B1+': [] };
  for (const w of regularWords) {
    const lvl = getLevel(w.word);
    (byLevel[lvl] || byLevel['A2']).push(w);
  }

  const sampled = [];
  for (const [level, words] of Object.entries(byLevel)) {
    const rate = sampleRates[level] || 0.4;
    // Shuffle with seeded rng (Fisher-Yates)
    const shuffled = fisherYatesShuffle(words, rng);
    const count = Math.ceil(shuffled.length * rate);
    sampled.push(...shuffled.slice(0, count));
  }

  // 6. Combine: all wrong words + sampled regular words
  const selectedWords = [...wrongWordsInWindow, ...sampled];

  // 7. Generate questions
  const questions = selectedWords.map(w => {
    const isWrong = wrongWordSet.has(w.word.toLowerCase());
    const level = getLevel(w.word);
    const typeRatios = isWrong ? questionTypes.wrong : (questionTypes[level] || questionTypes.A2);
    const type = pickQuestionType(typeRatios, rng);

    const question = {
      word: w.word,
      meaning: w.meaning,
      type,
      level,
      isFromWrongPool: isWrong,
    };

    if (type === 'choice') {
      question.options = generateChoiceOptions(w, windowWords, allLearned, rng);
    } else if (type === 'fillBlank') {
      question.hint = generateHintMask(w.word, rng);
    }

    return question;
  });

  // Shuffle questions (Fisher-Yates)
  const shuffledQuestions = fisherYatesShuffle(questions, rng);

  return {
    cycleDate,
    generatedDate: cycleDate,
    windowWeeks,
    total: shuffledQuestions.length,
    wrongCount: wrongWordsInWindow.length,
    sampledCount: sampled.length,
    questions: shuffledQuestions,
  };
}

/**
 * Generate 4 choice options (1 correct + 3 distractors).
 */
function generateChoiceOptions(targetWord, windowWords, allLearned, rng) {
  // Choice question UI shows Chinese meaning and asks to pick the correct English word.
  const correct = targetWord.word;

  const candidates = windowWords
    .filter(w => w.word.toLowerCase() !== targetWord.word.toLowerCase())
    .map(w => w.word);

  // Fallback to all learned if not enough distractors
  if (candidates.length < 3) {
    const extra = allLearned
      .filter(w => w.word.toLowerCase() !== targetWord.word.toLowerCase())
      .map(w => w.word);
    for (const w of extra) {
      if (!candidates.includes(w)) candidates.push(w);
      if (candidates.length >= 10) break;
    }
  }

  // Pick 3 random distractors (Fisher-Yates)
  const shuffled = fisherYatesShuffle(candidates, rng);
  const distractors = shuffled.slice(0, 3);

  // Combine and shuffle (Fisher-Yates)
  const options = fisherYatesShuffle([correct, ...distractors], rng);
  return options;
}

/**
 * Get or generate current exam.
 * Returns exam data if valid for current cycle, generates new if needed.
 */
function getOrGenerateExam() {
  const now = new Date();
  const cfg = getWeeklyExamConfig();
  const cycleDate = getExamCycleDate(now, cfg.examDay);
  const status = readStatus();

  // If status exists and matches current cycle, return cached exam
  if (status && status.generatedDate === cycleDate) {
    return status;
  }

  // Generate new exam (config read fresh inside generateExam)
  const exam = generateExam(cycleDate);
  const newStatus = {
    ...exam,
    completed: false,
    firstRoundRecorded: false,
    rounds: [],
  };
  writeStatus(newStatus);
  return newStatus;
}

/**
 * Record first round results.
 */
function recordFirstRound(correct, total, wrongWords) {
  const status = readStatus();
  if (!status) throw new Error('No active exam');

  // Update wrong pool
  const existingPool = (() => {
    try {
      if (!fs.existsSync(WRONG_POOL_FILE)) return [];
      return JSON.parse(fs.readFileSync(WRONG_POOL_FILE, 'utf-8')) || [];
    } catch { return []; }
  })();

  const existingSet = new Set(existingPool.map(w => w.word.toLowerCase()));
  const today = getTodayDateCST();

  for (const w of wrongWords) {
    if (!existingSet.has(w.word.toLowerCase())) {
      existingPool.push({
        word: w.word,
        meaning: w.meaning,
        addedDate: today,
        source: 'weekly-exam',
      });
    }
  }
  writeWrongPool(existingPool);

  // Append to 周考记录.md
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrongList = wrongWords.map(w => `${w.word}(${w.meaning})`).join('、');
  const block = `\n## ${status.generatedDate} 周考\n\n` +
    `- 📊 第一轮成绩：${correct}/${total} (${scorePercent}%)\n` +
    `- ❌ 错误单词：${wrongList || '无'}\n` +
    `- ⏰ 时间：${today}\n`;

  if (fs.existsSync(RECORD_FILE)) {
    fs.appendFileSync(RECORD_FILE, block, 'utf-8');
  } else {
    fs.writeFileSync(RECORD_FILE, `# 周考记录\n${block}`, 'utf-8');
  }

  // Update status
  status.firstRoundRecorded = true;
  status.rounds.push({
    roundNumber: status.rounds.length + 1,
    correct,
    total,
    score: scorePercent,
    wrongWords: wrongWords.map(w => w.word),
    timestamp: today,
  });
  writeStatus(status);

  return { correct, total, score: scorePercent, wrongCount: wrongWords.length };
}

/**
 * Mark exam as completed.
 */
function markComplete(roundsSummary) {
  const status = readStatus();
  if (!status) throw new Error('No active exam');

  status.completed = true;
  if (roundsSummary) {
    status.roundsSummary = roundsSummary;
  }
  writeStatus(status);

  return status;
}

module.exports = {
  // Pure functions (exported for testing)
  getExamCycleDate,
  isWithinWindow,
  seededRng,
  pickQuestionType,
  generateHintMask,
  fisherYatesShuffle,
  generateChoiceOptions,
  // Service functions
  getOrGenerateExam,
  generateExam,
  recordFirstRound,
  markComplete,
  readStatus,
};
