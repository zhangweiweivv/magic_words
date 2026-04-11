/**
 * Collections discovery and serial progression.
 *
 * Collections map to markdown files in 小红本/ root.
 * Sort order: 地支 (Earthly Branches) natural order first, then localeCompare.
 * Active collection: first collection where not all articles are graduated.
 */

const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * Sort collection names: 地支 in natural order, then others by localeCompare.
 * @param {string[]} names
 * @returns {string[]}
 */
function sortCollections(names) {
  return [...names].sort((a, b) => {
    const idxA = EARTHLY_BRANCHES.indexOf(a);
    const idxB = EARTHLY_BRANCHES.indexOf(b);
    const isEBA = idxA >= 0;
    const isEBB = idxB >= 0;

    if (isEBA && isEBB) return idxA - idxB;
    if (isEBA) return -1;
    if (isEBB) return 1;
    return a.localeCompare(b, 'zh');
  });
}

/**
 * Determine the active collection (first not fully graduated).
 * @param {{ collections: string[], articleStatesByCollection: Record<string, Array<{status:string}>> }} params
 * @returns {string|null} active collection name, or null if all graduated
 */
function getActiveCollection({ collections, articleStatesByCollection }) {
  for (const name of collections) {
    const states = articleStatesByCollection[name];
    // No states or empty array → not started → active
    if (!states || states.length === 0) return name;
    // If any article is not graduated → active
    const allGraduated = states.every(s => s.status === 'graduated');
    if (!allGraduated) return name;
  }
  return null;
}

module.exports = { sortCollections, getActiveCollection, EARTHLY_BRANCHES };
