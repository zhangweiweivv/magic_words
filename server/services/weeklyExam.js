/**
 * 周考服务 - Weekly Exam Service
 * 每周六生成周考，基于当周毕业的单词
 */

const fs = require('fs');
const path = require('path');
const { OBSIDIAN_PATH, getLearnedWords } = require('./obsidian');
const { buildCefrMap } = require('./petVocab');
const { getTodayDateCST } = require('../utils/date');
const slackService = require('./slack');

// Simple tagged logger for consistent prefix
const log = (level, msg, data) => console[level](`[weekly-exam] ${msg}`, data || '');

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
function generateHintMask(word, rng, hideRatio = 0.5) {
  if (word.length <= 1) return word;
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
function readWrongPool(cycleDate, windowWeeks, learnedWords = null) {
  try {
    if (!fs.existsSync(WRONG_POOL_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(WRONG_POOL_FILE, 'utf-8')) || [];

    // Filtering rule: wrong pool is limited to the SAME N-week window by the word's graduation date.
    // Backfill legacy entries that only had addedDate.
    const learnedMap = Array.isArray(learnedWords)
      ? new Map(
          learnedWords
            .filter(w => w && w.word)
            .map(w => [String(w.word).toLowerCase(), w.date || null])
        )
      : null;

    let changed = false;

    const filtered = data.filter(entry => {
      const key = String(entry?.word || '').toLowerCase();
      if (!key) return false;

      if (!entry.graduatedDate && learnedMap) {
        const gd = learnedMap.get(key) || null;
        if (gd) {
          entry.graduatedDate = gd;
          changed = true;
        }
      }

      const gd = entry.graduatedDate || (learnedMap ? learnedMap.get(key) : null);
      return isWithinWindow(gd, cycleDate, windowWeeks);
    });

    if (changed) {
      writeWrongPool(data);
    }

    return filtered;
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
  const hideRatio = getFillBlankHideRatio();

  // 1. Get all learned words within window
  const allLearned = getLearnedWords();
  const windowWords = allLearned.filter(w => isWithinWindow(w.date, cycleDate, windowWeeks));

  // 2. Get wrong pool within window
  const wrongPool = readWrongPool(cycleDate, windowWeeks, allLearned);
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
  const samplingLog = {};
  for (const [level, words] of Object.entries(byLevel)) {
    const rate = sampleRates[level] || 0.4;
    // Shuffle with seeded rng (Fisher-Yates)
    const shuffled = fisherYatesShuffle(words, rng);
    const count = Math.ceil(shuffled.length * rate);
    const picked = shuffled.slice(0, count);
    sampled.push(...picked);
    samplingLog[level] = { total: words.length, rate, picked: picked.length, words: picked.map(w => w.word) };
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
      graduatedDate: w.date || null,
      type,
      level,
      isFromWrongPool: isWrong,
      selectionReason: isWrong
        ? `错题池（窗口内历史错题，100%必考）`
        : `${level}级采样（${byLevel[level]?.length || 0}词中按${Math.round((sampleRates[level] || 0.4) * 100)}%抽样命中）`,
    };

    if (type === 'choice') {
      const options = generateChoiceOptions(w, windowWords, allLearned, rng);
      // If not enough distractors (< 4 options), fall back to spelling
      if (options.length < 4) {
        question.type = 'spelling';
      } else {
        question.options = options;
      }
    } else if (type === 'fillBlank') {
      question.hint = generateHintMask(w.word, rng, hideRatio);
    }

    return question;
  });

  // Shuffle questions (Fisher-Yates)
  const shuffledQuestions = fisherYatesShuffle(questions, rng);

  // Log selection details
  log('info', `周考生成完成`, {
    cycleDate,
    windowWeeks,
    wrongCount: wrongWordsInWindow.length,
    wrongWords: wrongWordsInWindow.map(w => w.word),
    sampling: samplingLog,
    totalQuestions: shuffledQuestions.length,
  });

  return {
    cycleDate,
    generatedDate: cycleDate,
    windowWeeks,
    total: shuffledQuestions.length,
    wrongCount: wrongWordsInWindow.length,
    sampledCount: sampled.length,
    samplingLog,
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

  // Not enough distractors even after fallback — return short array
  // (caller will detect < 4 options and fall back to spelling)
  if (candidates.length < 3) {
    return fisherYatesShuffle([correct, ...candidates], rng);
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
  return ensureCurrentExam({ sendSlackReady: false });
}

/**
 * Ensure the current weekly exam exists for the current cycle.
 * If a new exam is generated and sendSlackReady=true, send a Slack notification.
 */
function ensureCurrentExam({ sendSlackReady = false } = {}) {
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

  if (sendSlackReady) {
    try {
      slackService.sendWeeklyExamReady({
        generatedDate: newStatus.generatedDate,
        total: newStatus.total,
        wrongCount: newStatus.wrongCount,
        sampledCount: newStatus.sampledCount,
        windowWeeks: newStatus.windowWeeks,
      });
    } catch (e) {
      log('error', 'sendWeeklyExamReady failed:', e.message);
    }
  }

  return newStatus;
}

/**
 * Record first round results.
 */
function recordFirstRound(correct, total, wrongWords) {
  const status = readStatus();
  if (!status) throw new Error('No active exam');

  // Prevent double recording on network retry
  if (status.firstRoundRecorded) {
    const existingRound = status.rounds[0];
    return {
      correct: existingRound?.correct ?? correct,
      total: existingRound?.total ?? total,
      score: existingRound?.score ?? 0,
      wrongCount: existingRound?.wrongWords?.length ?? 0,
      alreadyRecorded: true
    };
  }

  // Build a lookup of graduation dates from current exam questions (preferred)
  const qGradMap = new Map(
    (status.questions || [])
      .filter(q => q && q.word)
      .map(q => [String(q.word).toLowerCase(), q.graduatedDate || null])
  );

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
    const key = String(w.word || '').toLowerCase();
    if (!key) continue;

    // Determine graduation date for window filtering
    const graduatedDate = w.graduatedDate || qGradMap.get(key) || null;

    if (!existingSet.has(key)) {
      existingPool.push({
        word: w.word,
        meaning: w.meaning,
        graduatedDate,
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

  const wasCompleted = !!status.completed;

  status.completed = true;
  if (roundsSummary) {
    status.roundsSummary = roundsSummary;
  }
  writeStatus(status);

  // Prune wrong pool to prevent unbounded growth
  try {
    const cfg = getWeeklyExamConfig();
    pruneWrongPool(status.generatedDate, cfg.windowWeeks);
  } catch (e) {
    log('error', 'pruneWrongPool failed:', e.message);
  }

  // Slack notify (only on first completion)
  if (!wasCompleted) {
    try {
      const firstRound = Array.isArray(status.rounds) ? status.rounds[0] : null;
      const correct = firstRound?.correct ?? 0;
      const total = firstRound?.total ?? status.total ?? 0;
      const wrongWords = firstRound?.wrongWords ?? [];
      const roundsCount = 1 + (Array.isArray(roundsSummary) ? roundsSummary.length : 0);

      slackService.sendWeeklyExamComplete({
        generatedDate: status.generatedDate,
        score: correct,
        total,
        rounds: roundsCount,
        wrongWords,
      });
    } catch (e) {
      log('error', 'sendWeeklyExamComplete failed:', e.message);
    }
  }

  return status;
}

/**
 * Prune wrong pool to remove stale entries.
 * Keep only entries where graduatedDate is within windowWeeks + 2 of cycleDate.
 */
function pruneWrongPool(cycleDate, windowWeeks) {
  try {
    if (!fs.existsSync(WRONG_POOL_FILE)) return;
    const pool = JSON.parse(fs.readFileSync(WRONG_POOL_FILE, 'utf-8')) || [];
    const before = pool.length;
    const pruned = pool.filter(entry => {
      const gd = entry.graduatedDate;
      if (!gd) return true; // keep entries without graduation date (can't determine staleness)
      return isWithinWindow(gd, cycleDate, windowWeeks + 2);
    });
    if (pruned.length < before) {
      writeWrongPool(pruned);
      log('log', `Pruned wrong pool: ${before} → ${pruned.length} entries`);
    }
  } catch (e) {
    log('error', 'pruneWrongPool error:', e.message);
  }
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
  ensureCurrentExam,
  getOrGenerateExam,
  generateExam,
  recordFirstRound,
  markComplete,
  readStatus,
};
