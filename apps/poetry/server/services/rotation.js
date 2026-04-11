/**
 * Topic rotation for new-article recommendations.
 *
 * Round-robin across genres/topics within the active collection.
 * Persistent cursor stored per-collection in a JSON file.
 * Skips exhausted topics (all articles already started).
 */

const { readJson, writeJson } = require('./storage');

/**
 * Get the next recommended article from the catalog using round-robin rotation.
 *
 * @param {object} params
 * @param {string} params.collection - active collection name
 * @param {Record<string, Array<{articleId:string, topic:string}>>} params.catalog - articles grouped by topic
 * @param {Set<string>} params.startedIds - set of already-started article IDs
 * @param {string} params.cursorFile - path to persistent cursor JSON file
 * @returns {{ articleId: string, topic: string }|null} next article, or null if all exhausted
 */
function getNextArticle({ collection, catalog, startedIds, cursorFile, advanceCursor = true }) {
  const topics = Object.keys(catalog);
  if (topics.length === 0) return null;

  // Load cursor state
  const allCursors = readJson(cursorFile, {});
  const cursor = allCursors[collection] || { topicIndex: 0 };

  let topicIndex = cursor.topicIndex % topics.length;
  let attempts = 0;

  while (attempts < topics.length) {
    const topic = topics[topicIndex];
    const articles = catalog[topic] || [];

    // Find first un-started article in this topic
    const next = articles.find(a => !startedIds.has(a.articleId));
    if (next) {
      if (advanceCursor) {
        // Advance cursor to next topic for next call
        allCursors[collection] = { topicIndex: (topicIndex + 1) % topics.length };
        writeJson(cursorFile, allCursors);
      }
      return next;
    }

    // Topic exhausted, try next
    topicIndex = (topicIndex + 1) % topics.length;
    attempts++;
  }

  // All topics exhausted
  return null;
}

/**
 * Advance the rotation cursor to the topic AFTER the selected topic.
 * Used to implement "stable recommendation": GET recommend does NOT advance;
 * only when a user actually starts learning do we advance the cursor.
 */
function advanceCursorAfterSelection({ collection, catalog, cursorFile, selectedTopic }) {
  const topics = Object.keys(catalog);
  if (topics.length === 0) return;
  const idx = topics.indexOf(selectedTopic);
  if (idx === -1) return;

  const allCursors = readJson(cursorFile, {});
  allCursors[collection] = { topicIndex: (idx + 1) % topics.length };
  writeJson(cursorFile, allCursors);
}

module.exports = { getNextArticle, advanceCursorAfterSelection };
