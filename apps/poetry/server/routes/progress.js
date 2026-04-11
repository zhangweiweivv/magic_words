/**
 * Progress overview API route.
 * GET /api/progress/overview — aggregates all collections + article states
 */
const express = require('express');
const router = express.Router();
const { listCollections, parseCollection } = require('../services/catalog');
const { readJson } = require('../services/storage');
const { buildArticleSummary } = require('../services/articleSummary');
const { statePath } = require('./helpers');

// GET /api/progress/overview
router.get('/api/progress/overview', (_req, res) => {
  const collectionNames = listCollections();

  const collections = collectionNames.map(name => {
    const parsed = parseCollection(name);
    if (!parsed || !parsed.articles) {
      return { name, stats: { total: 0, active: 0, graduated: 0, not_started: 0 }, articles: [] };
    }

    const articles = parsed.articles.map(article => {
      const state = readJson(statePath(article.articleId), null);
      return buildArticleSummary({ article, state });
    });

    const stats = { total: articles.length, active: 0, graduated: 0, not_started: 0 };
    for (const a of articles) {
      if (a.status === 'active') stats.active++;
      else if (a.status === 'graduated') stats.graduated++;
      else stats.not_started++;
    }

    return { name, stats, articles };
  });

  // Compute overall totals
  const overall = { total: 0, active: 0, graduated: 0, not_started: 0 };
  for (const c of collections) {
    overall.total += c.stats.total;
    overall.active += c.stats.active;
    overall.graduated += c.stats.graduated;
    overall.not_started += c.stats.not_started;
  }

  res.json({ overall, collections });
});

module.exports = router;
