/**
 * Phonics service
 * Extracted from routes/translate.js to keep route files small and focused.
 *
 * NOTE: This module is CommonJS to match the rest of the server.
 */

const COMMON_WORDS = new Set(require('../data/common-words.json'));

/**
 * 复合词拆分：尝试将单词拆成两个已知单词
 * 例如：campsite → camp + site, sunflower → sun + flower
 */
function tryCompoundSplit(word) {
  if (word.length < 5) return null;

  // 从中间往两边试，优先找更均匀的拆分
  const mid = Math.floor(word.length / 2);
  let bestSplit = null;
  let bestBalance = Infinity;

  for (let i = 2; i < word.length - 2; i++) {
    const left = word.slice(0, i);
    const right = word.slice(i);
    if (COMMON_WORDS.has(left) && COMMON_WORDS.has(right)) {
      const balance = Math.abs(left.length - right.length);
      if (balance < bestBalance) {
        bestBalance = balance;
        bestSplit = [left, right];
      }
    }
  }

  return bestSplit;
}

/**
 * 计算音节数（不拆分）
 */
function countSyllables(word) {
  const vowels = 'aeiouy';
  const isVowel = (ch) => vowels.includes(ch);

  let count = 0;
  let prevWasVowel = false;
  for (const ch of word) {
    if (isVowel(ch)) {
      if (!prevWasVowel) count++;
      prevWasVowel = true;
    } else {
      prevWasVowel = false;
    }
  }

  // silent e: 词尾 e 前面是辅音
  // -le 结尾：只有 -ble, -tle, -ple, -dle, -gle, -fle, -zle 等才是独立音节
  // whole, while 等词的 -le 不是独立音节
  if (word.endsWith('e') && !word.endsWith('ee') && count > 1) {
    const beforeE = word[word.length - 2];
    if (!isVowel(beforeE)) {
      if (word.endsWith('le') && word.length > 3) {
        // -Cle 结尾：检查是否是真正的 -le 音节（前面是辅音+le）
        const beforeL = word[word.length - 3];
        // 只有辅音+le（如 ta·ble, lit·tle）才保持，元音+le（如 whole）减去
        if (isVowel(beforeL)) {
          count--; // whale, whole, while 等
        }
        // 否则保持（ta·ble, lit·tle, puz·zle 等）
      } else {
        count--; // 普通 silent e: make, come, close
      }
    }
  }

  // -ed 后 t/d 前才是独立音节，其他情况减 1
  if (word.endsWith('ed') && !word.endsWith('eed') && count > 1) {
    const beforeEd = word[word.length - 3];
    if (beforeEd !== 't' && beforeEd !== 'd') {
      count--;
    }
  }

  return Math.max(1, count);
}

function cleanupSyllables(syllables) {
  if (syllables.length <= 1) return syllables;

  const vowels = 'aeiouy';
  const hasVowel = (s) => [...s].some(c => vowels.includes(c));
  const result = [];

  for (const syl of syllables) {
    if (result.length > 0 && !hasVowel(syl)) {
      // 没有元音的音节合并到前一个
      result[result.length - 1] += syl;
    } else {
      result.push(syl);
    }
  }

  // Silent e 处理：最后一个音节如果是 辅音+e 模式（如 te, pe, ke, ne, se, ze）
  // 且不是特殊后缀（le, ble, tle, ple），合并到前一个音节
  if (result.length > 1) {
    const last = result[result.length - 1];
    // 辅音+e 且只有 e 作为元音，且不是 -le 结尾
    if (last.endsWith('e') && last.length <= 3 && !last.endsWith('le')) {
      const vowelCount = [...last].filter(c => vowels.includes(c)).length;
      if (vowelCount === 1) {
        result[result.length - 2] += result.pop();
      }
    }
  }

  return result;
}

function splitByVowelPattern(word) {
  const vowels = 'aeiouy';
  const isVowel = (ch) => vowels.includes(ch);

  // 常见不可分辅音组合（这些辅音组合应该归到同一个音节）
  const blends = ['bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'str', 'sw', 'th', 'tr', 'tw', 'wh', 'wr', 'scr', 'spl', 'spr', 'squ', 'thr', 'ph'];

  const syllables = [];
  let current = '';
  let i = 0;

  while (i < word.length) {
    const ch = word[i];
    current += ch;

    if (isVowel(ch)) {
      // 吃掉后续元音（元音组合 ea, ou, ai, oo, ee 等）
      while (i + 1 < word.length && isVowel(word[i + 1])) {
        i++;
        current += word[i];
      }

      // 统计后面连续辅音数量
      let consStart = i + 1;
      let consEnd = consStart;
      while (consEnd < word.length && !isVowel(word[consEnd])) {
        consEnd++;
      }
      const consonantCount = consEnd - consStart;

      if (consEnd >= word.length) {
        // 后面没有更多元音，剩余全部归当前音节
        current += word.slice(i + 1);
        i = word.length;
      } else if (consonantCount === 0) {
        // 直接是元音，断开
        syllables.push(current);
        current = '';
        i++;
      } else if (consonantCount === 1) {
        // 单个辅音：默认开音节（辅音归后）
        // 闭音节例外：当前音节是 CVC 结构且已有前面的音节
        // （如 in·ter·est 中的 ter，不是词首）
        const cons = word[consStart];
        // CVC 结构：当前音节有 辅音+元音 且已经有前缀音节
        const hasLeadingCons = current.length >= 2 && !isVowel(current[0]);
        const isNonInitial = syllables.length > 0;
        if (hasLeadingCons && isNonInitial) {
          // 非词首的 CVC 音节
          // 但如果后面只剩一个元音（如 com·pa + n + y），保持开音节
          const remainingAfterCons = word.length - consStart - 1;
          if (remainingAfterCons <= 1) {
            // 辅音后只剥1个字符，用开音节避免尾音节太短
            syllables.push(current);
            current = '';
            i++;
          } else {
            // 闭音节 (in·ter, ac·tiv)
            current += cons;
            syllables.push(current);
            current = '';
            i = consStart + 1;
          }
        } else {
          // 词首音节或元音开头 → 开音节 (re·gard, pa·per, ti·ger, o·pen)
          syllables.push(current);
          current = '';
          i++;
        }
      } else if (consonantCount >= 2) {
        // 多个辅音：检查是否是不可分blend
        const consChunk = word.slice(consStart, consEnd);

        // 检查整个辅音群是否是一个blend
        if (blends.includes(consChunk)) {
          // 整个辅音组合归下一音节
          syllables.push(current);
          current = '';
          i++;
        } else {
          // 检查尾部是否有blend（应归下一音节）
          let blendLen = 0;
          for (const b of blends) {
            if (consChunk.endsWith(b) && b.length > blendLen && b.length < consChunk.length) {
              blendLen = b.length;
            }
          }

          if (blendLen > 0) {
            // 把blend前的辅音归当前音节，blend归下一音节
            const keepCount = consonantCount - blendLen;
            current += word.slice(consStart, consStart + keepCount);
            syllables.push(current);
            current = '';
            i = consStart + keepCount;
          } else {
            // 默认在中间断开
            const splitAt = Math.floor(consonantCount / 2);
            current += word.slice(consStart, consStart + splitAt);
            syllables.push(current);
            current = '';
            i = consStart + splitAt;
          }
        }
      }
    } else {
      i++;
    }
  }

  if (current) syllables.push(current);

  // 后处理
  return cleanupSyllables(syllables);
}

function splitSyllables(word) {
  const lowerWord = word.toLowerCase();

  // 复合词检测：尝试拆成两个已知单词
  const compoundSplit = tryCompoundSplit(lowerWord);
  if (compoundSplit) return compoundSplit;

  // 单音节短词直接返回
  if (lowerWord.length <= 3) return [lowerWord];

  // 先计算整个词的音节数
  const totalSyllables = countSyllables(lowerWord);
  if (totalSyllables <= 1) return [lowerWord];

  // ---- 后缀处理（音节级别） ----
  let stem = lowerWord;
  let suffix = '';

  // -ed: 只有在 t/d 后才是独立音节 (regarded → re·gard·ed)
  // 其他情况不加音节 (enclosed → en·closed, stopped → stopped)
  if (lowerWord.endsWith('ed') && lowerWord.length > 3) {
    const beforeEd = lowerWord[lowerWord.length - 3];
    if (beforeEd === 't' || beforeEd === 'd') {
      // -ted/-ded: -ed 是独立音节
      stem = lowerWord.slice(0, -2);
      suffix = 'ed';
    } else {
      // 非音节 -ed: 去掉 -ed 拆 stem，再合并回去
      const stemWithoutEd = lowerWord.slice(0, -2);
      const stemSyl = countSyllables(stemWithoutEd);
      if (stemSyl <= 1) {
        return [lowerWord]; // enclosed → 1音节stem+ed → 整词
      } else {
        const parts = splitByVowelPattern(stemWithoutEd);
        parts[parts.length - 1] += 'ed';
        return parts;
      }
    }
  }
  // -ing: 独立音节，前面辅音归 stem
  else if (lowerWord.endsWith('ing') && lowerWord.length > 4) {
    const beforeIng = lowerWord.slice(0, -3);
    // 双写辅音：running → run + ning
    if (beforeIng.length >= 2 && beforeIng[beforeIng.length - 1] === beforeIng[beforeIng.length - 2]) {
      stem = beforeIng.slice(0, -1);
      suffix = beforeIng[beforeIng.length - 1] + 'ing';
    } else {
      stem = beforeIng;
      suffix = 'ing';
    }
  }
  // -ence/-ance: 独立音节 (experience, silence, distance)
  else if (lowerWord.match(/(ence|ance)$/) && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = lowerWord.slice(-4);
  }
  // -tion/-sion: 独立音节
  else if (lowerWord.match(/(tion|sion)$/) && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = lowerWord.slice(-4);
  }
  // -ture: 独立音节
  else if (lowerWord.endsWith('ture') && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = 'ture';
  }
  // -ous
  else if (lowerWord.endsWith('ous') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'ous';
  }
  // -ment
  else if (lowerWord.endsWith('ment') && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = 'ment';
  }
  // -ness
  else if (lowerWord.endsWith('ness') && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = 'ness';
  }
  // -ful
  else if (lowerWord.endsWith('ful') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'ful';
  }
  // -less
  else if (lowerWord.endsWith('less') && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = 'less';
  }
  // -ly
  else if (lowerWord.endsWith('ly') && lowerWord.length > 3) {
    stem = lowerWord.slice(0, -2);
    suffix = 'ly';
  }
  // -ure (failure, closure)
  else if (lowerWord.endsWith('ure') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'ure';
  }
  // -age (courage, village)
  else if (lowerWord.endsWith('age') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'age';
  }
  // -ive (active, creative)
  else if (lowerWord.endsWith('ive') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'ive';
  }
  // -let (leaflet, booklet)
  else if (lowerWord.endsWith('let') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'let';
  }

  // 计算 stem 的音节数
  const stemSyllables = countSyllables(stem);

  if (stemSyllables <= 1 && !suffix) {
    return [lowerWord];
  }

  if (stemSyllables <= 1 && suffix) {
    return [stem, suffix];
  }

  // stem 多音节，拆 stem
  const stemParts = splitByVowelPattern(stem);
  if (suffix) {
    return [...stemParts, suffix];
  }
  return stemParts;
}

/**
 * 将完整 IPA 按音节数拆分分配
 */
function distributeIpa(syllables, fullIpa) {
  if (!fullIpa || syllables.length <= 1) {
    return syllables.map(s => ({ syllable: s, ipa: fullIpa || '' }));
  }

  // 去掉首尾的 /
  let ipa = fullIpa.replace(/^\/?/, '').replace(/\/?$/, '');

  // IPA 元音符号（包括常见的）
  const isIpaVowel = (ch) => 'aeiouyæøœɛɔəɪʊʌɒɑɐ'.includes(ch);

  // 找到所有元音核心位置
  const vowelPositions = [];
  for (let i = 0; i < ipa.length; i++) {
    if (isIpaVowel(ipa[i])) {
      vowelPositions.push(i);
      // 跳过双元音/长元音标记（ː 或紧跟的另一个元音）
      while (i + 1 < ipa.length && (isIpaVowel(ipa[i + 1]) || ipa[i + 1] === 'ː' || ipa[i + 1] === 'ˈ' || ipa[i + 1] === 'ˌ')) {
        i++;
      }
    }
  }

  // 如果元音数 == 音节数，按元音位置分割
  if (vowelPositions.length === syllables.length) {
    const parts = [];
    for (let i = 0; i < vowelPositions.length; i++) {
      let start;
      if (i === 0) {
        start = 0;
      } else {
        // 在前一个元音后和当前元音前的辅音群中间分割
        const prevVowelEnd = vowelPositions[i - 1] + 1;
        // 跳过长元音标记
        let consonantStart = prevVowelEnd;
        while (consonantStart < vowelPositions[i] && (ipa[consonantStart] === 'ː')) {
          consonantStart++;
        }
        const consonantEnd = vowelPositions[i];
        // 重音标记应跟随后面的音节
        let mid = Math.ceil((consonantStart + consonantEnd) / 2);
        while (mid > 0 && (ipa[mid - 1] === 'ˈ' || ipa[mid - 1] === 'ˌ')) {
          mid--;
        }
        start = mid;
      }
      parts.push(start);
    }
    parts.push(ipa.length);

    return syllables.map((syl, idx) => ({
      syllable: syl,
      ipa: '/' + ipa.slice(parts[idx], parts[idx + 1]) + '/'
    }));
  }

  // 元音数不匹配，粗略均分
  const chunkSize = Math.ceil(ipa.length / syllables.length);
  return syllables.map((syl, idx) => {
    const start = idx * chunkSize;
    const end = Math.min(start + chunkSize, ipa.length);
    const chunk = ipa.slice(start, end);
    return {
      syllable: syl,
      ipa: chunk ? '/' + chunk + '/' : ''
    };
  });
}

/**
 * 获取单词的 phonics 信息（音节拆解 + IPA）
 * 首选 Free Dictionary API，兜底用规则拆分
 */
async function getPhonics(word, fallbackIpa) {
  const lowerWord = word.toLowerCase();

  // 短语不拆分音节（包含空格的是短语）
  if (lowerWord.includes(' ')) {
    return [{ syllable: lowerWord, ipa: fallbackIpa || '' }];
  }
  let ipa = '';
  let apiSyllables = null;

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(lowerWord)}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];

        // 获取 IPA
        if (entry.phonetics && entry.phonetics.length > 0) {
          for (const p of entry.phonetics) {
            if (p.text) {
              ipa = p.text;
              break;
            }
          }
        }
        // 也可能在顶层
        if (!ipa && entry.phonetic) {
          ipa = entry.phonetic;
        }

        // 尝试从 API 获取音节信息（有些词条的 word 字段可能带连字符）
        if (entry.word && entry.word.includes('-')) {
          apiSyllables = entry.word.split('-').map(s => s.trim()).filter(s => s);
        }
      }
    }
  } catch (e) {
    console.log('Free Dictionary API error:', e.message);
  }

  // 如果 Free Dictionary 没返回音标，用有道的音标兆底
  if (!ipa && fallbackIpa) {
    ipa = fallbackIpa;
  }

  // 音节拆分：优先 API 结果，兜底规则
  const syllables = (apiSyllables && apiSyllables.length > 1) ? apiSyllables : splitSyllables(lowerWord);

  // 构建 phonics 数组
  if (syllables.length === 1) {
    // 单音节词
    return [{ syllable: syllables[0], ipa: ipa || '' }];
  }

  // 多音节词：将完整 IPA 按音节数均分
  const phonics = distributeIpa(syllables, ipa);
  return phonics;
}

module.exports = {
  getPhonics,
  // exported for potential testing/debugging
  splitSyllables,
  countSyllables,
};
