const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { getNextArticle } = require('../services/rotation');

describe('rotation', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'poetry-rotation-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const makeCatalog = (topics) => {
    // topics: { topicName: [articleId, ...] }
    const result = {};
    for (const [topic, ids] of Object.entries(topics)) {
      result[topic] = ids.map(id => ({ articleId: id, topic }));
    }
    return result;
  };

  it('recommends first article from first topic when no cursor', () => {
    const catalog = makeCatalog({
      '山水': ['a1', 'a2'],
      '送别': ['b1', 'b2'],
      '思乡': ['c1'],
    });
    const result = getNextArticle({
      collection: '子',
      catalog,
      startedIds: new Set(),
      cursorFile: path.join(tmpDir, 'rotation.json'),
    });
    assert.strictEqual(result.articleId, 'a1');
  });

  it('rotates through topics in round-robin (N=3)', () => {
    const catalog = makeCatalog({
      '山水': ['a1', 'a2', 'a3'],
      '送别': ['b1', 'b2', 'b3'],
      '思乡': ['c1', 'c2', 'c3'],
    });
    const cursorFile = path.join(tmpDir, 'rotation.json');
    const started = new Set();
    const results = [];

    for (let i = 0; i < 6; i++) {
      const rec = getNextArticle({ collection: '子', catalog, startedIds: started, cursorFile });
      results.push(rec.articleId);
      started.add(rec.articleId);
    }

    // Should cycle: 山水, 送别, 思乡, 山水, 送别, 思乡
    assert.strictEqual(results[0], 'a1'); // 山水
    assert.strictEqual(results[1], 'b1'); // 送别
    assert.strictEqual(results[2], 'c1'); // 思乡
    assert.strictEqual(results[3], 'a2'); // 山水
    assert.strictEqual(results[4], 'b2'); // 送别
    assert.strictEqual(results[5], 'c2'); // 思乡
  });

  it('skips exhausted topic', () => {
    const catalog = makeCatalog({
      '山水': ['a1'],
      '送别': ['b1', 'b2'],
      '思乡': ['c1', 'c2'],
    });
    const cursorFile = path.join(tmpDir, 'rotation.json');
    const started = new Set(['a1']); // 山水 already exhausted
    const results = [];

    for (let i = 0; i < 3; i++) {
      const rec = getNextArticle({ collection: '子', catalog, startedIds: started, cursorFile });
      if (!rec) break;
      results.push(rec.articleId);
      started.add(rec.articleId);
    }

    // Should skip 山水, rotate 送别 → 思乡
    assert.strictEqual(results[0], 'b1');
    assert.strictEqual(results[1], 'c1');
    assert.strictEqual(results[2], 'b2');
  });

  it('returns null when all articles exhausted', () => {
    const catalog = makeCatalog({
      '山水': ['a1'],
      '送别': ['b1'],
    });
    const cursorFile = path.join(tmpDir, 'rotation.json');
    const started = new Set(['a1', 'b1']);

    const result = getNextArticle({ collection: '子', catalog, startedIds: started, cursorFile });
    assert.strictEqual(result, null);
  });

  it('uses separate cursors per collection', () => {
    const catalog = makeCatalog({
      '山水': ['a1', 'a2'],
      '送别': ['b1', 'b2'],
    });
    const cursorFile = path.join(tmpDir, 'rotation.json');

    // Advance cursor for collection '子'
    const r1 = getNextArticle({ collection: '子', catalog, startedIds: new Set(), cursorFile });
    assert.strictEqual(r1.articleId, 'a1');

    // Different collection '丑' should start fresh
    const r2 = getNextArticle({ collection: '丑', catalog, startedIds: new Set(), cursorFile });
    assert.strictEqual(r2.articleId, 'a1');
  });

  it('handles N=4 and N=5 topics', () => {
    const catalog = makeCatalog({
      'A': ['a1'],
      'B': ['b1'],
      'C': ['c1'],
      'D': ['d1'],
      'E': ['e1'],
    });
    const cursorFile = path.join(tmpDir, 'rotation.json');
    const started = new Set();
    const results = [];

    for (let i = 0; i < 5; i++) {
      const rec = getNextArticle({ collection: '子', catalog, startedIds: started, cursorFile });
      results.push(rec.articleId);
      started.add(rec.articleId);
    }

    assert.deepStrictEqual(results, ['a1', 'b1', 'c1', 'd1', 'e1']);
  });
});
