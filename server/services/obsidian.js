/**
 * Obsidian 单词本解析服务
 * 解析可可的 Markdown 单词本文件
 */

const fs = require('fs');
const path = require('path');
const { getTodayDateCST } = require('../utils/date');

const OBSIDIAN_PATH = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本';
const UNLEARNED_FILE = path.join(OBSIDIAN_PATH, '未记住单词.md');
const LEARNED_FILE = path.join(OBSIDIAN_PATH, '已记住单词.md');

/**
 * 将单词从未记住移动到已记住
 * @param {string[]} words - 要移动的单词列表
 * @returns {Object} - 移动结果
 */
function moveToLearned(wordsToMove) {
  if (!wordsToMove || wordsToMove.length === 0) {
    return { success: false, message: '没有要移动的单词' };
  }

  try {
    // 读取未记住文件
    let unlearnedContent = fs.readFileSync(UNLEARNED_FILE, 'utf-8');
    const unlearnedLines = unlearnedContent.split('\n');
    
    // 读取已记住文件
    let learnedContent = '';
    if (fs.existsSync(LEARNED_FILE)) {
      learnedContent = fs.readFileSync(LEARNED_FILE, 'utf-8');
    }
    
    // 找到要移动的单词行
    const movedWords = [];
    const wordsSet = new Set(wordsToMove.map(w => w.toLowerCase()));
    const linesToRemove = new Set();
    const wordLines = [];  // 保存要移动的行内容
    
    for (let i = 0; i < unlearnedLines.length; i++) {
      const line = unlearnedLines[i];
      const wordData = parseTableRow(line);
      if (wordData && wordsSet.has(wordData.word.toLowerCase())) {
        linesToRemove.add(i);
        movedWords.push(wordData.word);
        wordLines.push(line);
      }
    }
    
    if (movedWords.length === 0) {
      return { success: false, message: '未找到要移动的单词' };
    }
    
    // 从未记住文件中移除这些行
    const newUnlearnedLines = unlearnedLines.filter((_, i) => !linesToRemove.has(i));
    
    // 添加到已记住文件
    const today = getTodayDateCST();
    const masteredSection = `
> [!success] 📅 ${today} 掌握
> | 单词 | 意思 | 记忆技巧/例句 |
> |------|------|----------------|
${wordLines.join('\n')}
`;
    
    // 在已记住文件开头添加（标题之后）
    if (learnedContent.trim()) {
      // 找到第一个 callout 或在开头添加
      const firstCalloutIndex = learnedContent.indexOf('> [!');
      if (firstCalloutIndex > 0) {
        learnedContent = learnedContent.slice(0, firstCalloutIndex) + masteredSection + '\n' + learnedContent.slice(firstCalloutIndex);
      } else {
        learnedContent = learnedContent + '\n' + masteredSection;
      }
    } else {
      learnedContent = `# 已记住单词

> 完成4次艾宾浩斯复习的单词会自动移到这里

${masteredSection}`;
    }
    
    // 写入文件
    fs.writeFileSync(UNLEARNED_FILE, newUnlearnedLines.join('\n'), 'utf-8');
    fs.writeFileSync(LEARNED_FILE, learnedContent, 'utf-8');
    
    return {
      success: true,
      moved: movedWords,
      count: movedWords.length,
      message: `已将 ${movedWords.length} 个单词移到已记住`
    };
  } catch (error) {
    console.error('移动单词失败:', error);
    return { success: false, message: error.message };
  }
}

/**
 * 解析 Markdown 表格行，提取单词数据
 * Obsidian callout 格式: > | 单词 | 意思 | 例句 |
 */
function parseTableRow(line) {
  // 移除 callout 前缀 "> "
  const cleanLine = line.replace(/^>\s*/, '');
  
  // 跳过表头行和分隔行
  if (cleanLine.includes('---') || 
      (cleanLine.includes('单词') && cleanLine.includes('意思')) ||
      (cleanLine.includes('短语') && cleanLine.includes('意思'))) {
    return null;
  }
  
  // 解析表格行: | word | meaning | example |
  const match = cleanLine.match(/^\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|?\s*$/);
  if (!match) return null;
  
  const word = match[1].trim();
  const meaning = match[2].trim();
  const example = match[3].trim();
  
  // 过滤掉空行或表头
  if (!word || word === '单词' || word === '短语') return null;
  
  return { word, meaning, example };
}

/**
 * 解析整个 Markdown 文件，提取所有单词
 */
function parseMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const words = [];
    let currentDate = null;
    let currentSection = null;
    
    for (const line of lines) {
      // 检测日期段落 (如: > [!abstract] 📅 2026-03-27 露营主题)
      const dateMatch = line.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        currentDate = dateMatch[1];
        // 提取主题描述
        const topicMatch = line.match(/\d{4}-\d{2}-\d{2}\s*(.+)$/);
        currentSection = topicMatch ? topicMatch[1].trim() : null;
        continue;
      }
      
      // 检测其他 callout 段落 (如: > [!example] 📘 常用短语)
      const sectionMatch = line.match(/>\s*\[!(\w+)\]\s*(.+)$/);
      if (sectionMatch && !line.includes('📅')) {
        currentSection = sectionMatch[2].trim();
        currentDate = null; // 非日期分组
        continue;
      }
      
      // 解析表格行
      const wordData = parseTableRow(line);
      if (wordData) {
        words.push({
          ...wordData,
          date: currentDate,
          section: currentSection
        });
      }
    }
    
    return words;
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error.message);
    return [];
  }
}

/**
 * 获取所有单词（未记住 + 已记住）
 */
function getAllWords() {
  const unlearned = getUnlearnedWords();
  const learned = getLearnedWords();
  return [...unlearned, ...learned];
}

/**
 * 获取未记住的单词
 */
function getUnlearnedWords() {
  return parseMarkdownFile(UNLEARNED_FILE).map(w => ({
    ...w,
    status: 'unlearned'
  }));
}

/**
 * 获取已记住的单词
 */
function getLearnedWords() {
  return parseMarkdownFile(LEARNED_FILE).map(w => ({
    ...w,
    status: 'learned'
  }));
}

/**
 * 获取统计数据
 */
function getStats() {
  const unlearned = getUnlearnedWords();
  const learned = getLearnedWords();
  
  // 按日期统计
  const byDate = {};
  [...unlearned, ...learned].forEach(w => {
    if (w.date) {
      byDate[w.date] = (byDate[w.date] || 0) + 1;
    }
  });
  
  return {
    total: unlearned.length + learned.length,
    unlearned: unlearned.length,
    learned: learned.length,
    progress: learned.length > 0 
      ? Math.round((learned.length / (unlearned.length + learned.length)) * 100) 
      : 0,
    byDate,
    lastUpdated: new Date().toISOString()
  };
}

module.exports = {
  getAllWords,
  getUnlearnedWords,
  getLearnedWords,
  getStats,
  moveToLearned,
  OBSIDIAN_PATH
};
