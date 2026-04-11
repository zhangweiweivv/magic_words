/**
 * Recommendation API route.
 * GET /api/recommend/next — returns the next recommended article for the active collection.
 * Read-only: does not advance rotation cursor or modify state.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { listCollections, parseCollection } = require('../services/catalog');
const { getActiveCollection } = require('../services/collections');
const { getNextArticle } = require('../services/rotation');
const { readJson } = require('../services/storage');
const paths = require('../services/paths');

/**
 * Gather article states grouped by collection from the state directory.
 * @returns {Record<string, Array<{articleId: string, status: string, collection: string}>>}
 */
function getArticleStatesByCollection() {
  let files;
  try {
    fs.mkdirSync(paths.STATE_ROOT, { recursive: true });
    files = fs.readdirSync(paths.STATE_ROOT).filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'));
  } catch {
    files = [];
  }

  const byCollection = {};
  for (const f of files) {
    const state = readJson(path.join(paths.STATE_ROOT, f));
    if (!state || !state.collection) continue;
    if (!byCollection[state.collection]) byCollection[state.collection] = [];
    byCollection[state.collection].push(state);
  }
  return byCollection;
}

// GET /api/recommend/next
router.get('/api/recommend/next', (_req, res) => {
  // 1. List collections and find the active one
  const collections = listCollections();
  if (collections.length === 0) {
    return res.json({ recommendation: null, reason: 'no_collections' });
  }

  const articleStatesByCollection = getArticleStatesByCollection();
  const activeCollection = getActiveCollection({ collections, articleStatesByCollection });

  if (!activeCollection) {
    return res.json({ recommendation: null, reason: 'all_graduated' });
  }

  // 2. Parse the catalog for the active collection, grouped by section (topic)
  const parsed = parseCollection(activeCollection);
  if (!parsed || !parsed.articles || parsed.articles.length === 0) {
    return res.json({ recommendation: null, reason: 'empty_collection' });
  }

  // Group articles by section (topic) for rotation
  const catalog = {};
  for (const article of parsed.articles) {
    const topic = article.section || '未分类';
    if (!catalog[topic]) catalog[topic] = [];
    catalog[topic].push({ articleId: article.articleId, topic, title: article.title });
  }

  // 3. Determine which articles are already started
  const startedIds = new Set();
  let stateFiles;
  try {
    stateFiles = fs.readdirSync(paths.STATE_ROOT).filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'));
  } catch {
    stateFiles = [];
  }
  for (const f of stateFiles) {
    // articleId is filename without .json
    startedIds.add(f.replace(/\.json$/, ''));
  }

  // 4. Use rotation to find next article (stable recommendation):
  //    DO NOT advance cursor on GET; only advance when user actually starts learning.
  const cursorFile = path.join(paths.STATE_ROOT, '_rotation_cursor.json');
  const next = getNextArticle({
    collection: activeCollection,
    catalog,
    startedIds,
    cursorFile,
    advanceCursor: false,
  });

  if (!next) {
    return res.json({ recommendation: null, reason: 'collection_exhausted' });
  }

  res.json({
    recommendation: {
      articleId: next.articleId,
      title: next.title,
      topic: next.topic,
      collection: activeCollection,
    },
  });
});

module.exports = router;
