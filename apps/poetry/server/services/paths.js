/**
 * Path configuration for the Poetry module.
 * Read-only root: 小红本 (Obsidian poetry content)
 * State root: 可可古诗文 (learning state + logs)
 *
 * Override the Obsidian base with env var POETRY_OBSIDIAN_BASE.
 * Exports are mutable so tests can override paths.
 */
const path = require('path');

const DEFAULT_OBSIDIAN_BASE = '/Users/vvhome/vv_obsidian/vv_obsidian';
const OBSIDIAN_BASE = process.env.POETRY_OBSIDIAN_BASE || DEFAULT_OBSIDIAN_BASE;

module.exports = {
  CONTENT_ROOT: path.join(OBSIDIAN_BASE, '小红本'),
  STATE_ROOT: path.join(OBSIDIAN_BASE, '可可pet', '可可古诗文'),
};
