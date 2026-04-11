const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { readJson, writeJson, appendJsonl } = require('../services/storage');

describe('storage', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'poetry-storage-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('readJson', () => {
    it('returns fallback when file does not exist', () => {
      const result = readJson(path.join(tmpDir, 'nope.json'), { empty: true });
      assert.deepStrictEqual(result, { empty: true });
    });

    it('reads existing JSON file', () => {
      const filePath = path.join(tmpDir, 'data.json');
      fs.writeFileSync(filePath, JSON.stringify({ key: 'value' }));
      const result = readJson(filePath);
      assert.deepStrictEqual(result, { key: 'value' });
    });

    it('returns fallback on malformed JSON', () => {
      const filePath = path.join(tmpDir, 'bad.json');
      fs.writeFileSync(filePath, '{broken');
      const result = readJson(filePath, { fallback: true });
      assert.deepStrictEqual(result, { fallback: true });
    });
  });

  describe('writeJson', () => {
    it('writes and can be read back', () => {
      const filePath = path.join(tmpDir, 'out.json');
      writeJson(filePath, { hello: 'world', num: 42 });
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      assert.deepStrictEqual(parsed, { hello: 'world', num: 42 });
    });

    it('creates parent directories if needed', () => {
      const filePath = path.join(tmpDir, 'sub', 'dir', 'deep.json');
      writeJson(filePath, { nested: true });
      const result = readJson(filePath);
      assert.deepStrictEqual(result, { nested: true });
    });

    it('overwrites existing file atomically', () => {
      const filePath = path.join(tmpDir, 'overwrite.json');
      writeJson(filePath, { version: 1 });
      writeJson(filePath, { version: 2 });
      const result = readJson(filePath);
      assert.deepStrictEqual(result, { version: 2 });
    });
  });

  describe('appendJsonl', () => {
    it('appends a single event line', () => {
      const filePath = path.join(tmpDir, 'events.jsonl');
      appendJsonl(filePath, { type: 'start', ts: '2026-01-01' });
      const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
      assert.strictEqual(lines.length, 1);
      assert.deepStrictEqual(JSON.parse(lines[0]), { type: 'start', ts: '2026-01-01' });
    });

    it('appends multiple events as separate lines', () => {
      const filePath = path.join(tmpDir, 'events.jsonl');
      appendJsonl(filePath, { type: 'a' });
      appendJsonl(filePath, { type: 'b' });
      appendJsonl(filePath, { type: 'c' });
      const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
      assert.strictEqual(lines.length, 3);
      assert.strictEqual(JSON.parse(lines[0]).type, 'a');
      assert.strictEqual(JSON.parse(lines[2]).type, 'c');
    });

    it('creates parent directories if needed', () => {
      const filePath = path.join(tmpDir, 'nested', 'log.jsonl');
      appendJsonl(filePath, { event: 'init' });
      assert.ok(fs.existsSync(filePath));
    });
  });
});
