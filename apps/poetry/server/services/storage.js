/**
 * Atomic-ish file storage utilities for JSON and JSONL persistence.
 */
const fs = require('fs');
const path = require('path');

/**
 * Read a JSON file, returning fallback on missing/malformed.
 * @param {string} filePath
 * @param {*} fallback - returned when file missing or unparseable
 * @returns {*}
 */
function readJson(filePath, fallback = null) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Write JSON atomically (write to tmp then rename).
 * Creates parent directories if needed.
 * @param {string} filePath
 * @param {*} data
 */
function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const tmp = filePath + '.tmp.' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, filePath);
}

/**
 * Append a single JSON object as one line to a JSONL file.
 * Creates parent directories if needed.
 * @param {string} filePath
 * @param {object} event
 */
function appendJsonl(filePath, event) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  fs.appendFileSync(filePath, JSON.stringify(event) + '\n', 'utf-8');
}

module.exports = { readJson, writeJson, appendJsonl };
