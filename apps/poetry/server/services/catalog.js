/**
 * Catalog parser: reads collection markdown files from 小红本/ and extracts article metadata.
 *
 * Each collection .md has sections (## headers) with markdown tables.
 * Table rows: | # | 篇目 | 页码 |
 */
const fs = require('fs');
const path = require('path');
const paths = require('./paths');
const { sortCollections } = require('./collections');

/**
 * List all collections (sorted by 地支 order).
 * Collections are .md files in CONTENT_ROOT root.
 * @returns {string[]} collection names (without .md extension)
 */
function listCollections() {
  let files;
  try {
    files = fs.readdirSync(paths.CONTENT_ROOT);
  } catch {
    return [];
  }
  const names = files
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''));

  // Extract the 地支 character (first char before '集') for sorting
  const baseNames = names.map(n => {
    const match = n.match(/^(.)集$/);
    return match ? match[1] : n;
  });
  const sorted = sortCollections(baseNames);

  // Map back to full names
  return sorted.map(base => {
    const full = names.find(n => {
      const m = n.match(/^(.)集$/);
      return m ? m[1] === base : n === base;
    });
    return full || base;
  });
}

/**
 * Parse a collection markdown file and extract articles.
 * @param {string} collectionName - e.g. '寅集'
 * @returns {{ articles: Array<{ number: number, title: string, section: string, articleId: string }> } | null}
 */
function parseCollection(collectionName) {
  const filePath = path.join(paths.CONTENT_ROOT, `${collectionName}.md`);
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  const lines = content.split('\n');
  const articles = [];
  let currentSection = '';

  for (const line of lines) {
    // Detect section headers: ## 先秦诸子（1-6）
    const sectionMatch = line.match(/^##\s+(.+?)(?:（.*?）)?$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    // Detect table rows: | 1 | 《论语》八章 | 1 |
    const rowMatch = line.match(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|$/);
    if (rowMatch) {
      const number = parseInt(rowMatch[1], 10);
      const title = rowMatch[2].trim();
      const articleId = `${collectionName}-${String(number).padStart(2, '0')}`;
      articles.push({ number, title, section: currentSection, articleId });
    }
  }

  return { articles };
}

module.exports = { listCollections, parseCollection };
