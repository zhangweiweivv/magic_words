const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { buildCefrMap } = require('../services/petVocab');

describe('buildCefrMap', () => {
  let map;

  test('returns a Map', () => {
    map = buildCefrMap();
    assert.ok(map instanceof Map);
  });

  test('maps "the" to A1', () => {
    map = buildCefrMap();
    assert.strictEqual(map.get('the'), 'A1');
  });

  test('keys are lowercase', () => {
    map = buildCefrMap();
    for (const key of map.keys()) {
      assert.strictEqual(key, key.toLowerCase());
    }
  });

  test('has A1, A2, B1+ level words', () => {
    map = buildCefrMap();
    const levels = new Set(map.values());
    assert.ok(levels.has('A1'));
    assert.ok(levels.has('A2'));
    assert.ok(levels.has('B1+'));
  });

  test('map values contain only A1|A2|B1+', () => {
    map = buildCefrMap();
    const levels = new Set(map.values());
    assert.ok(!levels.has('B1'), 'should not contain raw B1');
    assert.ok(!levels.has('B2'), 'should not contain raw B2');
    assert.ok(!levels.has('B2+'), 'should not contain B2+');
    for (const v of levels) {
      assert.ok(['A1', 'A2', 'B1+'].includes(v), `unexpected level: ${v}`);
    }
  });

  test('maps multi-word phrase "be over" to A1', () => {
    map = buildCefrMap();
    assert.strictEqual(map.get('be over'), 'A1');
  });

  test('map has substantial entries', () => {
    map = buildCefrMap();
    assert.ok(map.size > 2000, `expected >2000 entries, got ${map.size}`);
  });
});
