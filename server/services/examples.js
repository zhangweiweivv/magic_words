/**
 * 例句版本切换层
 *
 * v1：来自 Obsidian 单词本表格的原始例句（有道抓的，难度偏高）
 * v2：LLM 重新生成的简化例句（PET/A2 难度，适合 8 岁小学生）
 *
 * 通过 server/config/quiz-config.json 的 exampleVersion 字段切换：
 *   - "v1" 或缺省：完全用 v1
 *   - "v2"：优先用 v2，缺失则 fallback v1
 *
 * 文件：server/data/examples-v2.json
 *   {
 *     "mean": "1. What does this word mean? 💡 2. Be kind, don't be mean to your friends. 🌟",
 *     ...
 *   }
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../config/quiz-config.json');
const V2_FILE = path.join(__dirname, '../data/examples-v2.json');

let cachedConfig = null;
let cachedConfigMtime = 0;
let cachedV2 = null;
let cachedV2Mtime = 0;

function loadConfig() {
  try {
    const stat = fs.statSync(CONFIG_FILE);
    if (cachedConfig && stat.mtimeMs === cachedConfigMtime) return cachedConfig;
    cachedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    cachedConfigMtime = stat.mtimeMs;
    return cachedConfig;
  } catch (e) {
    console.warn('[examples] read quiz-config failed:', e.message);
    return cachedConfig || {};
  }
}

function loadV2() {
  try {
    if (!fs.existsSync(V2_FILE)) {
      cachedV2 = {};
      return cachedV2;
    }
    const stat = fs.statSync(V2_FILE);
    if (cachedV2 && stat.mtimeMs === cachedV2Mtime) return cachedV2;
    cachedV2 = JSON.parse(fs.readFileSync(V2_FILE, 'utf-8'));
    cachedV2Mtime = stat.mtimeMs;
    return cachedV2;
  } catch (e) {
    console.warn('[examples] read examples-v2.json failed:', e.message);
    return cachedV2 || {};
  }
}

/**
 * 当前版本（'v1' | 'v2'）
 */
function getVersion() {
  const cfg = loadConfig();
  return cfg.exampleVersion === 'v2' ? 'v2' : 'v1';
}

/**
 * 给一个 word 对象返回应展示的 example 字符串
 * 不修改入参；找不到 v2 自动 fallback 到 v1。
 */
function pickExample(word) {
  if (!word || !word.word) return word ? word.example || '' : '';
  if (getVersion() !== 'v2') return word.example || '';

  const v2 = loadV2();
  const key = word.word.toLowerCase().trim();
  if (v2[key]) return v2[key];
  // fallback：原始 example
  return word.example || '';
}

/**
 * 给一个 words 数组应用例句版本切换；返回新数组（浅拷贝每条记录）。
 */
function applyExampleVersion(words) {
  if (!Array.isArray(words)) return words;
  if (getVersion() !== 'v2') return words;
  const v2 = loadV2();
  return words.map(w => {
    if (!w || !w.word) return w;
    const key = w.word.toLowerCase().trim();
    if (v2[key]) return { ...w, example: v2[key], exampleSource: 'v2' };
    return { ...w, exampleSource: 'v1-fallback' };
  });
}

module.exports = {
  getVersion,
  pickExample,
  applyExampleVersion,
};
