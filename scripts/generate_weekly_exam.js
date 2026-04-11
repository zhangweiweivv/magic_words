#!/usr/bin/env node
/**
 * generate_weekly_exam.js
 * 
 * Cron / manual hook to ensure the current weekly exam exists.
 * Usage:  node scripts/generate_weekly_exam.js
 */

const path = require('path');

// Resolve from project root → server/services/weeklyExam
const weeklyExamService = require(path.join(__dirname, '..', 'server', 'services', 'weeklyExam'));

(async () => {
  try {
    console.log('🐸 Generating / ensuring current weekly exam…');
    const result = await weeklyExamService.ensureCurrentExam({ sendSlackReady: true });
    console.log('✅ Done.', result ?? '');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to generate weekly exam:', err);
    process.exit(1);
  }
})();
