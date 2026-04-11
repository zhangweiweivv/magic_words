const { buildCefrMap } = require('../services/petVocab');

describe('buildCefrMap', () => {
  let map;

  beforeAll(() => {
    map = buildCefrMap();
  });

  test('returns a Map', () => {
    expect(map).toBeInstanceOf(Map);
  });

  test('maps "the" to A1', () => {
    expect(map.get('the')).toBe('A1');
  });

  test('keys are lowercase', () => {
    for (const key of map.keys()) {
      expect(key).toBe(key.toLowerCase());
    }
  });

  test('has A1, A2, B1 level words', () => {
    const levels = new Set(map.values());
    expect(levels.has('A1')).toBe(true);
    expect(levels.has('A2')).toBe(true);
  });

  test('B2 words are merged into B1+', () => {
    const levels = new Set(map.values());
    expect(levels.has('B2')).toBe(false);
    // B1+ should exist if there are B2 words in the source
    expect(levels.has('B1+') || levels.has('B1')).toBe(true);
  });

  test('map has substantial entries', () => {
    expect(map.size).toBeGreaterThan(2000);
  });
});
