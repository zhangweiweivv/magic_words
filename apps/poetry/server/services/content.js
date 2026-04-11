/**
 * Read per-article content markdown from Obsidian 小红本.
 * Expected file location:
 *   CONTENT_ROOT/<collection>/<articleId>-*.md
 *
 * The file itself follows the template we generated:
 *   # title
 *   ## 原文
 *   ...
 *   ## 注释
 *   ...
 *   ## 译文
 *   ...
 *   ## 赏析
 *   ...
 */

const fs = require('fs');
const path = require('path');
const paths = require('./paths');

function extractTitle(markdown) {
  const m = markdown.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : '';
}

function extractSection(markdown, heading) {
  const re = new RegExp(`^##\\s+${heading}\\s*$`, 'm');
  const m = re.exec(markdown);
  if (!m) return '';
  const start = m.index + m[0].length;
  const rest = markdown.slice(start);
  const next = rest.match(/^##\s+.+\s*$/m);
  const body = next ? rest.slice(0, next.index) : rest;
  return body.trim();
}

function getCollectionFromArticleId(articleId) {
  const idx = articleId.lastIndexOf('-');
  if (idx === -1) return null;
  return articleId.slice(0, idx);
}

function findContentFile({ collection, articleId }) {
  const dir = path.join(paths.CONTENT_ROOT, collection);
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch {
    return null;
  }

  const prefix = `${articleId}-`;
  const match = files.find((f) => f.startsWith(prefix) && f.endsWith('.md'));
  return match ? path.join(dir, match) : null;
}

function readArticleContent(articleId) {
  const collection = getCollectionFromArticleId(articleId);
  if (!collection) return null;

  const fp = findContentFile({ collection, articleId });
  if (!fp) return null;

  const markdown = fs.readFileSync(fp, 'utf-8');

  return {
    articleId,
    collection,
    title: extractTitle(markdown),
    sections: {
      original: extractSection(markdown, '原文'),
      notes: extractSection(markdown, '注释'),
      translation: extractSection(markdown, '译文'),
      appreciation: extractSection(markdown, '赏析'),
    },
    filePath: fp,
  };
}

module.exports = { readArticleContent };
