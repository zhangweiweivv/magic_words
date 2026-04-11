/**
 * Catalog API routes.
 * GET /api/catalog/collections — list all collections
 * GET /api/catalog/:collection — list articles in a collection
 */
const express = require('express');
const router = express.Router();
const { listCollections, parseCollection } = require('../services/catalog');
const { readArticleContent } = require('../services/content');
const { isValidArticleId } = require('./helpers');

router.get('/api/catalog/collections', (_req, res) => {
  const collections = listCollections();
  res.json({ collections });
});

router.get('/api/catalog/:collection', (req, res) => {
  const { collection } = req.params;
  const result = parseCollection(decodeURIComponent(collection));
  if (!result) {
    return res.status(404).json({ error: `Collection '${collection}' not found` });
  }
  res.json(result);
});

// Article content preview
// GET /api/article/:articleId/content
router.get('/api/article/:articleId/content', (req, res) => {
  const { articleId } = req.params;
  if (!isValidArticleId(articleId)) {
    return res.status(400).json({ error: 'Invalid articleId' });
  }

  const data = readArticleContent(articleId);
  if (!data) {
    return res.status(404).json({ error: `Content for '${articleId}' not found` });
  }

  res.json({
    articleId: data.articleId,
    collection: data.collection,
    title: data.title,
    sections: data.sections,
  });
});

module.exports = router;
