const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'quiz-config.json');

describe('weeklyExamConfig defaults', () => {
  let config;

  it('should load quiz-config.json', () => {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    config = JSON.parse(raw);
    assert.ok(config, 'config should be truthy');
  });

  it('should have weeklyExamConfig key', () => {
    assert.ok(config.weeklyExamConfig, 'weeklyExamConfig must exist');
  });

  it('windowWeeks should default to 1', () => {
    assert.strictEqual(config.weeklyExamConfig.windowWeeks, 1);
  });

  it('examDay should default to 6 (Saturday)', () => {
    assert.strictEqual(config.weeklyExamConfig.examDay, 6);
  });

  it('sampleRates should have A1, A2, B1+ keys', () => {
    const sr = config.weeklyExamConfig.sampleRates;
    assert.ok(sr, 'sampleRates must exist');
    assert.strictEqual(sr.A1, 0.2);
    assert.strictEqual(sr.A2, 0.4);
    assert.strictEqual(sr['B1+'], 0.6);
  });

  it('questionTypes should have 4 groups summing to 100 each', () => {
    const qt = config.weeklyExamConfig.questionTypes;
    assert.ok(qt, 'questionTypes must exist');
    for (const group of ['A1', 'A2', 'B1+', 'wrong']) {
      assert.ok(qt[group], `questionTypes.${group} must exist`);
      const sum = qt[group].choice + qt[group].fillBlank + qt[group].spelling;
      assert.strictEqual(sum, 100, `${group} sum should be 100, got ${sum}`);
    }
  });
});
