const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  sortCollections,
  getActiveCollection,
} = require('../services/collections');

describe('collections', () => {
  describe('sortCollections', () => {
    it('sorts 地支 names in natural order', () => {
      const input = ['寅', '子', '丑', '卯'];
      const sorted = sortCollections(input);
      assert.deepStrictEqual(sorted, ['子', '丑', '寅', '卯']);
    });

    it('handles full 地支 sequence', () => {
      const input = ['亥', '午', '子', '巳', '卯', '丑', '寅', '辰', '未', '申', '酉', '戌'];
      const sorted = sortCollections(input);
      assert.deepStrictEqual(sorted, ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']);
    });

    it('falls back to localeCompare for non-地支 names', () => {
      const input = ['第三集', '第一集', '第二集'];
      const sorted = sortCollections(input);
      // Verify it's sorted (consistent order), not random
      const expected = [...input].sort((a, b) => a.localeCompare(b, 'zh'));
      assert.deepStrictEqual(sorted, expected);
    });

    it('puts 地支 names before non-地支 names', () => {
      const input = ['番外', '子', '丑'];
      const sorted = sortCollections(input);
      assert.strictEqual(sorted[0], '子');
      assert.strictEqual(sorted[1], '丑');
      assert.strictEqual(sorted[2], '番外');
    });
  });

  describe('getActiveCollection', () => {
    it('returns first collection when none have state', () => {
      const result = getActiveCollection({
        collections: ['子', '丑', '寅'],
        articleStatesByCollection: {},
      });
      assert.strictEqual(result, '子');
    });

    it('returns first collection with non-graduated articles', () => {
      const result = getActiveCollection({
        collections: ['子', '丑', '寅'],
        articleStatesByCollection: {
          '子': [
            { status: 'graduated' },
            { status: 'graduated' },
          ],
          '丑': [
            { status: 'active' },
            { status: 'graduated' },
          ],
        },
      });
      assert.strictEqual(result, '丑');
    });

    it('returns null when all collections are graduated', () => {
      const result = getActiveCollection({
        collections: ['子'],
        articleStatesByCollection: {
          '子': [
            { status: 'graduated' },
          ],
        },
      });
      assert.strictEqual(result, null);
    });

    it('returns collection with no state (new) over fully graduated', () => {
      const result = getActiveCollection({
        collections: ['子', '丑'],
        articleStatesByCollection: {
          '子': [{ status: 'graduated' }],
          // '丑' has no entries → treat as "not started" → active
        },
      });
      assert.strictEqual(result, '丑');
    });

    it('returns empty-state collection (articles exist but no learning state)', () => {
      const result = getActiveCollection({
        collections: ['子', '丑'],
        articleStatesByCollection: {
          '子': [{ status: 'graduated' }],
          '丑': [],  // collection exists but no article states → not graduated → active
        },
      });
      assert.strictEqual(result, '丑');
    });
  });
});
