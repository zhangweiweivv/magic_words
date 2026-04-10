/**
 * 翻译 API 封装
 */

import axios from 'axios';

const API_BASE = '/api/translate';

// 本地缓存
const cache = new Map();
const detailCache = new Map();

/**
 * 获取单词翻译
 * @param {string} word - 要翻译的单词
 */
export async function translate(word) {
  const key = word.toLowerCase().trim();
  
  // 检查本地缓存
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  try {
    const response = await axios.get(`${API_BASE}/${encodeURIComponent(key)}`);
    if (response.data.success) {
      cache.set(key, response.data.data);
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('翻译失败:', error.message);
    return null;
  }
}

/**
 * 获取单词详细信息（词性、音标、同/反义词、词形变化）
 * @param {string} word - 要查询的单词
 */
export async function getWordDetail(word) {
  const key = word.toLowerCase().trim();
  
  // 检查本地缓存
  if (detailCache.has(key)) {
    return detailCache.get(key);
  }
  
  try {
    const response = await axios.get(`${API_BASE}/${encodeURIComponent(key)}/detail`);
    if (response.data.success) {
      detailCache.set(key, response.data.data);
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('获取单词详情失败:', error.message);
    return null;
  }
}

export default {
  translate,
  getWordDetail
};
