/**
 * Path configuration for the Poetry module.
 * Read-only root: 小红本 (Obsidian poetry content)
 * State root: 可可古诗文 (learning state + logs)
 *
 * Exports are mutable so tests can override paths.
 */
const path = require('path');

const OBSIDIAN_BASE = '/Users/vvhome/vv_obsidian/vv_obsidian';

module.exports = {
  CONTENT_ROOT: path.join(OBSIDIAN_BASE, '小红本'),
  STATE_ROOT: path.join(OBSIDIAN_BASE, '可可pet', '可可古诗文'),
};
