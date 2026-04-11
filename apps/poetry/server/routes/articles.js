/**
 * Catalog API routes.
 * GET /api/catalog/collections — list all collections
 * GET /api/catalog/:collection — list articles in a collection
 */
const express = require('express');
const router = express.Router();
const { listCollections, parseCollection } = require('../services/catalog');

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

module.exports = router;
