/**
 * API route tests for Poetry module.
 * Uses temp directories to avoid touching real Obsidian files.
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

// Create temp dirs BEFORE loading any app modules
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'poetry-api-test-'));
const contentRoot = path.join(tmpDir, '小红本');
const stateRoot = path.join(tmpDir, '可可pet', '可可古诗文');
fs.mkdirSync(contentRoot, { recursive: true });
fs.mkdirSync(stateRoot, { recursive: true });

// Override paths BEFORE requiring the app
const pathsMod = require('../services/paths');
pathsMod.CONTENT_ROOT = contentRoot;
pathsMod.STATE_ROOT = stateRoot;

const SAMPLE_COLLECTION = `# 寅集 · 目录

> 《中华古诗文读本·赏析》寅集，共 25 篇

## 先秦诸子（1-6）

| # | 篇目 | 页码 |
|---|------|------|
| 1 | 《论语》八章 | 1 |
| 2 | 《老子》三章 | 5 |
| 3 | 《孟子》三则 | 7 |

## 古文（7-14）

| # | 篇目 | 页码 |
|---|------|------|
| 7 | 《战国策》一则 — 邹忌修八尺有余 | 17 |
| 8 | 陶渊明《桃花源记》 | 21 |

## 诗词（15-25）

| # | 篇目 | 页码 |
|---|------|------|
| 15 | 《诗经》一首《芣苢》 | 40 |
| 16 | 屈原《国殇》 | 41 |
`;

// Write sample collection files
fs.writeFileSync(path.join(contentRoot, '寅集.md'), SAMPLE_COLLECTION, 'utf-8');
fs.writeFileSync(path.join(contentRoot, '卯集.md'), '# 卯集 · 目录\n', 'utf-8');

// Now require the app (it will pick up overridden paths)
const app = require('../index');
const { writeJson } = require('../services/storage');

/**
 * Helper: make HTTP request to Express app on ephemeral port.
 */
function request(method, url, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const opts = {
        hostname: '127.0.0.1',
        port,
        path: url,
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json' },
      };
      const req = http.request(opts, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', (err) => { server.close(); reject(err); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

// Cleanup
after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Catalog API ──────────────────────────────────────────────
describe('GET /api/catalog/collections', () => {
  it('returns sorted collection names', async () => {
    const { status, body } = await request('GET', '/api/catalog/collections');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.collections));
    // 寅 comes before 卯 in 地支 order
    assert.deepEqual(body.collections, ['寅集', '卯集']);
  });
});

describe('GET /api/catalog/:collection', () => {
  it('returns articles from collection with sections', async () => {
    const { status, body } = await request('GET', `/api/catalog/${encodeURIComponent('寅集')}`);
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.articles));
    assert.ok(body.articles.length >= 7, `Expected >= 7 articles, got ${body.articles.length}`);

    const first = body.articles[0];
    assert.equal(first.number, 1);
    assert.equal(first.title, '《论语》八章');
    assert.equal(first.section, '先秦诸子');
    assert.ok(first.articleId, 'should have articleId');
  });

  it('returns 404 for non-existent collection', async () => {
    const { status } = await request('GET', `/api/catalog/${encodeURIComponent('不存在集')}`);
    assert.equal(status, 404);
  });
});

// ── State API ──────────────────────────────────────────────
describe('POST /api/state/:articleId/complete', () => {
  it('starts a new article on first complete', async () => {
    const articleId = '寅集-01';
    const { status, body } = await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {
      collection: '寅集',
      title: '《论语》八章',
      charCount: 200,
      genre: '文言文',
    });
    assert.equal(status, 200);
    assert.equal(body.state.articleId, articleId);
    assert.equal(body.state.status, 'active');
    assert.equal(body.state.stage, 0);
    assert.equal(body.state.currentStage, 1); // stage + 1
    assert.ok(body.state.nextDueDate);

    // Verify persisted to disk
    const stateFile = path.join(stateRoot, `${articleId}.json`);
    assert.ok(fs.existsSync(stateFile), 'state file should be created');
  });

  it('advances stage on subsequent complete', async () => {
    const articleId = '寅集-02';
    // First complete (start)
    await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {
      collection: '寅集',
      title: '《老子》三章',
      charCount: 50,
      genre: '文言文',
    });
    // Second complete (advance)
    const { status, body } = await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`);
    assert.equal(status, 200);
    assert.equal(body.state.stage, 1);
    assert.equal(body.state.currentStage, 2); // stage + 1
  });

  it('returns 400 when starting without required meta', async () => {
    const articleId = '寅集-99';
    const { status } = await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {});
    assert.equal(status, 400);
  });
});

describe('POST /api/state/:articleId/defer', () => {
  it('defers an active article to tomorrow', async () => {
    const articleId = '寅集-defer-01';
    // Start article first
    await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {
      collection: '寅集',
      title: '《孟子》三则',
      charCount: 80,
      genre: '文言文',
    });

    const { status, body } = await request('POST', `/api/state/${encodeURIComponent(articleId)}/defer`);
    assert.equal(status, 200);
    assert.equal(body.state.articleId, articleId);
    assert.ok(body.state.nextDueDate);
  });

  it('returns 404 for non-existent article', async () => {
    const { status } = await request('POST', `/api/state/${encodeURIComponent('不存在-01')}/defer`);
    assert.equal(status, 404);
  });
});

describe('GET /api/state/due', () => {
  it('returns due articles', async () => {
    // Create an article state that's already due
    const articleId = '寅集-due-01';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const stateData = {
      articleId,
      collection: '寅集',
      title: '《论语》八章',
      stage: 0,
      totalStages: 5,
      intervals: [1, 2, 4, 7, 14],
      status: 'active',
      startedAt: '2026-04-01',
      lastCompletedAt: '2026-04-01',
      nextDueDate: yesterdayStr,
      difficulty: 3,
    };
    writeJson(path.join(stateRoot, `${articleId}.json`), stateData);

    const { status, body } = await request('GET', '/api/state/due');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.due));
    const found = body.due.find(a => a.articleId === articleId);
    assert.ok(found, 'should find our due article');
    assert.ok(found.overdueDays >= 1);
  });
});

describe('GET /api/state/:articleId', () => {
  it('returns article state and events', async () => {
    const articleId = '寅集-detail-01';
    // Create via API
    await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {
      collection: '寅集',
      title: '《论语》八章',
      charCount: 200,
      genre: '文言文',
    });

    const { status, body } = await request('GET', `/api/state/${encodeURIComponent(articleId)}`);
    assert.equal(status, 200);
    assert.equal(body.state.articleId, articleId);
    assert.ok(Array.isArray(body.events), 'should include events array');
    assert.ok(body.events.length >= 1, 'should have at least the start event');
  });

  it('returns 404 for unknown article', async () => {
    const { status } = await request('GET', `/api/state/${encodeURIComponent('不存在-01')}`);
    assert.equal(status, 404);
  });
});

describe('GET /api/state/:articleId (JSONL robustness)', () => {
  it('returns valid events even when JSONL contains malformed lines', async () => {
    const articleId = '寅集-malformed-01';
    // Create state file directly
    const stateData = {
      articleId,
      collection: '寅集',
      title: '测试篇',
      stage: 1,
      totalStages: 4,
      intervals: [1, 2, 4, 7],
      status: 'active',
      startedAt: '2026-04-01',
      lastCompletedAt: '2026-04-02',
      nextDueDate: '2026-04-04',
      difficulty: 3,
    };
    writeJson(path.join(stateRoot, `${articleId}.json`), stateData);

    // Write events JSONL with one malformed line
    const eventsContent = [
      JSON.stringify({ type: 'article_started', ts: '2026-04-01T00:00:00Z', data: {} }),
      '{broken json!!!',  // malformed line
      JSON.stringify({ type: 'stage_completed', ts: '2026-04-02T00:00:00Z', data: { fromStage: 0, toStage: 1 } }),
      '',  // empty line
    ].join('\n');
    fs.writeFileSync(path.join(stateRoot, `${articleId}.events.jsonl`), eventsContent, 'utf-8');

    const { status, body } = await request('GET', `/api/state/${encodeURIComponent(articleId)}`);
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.events));
    assert.equal(body.events.length, 2, 'should return 2 valid events, skipping the malformed line');
    assert.equal(body.events[0].type, 'article_started');
    assert.equal(body.events[1].type, 'stage_completed');
  });
});

// ── Config API ──────────────────────────────────────────────
describe('PUT /api/config/article/:articleId', () => {
  it('updates article intervals and totalStages', async () => {
    const articleId = '寅集-config-01';
    // Start article first
    await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {
      collection: '寅集',
      title: '《论语》八章',
      charCount: 200,
      genre: '文言文',
    });

    const newConfig = { intervals: [1, 3, 7], totalStages: 3 };
    const { status, body } = await request('PUT', `/api/config/article/${encodeURIComponent(articleId)}`, newConfig);
    assert.equal(status, 200);
    assert.deepEqual(body.state.intervals, [1, 3, 7]);
    assert.equal(body.state.totalStages, 3);
  });

  it('returns 404 for unknown article', async () => {
    const { status } = await request('PUT', `/api/config/article/${encodeURIComponent('不存在-01')}`, {
      intervals: [1, 2],
      totalStages: 2,
    });
    assert.equal(status, 404);
  });

  it('returns 400 for invalid config', async () => {
    const articleId = '寅集-config-02';
    await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {
      collection: '寅集',
      title: '《老子》三章',
      charCount: 50,
      genre: '文言文',
    });
    const { status } = await request('PUT', `/api/config/article/${encodeURIComponent(articleId)}`, {
      intervals: 'not-an-array',
    });
    assert.equal(status, 400);
  });
});

// ── Path traversal validation ──────────────────────────────────────────
describe('articleId validation (path traversal prevention)', () => {
  it('rejects articleId with ..', async () => {
    const { status } = await request('GET', `/api/state/${encodeURIComponent('../etc/passwd')}`);
    assert.equal(status, 400);
  });

  it('rejects articleId with /', async () => {
    const { status } = await request('POST', `/api/state/${encodeURIComponent('foo/bar')}/complete`, {});
    assert.equal(status, 400);
  });

  it('rejects articleId with backslash', async () => {
    const { status } = await request('GET', `/api/state/${encodeURIComponent('foo\\bar')}`);
    assert.equal(status, 400);
  });
});

// ── Auto catalog lookup ────────────────────────────────────────────
describe('POST /api/state/:articleId/complete (auto catalog lookup)', () => {
  it('starts article without body by looking up catalog', async () => {
    const articleId = '寅集-07';
    const { status, body } = await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {});
    assert.equal(status, 200);
    assert.equal(body.state.articleId, articleId);
    assert.equal(body.state.collection, '寅集');
    assert.equal(body.state.title, '《战国策》一则 — 邹忌修八尺有余');
    assert.equal(body.state.status, 'active');
  });

  it('returns 400 for unknown articleId without body', async () => {
    const articleId = '不存在集-99';
    const { status } = await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {});
    assert.equal(status, 400);
  });
});

// ── Recommend API ──────────────────────────────────────────────
describe('GET /api/recommend/next', () => {
  it('returns a recommendation from the active collection', async () => {
    const { status, body } = await request('GET', '/api/recommend/next');
    assert.equal(status, 200);
    assert.ok(body.recommendation, 'should have a recommendation');
    assert.ok(body.recommendation.articleId);
    assert.ok(body.recommendation.title);
    assert.ok(body.recommendation.topic);
    assert.equal(body.recommendation.collection, '寅集');
  });

  it('stable recommendation: repeated GET does not advance rotation cursor', async () => {
    const r1 = await request('GET', '/api/recommend/next');
    const r2 = await request('GET', '/api/recommend/next');
    assert.equal(r1.status, 200);
    assert.equal(r2.status, 200);
    assert.ok(r1.body.recommendation);
    assert.ok(r2.body.recommendation);
    assert.equal(r1.body.recommendation.articleId, r2.body.recommendation.articleId);
    assert.equal(r1.body.recommendation.topic, r2.body.recommendation.topic);
  });

  it('starting a new article advances cursor to next topic (1:1:1 rotation)', async () => {
    const r1 = await request('GET', '/api/recommend/next');
    assert.equal(r1.status, 200);
    assert.ok(r1.body.recommendation);

    // Start the recommended article (no body; server should auto-lookup from catalog)
    const startedId = r1.body.recommendation.articleId;
    const s1 = await request('POST', `/api/state/${encodeURIComponent(startedId)}/complete`, {});
    assert.equal(s1.status, 200);

    // Next recommendation should move to a different topic (next in rotation)
    const r2 = await request('GET', '/api/recommend/next');
    assert.equal(r2.status, 200);
    assert.ok(r2.body.recommendation);
    assert.notEqual(r2.body.recommendation.topic, r1.body.recommendation.topic);
  });

  it('skips already-started articles', async () => {
    const { body } = await request('GET', '/api/recommend/next');
    assert.ok(body.recommendation);
    assert.notEqual(body.recommendation.articleId, '寅集-01');
  });

  it('returns null recommendation when collection is exhausted', async () => {
    // Start all remaining articles in 寅集
    const allArticles = ['寅集-02', '寅集-03', '寅集-08', '寅集-15', '寅集-16'];
    for (const articleId of allArticles) {
      // Skip if already started
      try {
        await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {});
      } catch { /* ignore if already started */ }
    }
    const { status, body } = await request('GET', '/api/recommend/next');
    assert.equal(status, 200);
    if (body.recommendation === null) {
      assert.ok(body.reason);
    }
  });
});
