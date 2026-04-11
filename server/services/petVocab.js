const fs = require('fs');
const path = require('path');

const VOCAB_PATH = path.join(
  process.env.HOME || '/Users/vvhome',
  'vv_obsidian/vv_obsidian/可可pet/可可单词本/PET官方单词库.md'
);

let cachedMap = null;

/**
 * Parse PET官方单词库.md and build a Map<string, 'A1'|'A2'|'B1'|'B1+'>
 * with lowercase word keys. B2/B2+ levels are merged into 'B1+'.
 * Result is cached in module scope.
 */
function buildCefrMap() {
  if (cachedMap) return cachedMap;

  const content = fs.readFileSync(VOCAB_PATH, 'utf-8');
  const lines = content.split('\n');
  const map = new Map();

  let currentLevel = null;

  for (const line of lines) {
    // Detect level headers: ## 🏷️ A1 级别, ## 🏷️ A2 级别, ## 🏷️ B1 级别, ## 🏷️ B2 级别
    const headerMatch = line.match(/^## 🏷️\s+(A1|A2|B1|B2)\s+级别/);
    if (headerMatch) {
      const raw = headerMatch[1];
      currentLevel = (raw === 'B2') ? 'B1+' : raw;
      continue;
    }

    // Parse table rows: | # | word | pos | freq |
    if (!currentLevel) continue;
    if (!line.startsWith('|')) continue;

    const cells = line.split('|').map(c => c.trim());
    // cells[0] is empty (before first |), cells[1] is #, cells[2] is word
    if (cells.length < 4) continue;
    // Skip header/separator rows
    if (cells[1] === '#' || cells[1].startsWith('-')) continue;

    const word = cells[2];
    if (!word || word.startsWith('-')) continue;

    map.set(word.toLowerCase(), currentLevel);
  }

  cachedMap = map;
  return map;
}

module.exports = { buildCefrMap };
