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
describe('GET /api/state/current', () => {
  it('falls back to lastCompletedAt/startedAt when events are missing', async () => {
    // state exists but no events file
    writeJson(path.join(stateRoot, `测试集-99.json`), {
      articleId: '测试集-99',
      collection: '测试集',
      title: '只有state没有events',
      stage: 0,
      totalStages: 3,
      intervals: [1, 2, 4],
      status: 'active',
      startedAt: '2026-04-01',
      lastCompletedAt: '2026-04-01',
      nextDueDate: '2026-04-02',
      difficulty: 2,
    });

    const { status, body } = await request('GET', '/api/state/current');
    assert.equal(status, 200);
    assert.ok('current' in body);
    assert.ok(body.current);
    assert.equal(body.current.articleId, '测试集-99');
  });

  it('returns article with most recent event timestamp (active vs graduated)', async () => {
    // A: active but older event
    writeJson(path.join(stateRoot, `测试集-01.json`), {
      articleId: '测试集-01',
      collection: '测试集',
      title: '更早学习',
      stage: 0,
      totalStages: 3,
      intervals: [1, 2, 4],
      status: 'active',
      startedAt: '2026-04-01',
      lastCompletedAt: '2026-04-01',
      nextDueDate: '2026-04-02',
      difficulty: 2,
    });
    fs.writeFileSync(
      path.join(stateRoot, `测试集-01.events.jsonl`),
      JSON.stringify({ type: 'article_started', articleId: '测试集-01', timestamp: '2999-01-01T00:00:00Z', data: {} }) + '\n',
      'utf-8'
    );

    // B: graduated but newer event
    writeJson(path.join(stateRoot, `测试集-02.json`), {
      articleId: '测试集-02',
      collection: '测试集',
      title: '最近学习（已毕业也算）',
      stage: 3,
      totalStages: 3,
      intervals: [1, 2, 4],
      status: 'graduated',
      startedAt: '2026-04-01',
      lastCompletedAt: '2026-04-03',
      nextDueDate: null,
      difficulty: 2,
    });
    fs.writeFileSync(
      path.join(stateRoot, `测试集-02.events.jsonl`),
      JSON.stringify({ type: 'graduated', articleId: '测试集-02', timestamp: '2999-01-02T00:00:00Z', data: {} }) + '\n',
      'utf-8'
    );

    const { status, body } = await request('GET', '/api/state/current');
    assert.equal(status, 200);
    assert.ok(body.current);
    assert.equal(body.current.articleId, '测试集-02');
    assert.equal(body.current.status, 'graduated');
  });
});

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

// ── Article Content API ─────────────────────────────────────────────
describe('GET /api/article/:articleId/content', () => {
  it('returns parsed content sections from Obsidian file', async () => {
    // Create a per-article content file under CONTENT_ROOT/<collection>/
    const articleId = '寅集-01';
    const collectionDir = path.join(contentRoot, '寅集');
    fs.mkdirSync(collectionDir, { recursive: true });
    fs.writeFileSync(
      path.join(collectionDir, `${articleId}-测试.md`),
      `# 测试标题\n\n## 原文\n\n原文行1\n原文行2\n\n## 注释\n\n注释A\n\n## 译文\n\n译文B\n\n## 赏析\n\n赏析C\n`,
      'utf-8'
    );

    const { status, body } = await request('GET', `/api/article/${encodeURIComponent(articleId)}/content`);
    assert.equal(status, 200);
    assert.equal(body.articleId, articleId);
    assert.equal(body.title, '测试标题');
    assert.ok(body.sections);
    assert.ok(body.sections.original.includes('原文行1'));
    assert.ok(body.sections.notes.includes('注释A'));
    assert.ok(body.sections.translation.includes('译文B'));
    assert.ok(body.sections.appreciation.includes('赏析C'));
  });

  it('returns 404 when content file is missing', async () => {
    const { status } = await request('GET', `/api/article/${encodeURIComponent('寅集-02')}/content`);
    assert.equal(status, 404);
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
// ── Recommend API ──────────────────────────────────────────────

// ── difficulty defaults + scheduleSource priority ──────────────────
describe('difficulty defaults + scheduleSource priority', () => {
  it('PUT /api/config/article/:articleId sets scheduleSource to override', async () => {
    const articleId = '寅集-src-01';
    // Start article first
    await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {
      collection: '寅集',
      title: '测试Source',
      charCount: 200,
      genre: '文言文',
    });
    // Verify initial scheduleSource
    const { body: initial } = await request('GET', `/api/state/${encodeURIComponent(articleId)}`);
    assert.equal(initial.state.scheduleSource, 'level_default');

    // Override via config endpoint
    const { status, body } = await request('PUT', `/api/config/article/${encodeURIComponent(articleId)}`, {
      intervals: [1, 5, 10], totalStages: 3
    });
    assert.equal(status, 200);
    assert.equal(body.state.scheduleSource, 'override');

    // Verify persisted
    const { body: after } = await request('GET', `/api/state/${encodeURIComponent(articleId)}`);
    assert.equal(after.state.scheduleSource, 'override');
  });

  it('batch apply difficulty defaults does NOT overwrite override states', async () => {
    // Start two articles with same difficulty (2)
    const overrideId = '寅集-batch-01';
    const defaultId = '寅集-batch-02';
    await request('POST', `/api/state/${encodeURIComponent(overrideId)}/complete`, {
      collection: '寅集', title: 'Override', charCount: 80, genre: '文言文',
    });
    await request('POST', `/api/state/${encodeURIComponent(defaultId)}/complete`, {
      collection: '寅集', title: 'Default', charCount: 80, genre: '文言文',
    });

    // Override one
    await request('PUT', `/api/config/article/${encodeURIComponent(overrideId)}`, {
      intervals: [1, 5, 10], totalStages: 3
    });

    // Batch apply difficulty level 2 with applyToExisting
    const { status, body } = await request('PUT', '/api/admin/difficulty/2', {
      totalStages: 3, intervals: [2, 6, 12], applyToExisting: true
    });
    assert.equal(status, 200);
    assert.ok(body.applied);
    assert.ok(body.applied.skippedOverrides >= 1, 'should skip override states');

    // Verify override state was NOT changed
    const { body: overrideState } = await request('GET', `/api/state/${encodeURIComponent(overrideId)}`);
    assert.deepEqual(overrideState.state.intervals, [1, 5, 10]);
    assert.equal(overrideState.state.scheduleSource, 'override');

    // Verify default state WAS changed
    const { body: defaultState } = await request('GET', `/api/state/${encodeURIComponent(defaultId)}`);
    assert.deepEqual(defaultState.state.intervals, [2, 6, 12]);
    assert.equal(defaultState.state.scheduleSource, 'level_default');
  });

  it('reset-to-default flips override -> level_default', async () => {
    const articleId = '寅集-reset-01';
    await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {
      collection: '寅集', title: 'ResetTest', charCount: 80, genre: '文言文',
    });
    // Override it
    await request('PUT', `/api/config/article/${encodeURIComponent(articleId)}`, {
      intervals: [1, 5, 10], totalStages: 3
    });
    const { body: before } = await request('GET', `/api/state/${encodeURIComponent(articleId)}`);
    assert.equal(before.state.scheduleSource, 'override');

    // Reset to default
    const { status, body } = await request('PUT', `/api/admin/article/${encodeURIComponent(articleId)}/reset-to-default`);
    assert.equal(status, 200);
    assert.equal(body.state.scheduleSource, 'level_default');
  });
});

// ── Admin read-only APIs ──────────────────────────────────────────
describe('GET /api/admin/difficulty/rules', () => {
  it('returns difficulty defaults', async () => {
    const { status, body } = await request('GET', '/api/admin/difficulty/rules');
    assert.equal(status, 200);
    assert.ok(body.defaults);
    assert.ok(body.defaults[1]);
    assert.ok(body.defaults[2]);
    assert.ok(body.defaults[3]);
    assert.ok(body.defaults[4]);
    assert.ok(Array.isArray(body.defaults[1].intervals));
  });
});

describe('GET /api/admin/collections', () => {
  it('returns sorted collections', async () => {
    const { status, body } = await request('GET', '/api/admin/collections');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.collections));
    assert.deepEqual(body.collections, ['寅集', '卯集']);
  });
});

describe('GET /api/admin/collection/:collection/articles', () => {
  it('returns articles with difficulty info', async () => {
    const { status, body } = await request('GET', `/api/admin/collection/${encodeURIComponent('寅集')}/articles`);
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.articles));
    assert.ok(body.articles.length >= 1);
    const first = body.articles[0];
    assert.ok('difficulty' in first);
    assert.ok('scheduleSource' in first);
    assert.ok('status' in first);
  });

  it('returns 404 for unknown collection', async () => {
    const { status } = await request('GET', `/api/admin/collection/${encodeURIComponent('不存在集')}/articles`);
    assert.equal(status, 404);
  });
});

// ── Admin write APIs ──────────────────────────────────────────
describe('PUT /api/admin/difficulty/:level', () => {
  it('updates difficulty defaults', async () => {
    const { status, body } = await request('PUT', '/api/admin/difficulty/1', {
      totalStages: 4, intervals: [1, 2, 5, 10]
    });
    assert.equal(status, 200);
    assert.equal(body.defaults.totalStages, 4);
    assert.deepEqual(body.defaults.intervals, [1, 2, 5, 10]);
  });

  it('rejects invalid level', async () => {
    const { status } = await request('PUT', '/api/admin/difficulty/5', {
      totalStages: 3, intervals: [1, 2, 5]
    });
    assert.equal(status, 400);
  });

  it('rejects intervals shorter than totalStages', async () => {
    const { status } = await request('PUT', '/api/admin/difficulty/1', {
      totalStages: 5, intervals: [1, 2]
    });
    assert.equal(status, 400);
  });
});

// ── Per-article admin override ──────────────────────────────────────────
describe('PUT /api/admin/article/:articleId/override', () => {
  it('sets override on an article', async () => {
    const articleId = '寅集-adm-over-01';
    await request('POST', `/api/state/${encodeURIComponent(articleId)}/complete`, {
      collection: '寅集', title: 'AdminOverride', charCount: 80, genre: '文言文',
    });
    const { status, body } = await request('PUT', `/api/admin/article/${encodeURIComponent(articleId)}/override`, {
      intervals: [3, 6, 12], totalStages: 3
    });
    assert.equal(status, 200);
    assert.equal(body.state.scheduleSource, 'override');
    assert.deepEqual(body.state.intervals, [3, 6, 12]);
  });

  it('returns 404 for unknown article', async () => {
    const { status } = await request('PUT', `/api/admin/article/${encodeURIComponent('不存在-01')}/override`, {
      intervals: [1, 2], totalStages: 2
    });
    assert.equal(status, 404);
  });
});

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
