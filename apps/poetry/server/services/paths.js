/**
 * Path configuration for the Poetry module.
 * Read-only root: 小红本 (Obsidian poetry content)
 * State root: 可可古诗文 (learning state + logs)
 */
const path = require('path');

const OBSIDIAN_BASE = '/Users/vvhome/vv_obsidian/vv_obsidian';

const CONTENT_ROOT = path.join(OBSIDIAN_BASE, '小红本');
const STATE_ROOT = path.join(OBSIDIAN_BASE, '可可pet', '可可古诗文');

module.exports = {
  CONTENT_ROOT,
  STATE_ROOT,
};
