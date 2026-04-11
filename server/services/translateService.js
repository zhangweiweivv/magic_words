/**
 * translate service
 * Logic extracted from routes/translate.js to keep routes thin.
 */

const fs = require('fs');
const path = require('path');

const { getPhonics } = require('./phonics');

// 缓存文件路径（与原 routes/translate.js 保持一致：server/data/word-details-cache.json）
const CACHE_FILE = path.join(__dirname, '../data/word-details-cache.json');

// 常用同义词/反义词表（兜底用）
const COMMON_SYNONYMS = require('../data/synonyms.json');
const COMMON_ANTONYMS = require('../data/antonyms.json');

// 常用词根词缀表（适合小学生理解的简化版）
const COMMON_ROOTS = require('../data/roots.json');

// 常用单词词典（离线备用）
const basicDict = require('../data/basic-dict.json');

// 简单的单词词典缓存（内存）
const cache = new Map();

// 读取缓存
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('读取缓存失败:', e.message);
  }
  return {};
}

// 写入缓存
function writeCache(cacheObj) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheObj, null, 2), 'utf8');
  } catch (e) {
    console.log('写入缓存失败:', e.message);
  }
}

// 生成词形变化（规则兜底）
function generateForms(word, pos) {
  const forms = {};
  const lowerWord = word.toLowerCase();

  // 名词：复数
  if (pos.includes('n')) {
    if (lowerWord.endsWith('s') || lowerWord.endsWith('x') || lowerWord.endsWith('z') ||
        lowerWord.endsWith('ch') || lowerWord.endsWith('sh')) {
      forms.plural = lowerWord + 'es';
    } else if (lowerWord.endsWith('y') && !'aeiou'.includes(lowerWord[lowerWord.length - 2])) {
      forms.plural = lowerWord.slice(0, -1) + 'ies';
    } else if (lowerWord.endsWith('f')) {
      forms.plural = lowerWord.slice(0, -1) + 'ves';
    } else if (lowerWord.endsWith('fe')) {
      forms.plural = lowerWord.slice(0, -2) + 'ves';
    } else {
      forms.plural = lowerWord + 's';
    }
  }

  // 动词：过去式、进行时、第三人称
  if (pos.includes('v')) {
    // 过去式 -ed
    if (lowerWord.endsWith('e')) {
      forms.past = lowerWord + 'd';
      forms.pastParticiple = lowerWord + 'd';
    } else if (lowerWord.endsWith('y') && !'aeiou'.includes(lowerWord[lowerWord.length - 2])) {
      forms.past = lowerWord.slice(0, -1) + 'ied';
      forms.pastParticiple = lowerWord.slice(0, -1) + 'ied';
    } else {
      forms.past = lowerWord + 'ed';
      forms.pastParticiple = lowerWord + 'ed';
    }

    // 进行时 -ing
    if (lowerWord.endsWith('e') && !lowerWord.endsWith('ee')) {
      forms.presentParticiple = lowerWord.slice(0, -1) + 'ing';
    } else if (lowerWord.endsWith('ie')) {
      forms.presentParticiple = lowerWord.slice(0, -2) + 'ying';
    } else {
      forms.presentParticiple = lowerWord + 'ing';
    }

    // 第三人称单数
    if (lowerWord.endsWith('s') || lowerWord.endsWith('x') || lowerWord.endsWith('z') ||
        lowerWord.endsWith('ch') || lowerWord.endsWith('sh')) {
      forms.thirdPerson = lowerWord + 'es';
    } else if (lowerWord.endsWith('y') && !'aeiou'.includes(lowerWord[lowerWord.length - 2])) {
      forms.thirdPerson = lowerWord.slice(0, -1) + 'ies';
    } else {
      forms.thirdPerson = lowerWord + 's';
    }
  }

  return forms;
}

// 分析单词的词根词缀
function analyzeRoots(word) {
  const lowerWord = word.toLowerCase();
  const results = [];

  // 太短的词不分析
  if (lowerWord.length < 4) return results;

  // 检查前缀（从长到短匹配）
  const prefixes = Object.keys(COMMON_ROOTS)
    .filter(k => COMMON_ROOTS[k].type === 'prefix')
    .sort((a, b) => b.length - a.length);

  let remaining = lowerWord;
  for (const prefix of prefixes) {
    if (remaining.startsWith(prefix) && remaining.length > prefix.length + 2) {
      results.push({
        part: prefix + '-',
        type: '前缀',
        meaning: COMMON_ROOTS[prefix].meaning
      });
      remaining = remaining.slice(prefix.length);
      break; // 只匹配一个前缀
    }
  }

  // 检查后缀（从长到短匹配）
  const suffixes = Object.keys(COMMON_ROOTS)
    .filter(k => COMMON_ROOTS[k].type === 'suffix')
    .sort((a, b) => b.length - a.length);

  for (const suffix of suffixes) {
    if (remaining.endsWith(suffix) && remaining.length > suffix.length + 2) {
      results.push({
        part: '-' + suffix,
        type: '后缀',
        meaning: COMMON_ROOTS[suffix].meaning
      });
      remaining = remaining.slice(0, remaining.length - suffix.length);
      break; // 只匹配一个后缀
    }
  }

  // 检查词根（在剩余部分中查找）
  const roots = Object.keys(COMMON_ROOTS)
    .filter(k => COMMON_ROOTS[k].type === 'root')
    .sort((a, b) => b.length - a.length);

  for (const root of roots) {
    if (remaining.includes(root) && remaining.length >= root.length) {
      results.push({
        part: root,
        type: '词根',
        meaning: COMMON_ROOTS[root].meaning
      });
      break; // 只匹配一个词根
    }
  }

  return results;
}

async function translateWord(wordInput) {
  const word = (wordInput || '').toLowerCase().trim();

  // 检查缓存
  if (cache.has(word)) {
    return { success: true, data: cache.get(word) };
  }

  // 检查基础词典
  if (basicDict[word]) {
    const result = { word, translation: basicDict[word], source: 'basic' };
    cache.set(word, result);
    return { success: true, data: result };
  }

  // 使用有道词典 API（返回中文释义）
  try {
    const response = await fetch(`https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4&q=${encodeURIComponent(word)}`);
    if (response.ok) {
      const data = await response.json();

      // 尝试从 ec.word.trs 获取中文释义（确保是同一个词）
      if (data.ec && data.ec.word && data.ec.word.trs) {
        // 验证返回的是请求的词
        const returnedWord = data.simple?.word?.[0]?.['return-phrase']?.toLowerCase();
        if (returnedWord === word || !returnedWord) {
          const trs = data.ec.word.trs;
          const translations = trs.slice(0, 2).map(t => `${t.pos} ${t.tran}`).join('；');
          const phonetic = data.ec.word.ukphone ? `/${data.ec.word.ukphone}/` : '';

          const result = {
            word,
            translation: translations,
            phonetic: phonetic,
            source: 'youdao'
          };
          cache.set(word, result);
          return { success: true, data: result };
        }
      }

      // 尝试从 web_trans 获取（精确匹配）
      if (data.web_trans && data.web_trans['web-translation']) {
        for (const item of data.web_trans['web-translation']) {
          if (item.key && item.key.toLowerCase() === word && item.trans) {
            const translations = item.trans.slice(0, 2).map(t => t.value).join('，');
            const result = {
              word,
              translation: translations,
              phonetic: '',
              source: 'youdao'
            };
            cache.set(word, result);
            return { success: true, data: result };
          }
        }
      }
    }
  } catch (apiError) {
    console.log('Youdao API error:', apiError.message);
  }

  // 如果都找不到，返回未找到
  return {
    success: false,
    error: '未找到翻译',
    data: { word, translation: null }
  };
}

async function translateWordDetail(wordInput) {
  const word = (wordInput || '').toLowerCase().trim();

  // 1. 先查本地缓存（检查是否有 phonics 字段，没有则重新获取）
  const cacheData = readCache();
  if (cacheData[word] && cacheData[word].phonics) {
    return { success: true, data: cacheData[word] };
  }

  // 2. 调用有道API
  let result = {
    word: word,
    phonetic: '',
    pos: '',
    translation: '',
    synonyms: [],
    antonyms: [],
    forms: {},
    roots: []
  };

  try {
    const response = await fetch(`https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4&q=${encodeURIComponent(word)}`);
    if (response.ok) {
      const data = await response.json();

      // 提取词性和释义
      if (data.ec && data.ec.word && data.ec.word.trs) {
        const trs = data.ec.word.trs;
        if (trs.length > 0) {
          // 取第一个作为主词性
          result.pos = trs[0].pos || '';
          result.translation = trs[0].tran || '';
        }

        // 音标
        result.phonetic = data.ec.word.ukphone ? `/${data.ec.word.ukphone}/` :
                         (data.ec.word.usphone ? `/${data.ec.word.usphone}/` : '');
      }

      // 提取同义词
      if (data.syno && data.syno.synos && data.syno.synos.length > 0) {
        const synoData = data.syno.synos[0];
        if (synoData.syno && synoData.syno.ws) {
          result.synonyms = synoData.syno.ws.map(w => w.w).filter(w => w).slice(0, 5);
        }
      }

      // 提取词形变化
      if (data.rel_word && data.rel_word.rels) {
        for (const rel of data.rel_word.rels) {
          if (rel.rel && rel.rel.words) {
            const relType = (rel.rel.pos || '').toLowerCase();
            const words = rel.rel.words.map(w => w.word).filter(w => w);
            if (words.length > 0) {
              // 映射常见词形
              if (relType.includes('复数') || relType.includes('plural')) {
                result.forms.plural = words[0];
              } else if (relType.includes('过去式') || relType.includes('past')) {
                result.forms.past = words[0];
              } else if (relType.includes('过去分词')) {
                result.forms.pastParticiple = words[0];
              } else if (relType.includes('现在分词') || relType.includes('ing')) {
                result.forms.presentParticiple = words[0];
              } else if (relType.includes('第三人称')) {
                result.forms.thirdPerson = words[0];
              }
            }
          }
        }
      }

      // 也尝试从 ec.word.wfs 提取词形变化
      if (data.ec && data.ec.word && data.ec.word.wfs) {
        for (const wf of data.ec.word.wfs) {
          if (wf.wf) {
            const name = (wf.wf.name || '').toLowerCase();
            const value = wf.wf.value;
            if (value) {
              if (name.includes('复数') || name === 'pl') {
                result.forms.plural = value;
              } else if (name.includes('过去式') || name === 'pt') {
                result.forms.past = value;
              } else if (name.includes('过去分词') || name === 'pp') {
                result.forms.pastParticiple = value;
              } else if (name.includes('现在分词') || name === 'pres') {
                result.forms.presentParticiple = value;
              } else if (name.includes('第三人称') || name === '3rd') {
                result.forms.thirdPerson = value;
              }
            }
          }
        }
      }
    }
  } catch (apiError) {
    console.log('Youdao API error (detail):', apiError.message);
  }

  // 3. 兜底处理
  // 同义词兜底
  if (result.synonyms.length === 0 && COMMON_SYNONYMS[word]) {
    result.synonyms = COMMON_SYNONYMS[word].slice(0, 5);
  }

  // 反义词兜底
  if (COMMON_ANTONYMS[word]) {
    result.antonyms = COMMON_ANTONYMS[word].slice(0, 3);
  }

  // 词形变化兜底（如果API没有返回，用规则生成）
  if (Object.keys(result.forms).length === 0 && result.pos) {
    result.forms = generateForms(word, result.pos);
  }

  // 词根词缀分析
  result.roots = analyzeRoots(word);

  // Phonics 音节拆解（传入有道音标作为兆底）
  try {
    result.phonics = await getPhonics(word, result.phonetic);
  } catch (e) {
    console.log('Phonics error:', e.message);
    result.phonics = [{ syllable: word, ipa: '' }];
  }

  // 4. 写入缓存
  cacheData[word] = result;
  writeCache(cacheData);

  return { success: true, data: result };
}

module.exports = {
  translateWord,
  translateWordDetail,
};
