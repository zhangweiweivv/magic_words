# Weekly Exam (周考) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a weekly exam feature that tests *recently graduated* learned words, persists all week until the next exam, and records first-round score + wrong words (then wrong-only redo until all correct).

**Architecture:** Backend generates and persists the current exam (questions + metadata) in Obsidian folder files. Frontend renders the exam as a dedicated page and reports first-round results + completion to backend. Config is stored in `server/config/quiz-config.json` under `weeklyExamConfig` (same pattern as expansionConfig).

**Tech Stack:** Vue 3 + Vite + Element Plus (frontend), Express (backend), file-based persistence in Obsidian markdown/json, Slack Web API via existing `server/services/slack.js`.

---

## Repo / Paths (important)

- Project root: `/Users/vvhome/.openclaw/workspace/projects/keke-vocab/`
- Server: `projects/keke-vocab/server/`
- Client: `projects/keke-vocab/client/`
- Obsidian data folder: `/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/`

Obsidian files used:
- Learned words: `已记住单词.md` (already parsed by `server/services/obsidian.js`, includes `date` field)
- PET vocab: `PET官方单词库.md`

New Obsidian files to create:
- Weekly exam status: `.weekly-exam-status.json`
- Weekly exam wrong pool: `周考错题池.json`
- Weekly exam history: `周考记录.md`

---

## Defaults (as approved)

- Exam day: Saturday (`examDay = 6`, JS `Date.getDay()` convention)
- Window: N weeks of graduated learned words (`windowWeeks = 1` by default)
- Sample rates:
  - A1: 0.2
  - A2: 0.4
  - B1+: 0.6
- Question type ratios (percent, must sum to 100 per level):
  - A1: choice=60, fillBlank=30, spelling=10
  - A2: choice=30, fillBlank=40, spelling=30
  - B1+: choice=10, fillBlank=30, spelling=60
  - wrong: choice=0, fillBlank=0, spelling=100 (always pure spelling)
- Wrong words inclusion is **limited to the same N-week window**.
- Score is based on **first round** accuracy only.
- After first round, redo wrong-only until all correct (redo rounds do not affect score).

---

## Task 0: Create a safe dev workspace (worktree)

**Files:** none

**Step 1: Create worktree**

Run (from repo root):
```bash
git status

git worktree add -b feat/weekly-exam ../keke-vocab-weekly-exam
cd ../keke-vocab-weekly-exam
```
Expected: new worktree directory created.

**Step 2: Install deps (if needed)**

Run:
```bash
cd projects/keke-vocab/server && npm install
cd ../client && npm install
```
Expected: no errors.

**Step 3: Commit baseline (optional)**

No code changes yet.

---

## Task 1: Add weekly exam config to existing config file

**Files:**
- Modify: `projects/keke-vocab/server/config/quiz-config.json`
- Modify: `projects/keke-vocab/client/src/views/ParentView.vue`

**Step 1: Write failing (server) test for default config merge**

Create: `projects/keke-vocab/server/tests/config-weekly-exam.test.js`

Use Node built-in runner:
```js
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('weeklyExamConfig defaults exist', () => {
  const cfgPath = path.join(__dirname, '..', 'config', 'quiz-config.json')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
  assert.ok(cfg.weeklyExamConfig, 'weeklyExamConfig missing')
  assert.equal(cfg.weeklyExamConfig.windowWeeks ?? 1, 1)
})
```

**Step 2: Run test and verify it fails**

Run:
```bash
cd projects/keke-vocab/server
node --test tests/config-weekly-exam.test.js
```
Expected: FAIL (weeklyExamConfig missing).

**Step 3: Add defaults into `quiz-config.json`**

Add:
```json
{
  "weeklyExamConfig": {
    "examDay": 6,
    "windowWeeks": 1,
    "sampleRates": { "A1": 0.2, "A2": 0.4, "B1+": 0.6 },
    "questionTypes": {
      "A1":  { "choice": 60, "fillBlank": 30, "spelling": 10 },
      "A2":  { "choice": 30, "fillBlank": 40, "spelling": 30 },
      "B1+": { "choice": 10, "fillBlank": 30, "spelling": 60 },
      "wrong": { "choice": 0, "fillBlank": 0, "spelling": 100 }
    }
  }
}
```
(keep existing fields unchanged)

**Step 4: Re-run test**

Run:
```bash
node --test tests/config-weekly-exam.test.js
```
Expected: PASS.

**Step 5: Add `test` script to server package.json**

Modify: `projects/keke-vocab/server/package.json`
Add:
```json
"scripts": { "test": "node --test" }
```

Verify:
```bash
npm test
```
Expected: PASS.

**Step 6: Update ParentView UI (manual test later)**

In `ParentView.vue`, add a new section "周考设置":
- windowWeeks (number input or select 1-8)
- examDay (select Mon..Sun; store as 0-6)
- sampleRates sliders for A1/A2/B1+ (0-100)
- questionTypes: 4 groups (A1/A2/B1+/错题), each with 3 sliders (选择/补全/拼写), must sum to 100
- load/save via existing `/api/config` like `expansionConfig`

**⚠️ No Shell Features:** Every config field MUST be read by backend when generating exam. Verify by:
1. Change a value in Parent Center
2. Force regenerate exam (delete `.weekly-exam-status.json` or wait for next cycle)
3. Confirm generated questions reflect the new config

**Step 7: Commit**

```bash
git add projects/keke-vocab/server/config/quiz-config.json \
        projects/keke-vocab/server/package.json \
        projects/keke-vocab/server/tests/config-weekly-exam.test.js \
        projects/keke-vocab/client/src/views/ParentView.vue

git commit -m "feat(config): add weeklyExamConfig defaults and parent UI"
```

---

## Task 2: Implement CEFR level lookup utility (PET vocab)

**Files:**
- Create: `projects/keke-vocab/server/services/petVocab.js`
- Test: `projects/keke-vocab/server/tests/pet-vocab.test.js`

**Step 1: Write failing test**

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const { buildCefrMap } = require('../services/petVocab')

test('buildCefrMap maps words to levels', async () => {
  const map = await buildCefrMap()
  assert.equal(map.get('the'), 'A1')
  assert.ok(['A1','A2','B1+'].includes(map.get('annual') || 'A2'))
})
```

**Step 2: Run test (should fail: module missing)**

Run:
```bash
cd projects/keke-vocab/server
node --test tests/pet-vocab.test.js
```
Expected: FAIL.

**Step 3: Implement `petVocab.js`**

- Parse `/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/PET官方单词库.md`
- Detect headers: `## 🏷️ A1 级别`, `A2`, `B1`, `B2/B2+` (merge into `B1+`)
- Parse table rows to get the word column
- Return `Map<string, 'A1'|'A2'|'B1+'>` with lowercase keys

**Step 4: Re-run test**

Expected: PASS.

**Step 5: Commit**

```bash
git add projects/keke-vocab/server/services/petVocab.js \
        projects/keke-vocab/server/tests/pet-vocab.test.js

git commit -m "feat(server): add PET vocab CEFR lookup"
```

---

## Task 3: Weekly exam service (core backend)

**Files:**
- Create: `projects/keke-vocab/server/services/weeklyExam.js`
- Modify: `projects/keke-vocab/server/services/slack.js` (add weekly exam messages)
- Test: `projects/keke-vocab/server/tests/weekly-exam.test.js`

**Step 1: Write failing unit tests**

Test behaviors (use small in-memory fixtures by injecting dependencies):
- Compute "current exam generatedDate" for arbitrary dates based on `examDay`
- Filter learned words by graduation date within `windowWeeks`
- Include wrong words 100% but only within window

Create `tests/weekly-exam.test.js` with pure functions exported from weeklyExam service (recommended exports):
- `getExamCycleDate(now, examDay)` → YYYY-MM-DD
- `isWithinWindow(graduatedDate, cycleDate, windowWeeks)`

**Step 2: Run tests (expect FAIL)**

```bash
node --test tests/weekly-exam.test.js
```

**Step 3: Implement service with file persistence**

In `weeklyExam.js`:

Constants:
- `OBSIDIAN_PATH` from `obsidian.js` export
- `STATUS_FILE = path.join(OBSIDIAN_PATH, '.weekly-exam-status.json')`
- `WRONG_POOL_FILE = path.join(OBSIDIAN_PATH, '周考错题池.json')`
- `HISTORY_MD = path.join(OBSIDIAN_PATH, '周考记录.md')`

Key functions:
- `getWeeklyExamConfig()` reads `server/config/quiz-config.json` and returns `weeklyExamConfig` with defaults
- `ensureCurrentExam({ sendSlackReady=false })`:
  - compute `cycleDate` = most recent `examDay` at/ before `now`
  - if STATUS_FILE missing OR stored `generatedDate` != cycleDate → generate new exam and overwrite STATUS_FILE
  - otherwise return stored exam
  - note: exam remains valid until next cycle; do **not** auto-expire daily
- `generateExam(cycleDate, cfg)`:
  - read learned words via `obsidianService.getLearnedWords()` which includes `date` (graduatedDate)
  - filter words where `graduatedDate` within `windowWeeks` of `cycleDate`
  - build CEFR map via `petVocab.buildCefrMap()`
  - classify each word level; default 'A2'
  - load wrong pool json (if missing, treat empty)
  - wrong candidates = intersection(wrongPool.words, windowWords)
  - remaining candidates = windowWords - wrongCandidates
  - sample remaining by level using cfg.sampleRates (A1/A2/B1+)
  - construct questions for selected words:
    - read `questionTypes` from config (A1/A2/B1+/wrong)
    - for each word, pick question type by weighted random using its level's ratios
    - wrong words always use `questionTypes.wrong` (default 100% spelling)
    - choice questions: include `options` (4 words, correct+3 distractors from same window; fallback to any learned words)
    - fillBlank questions: include `hint` (partial letters with blanks)
    - spelling questions: no hint, full input required
  - persist `STATUS_FILE` with:
    - `generatedDate`, `cycleDate`, `configSnapshot`, `questions`, `completed:false`, `score:null`, `firstRound`:null

- `recordFirstRound({generatedDate, total, correct, wrongDetails, roundsSummary})`
  - verify generatedDate matches current exam
  - set score = Math.round(correct/total*100)
  - update wrong pool file: add wrong words with graduatedDate
  - (optional) prune wrong pool to keep only words within current window (to match requirement)
  - append markdown record to HISTORY_MD (first round + wrong list)

- `markComplete({generatedDate, rounds})`
  - set exam.completed=true, save rounds summary
  - send Slack completion message including first round score and per-round stats

Slack:
- Add `sendWeeklyExamReady({generatedDate, total, wrongCount, sampledCount, windowWeeks})`
- Add `sendWeeklyExamComplete({generatedDate, score, total, rounds})`

**Step 4: Re-run unit tests**

Expected: PASS.

**Step 5: Commit**

```bash
git add projects/keke-vocab/server/services/weeklyExam.js \
        projects/keke-vocab/server/services/slack.js \
        projects/keke-vocab/server/tests/weekly-exam.test.js

git commit -m "feat(server): weekly exam service with persistence and slack messages"
```

---

## Task 4: Weekly exam API routes

**Files:**
- Create: `projects/keke-vocab/server/routes/weekly-exam.js`
- Modify: `projects/keke-vocab/server/index.js`
- Test: `projects/keke-vocab/server/tests/weekly-exam-routes.test.js`

**Endpoints:**
- `GET /api/weekly-exam/current`
  - calls `ensureCurrentExam()`
  - returns `{ success:true, data: exam }`
- `POST /api/weekly-exam/first-round`
  - body: `{ generatedDate, total, correct, wrongDetails, rounds }`
  - calls `recordFirstRound()`
- `POST /api/weekly-exam/complete`
  - body: `{ generatedDate, rounds }`
  - calls `markComplete()`

**Step 1: Write failing route tests**

Use `supertest`? (not installed) → instead do lightweight integration by starting the server on ephemeral port in test.
If too heavy, skip automated route tests and rely on unit tests + manual curl.

**Step 2: Implement routes and mount in `server/index.js`**

Add:
```js
const weeklyExamRouter = require('./routes/weekly-exam')
app.use('/api/weekly-exam', weeklyExamRouter)
```

**Step 3: Manual API verification**

Run server:
```bash
cd projects/keke-vocab/server
npm run dev
```
In another terminal:
```bash
curl -s http://localhost:3001/api/weekly-exam/current | head
```
Expected: JSON with `success:true` and exam payload.

**Step 4: Commit**

```bash
git add projects/keke-vocab/server/routes/weekly-exam.js \
        projects/keke-vocab/server/index.js

git commit -m "feat(api): add weekly exam endpoints"
```

---

## Task 5: Frontend API wrapper

**Files:**
- Create: `projects/keke-vocab/client/src/api/weeklyExam.js`

**Step 1: Implement API wrapper**

```js
import axios from 'axios'

export const weeklyExamApi = {
  getCurrent() { return axios.get('/api/weekly-exam/current') },
  submitFirstRound(payload) { return axios.post('/api/weekly-exam/first-round', payload) },
  complete(payload) { return axios.post('/api/weekly-exam/complete', payload) },
}
```

**Step 2: Commit**

```bash
git add projects/keke-vocab/client/src/api/weeklyExam.js

git commit -m "feat(client): add weekly exam API wrapper"
```

---

## Task 6: Weekly exam page (UI)

**Files:**
- Create: `projects/keke-vocab/client/src/views/WeeklyExamView.vue`
- Modify: `projects/keke-vocab/client/src/router/index.js`

**UI requirements:**
- Intro screen (title, generatedDate, total questions)
- First round:
  - question rendering for `choice` / `fillBlank` / `spelling`
  - progress bar, correct count
- After first round:
  - show score (first round)
  - show wrong list
  - start redo mode (wrong-only), repeat until all correct
- On final completion:
  - call `weeklyExamApi.complete({ generatedDate, rounds })`
  - navigate back home or show "查看成绩"

Implementation hint:
- Copy minimal UI patterns from `client/src/components/QuizMode.vue` but DO NOT call points/review/garden APIs.
- Use Element Plus components already used elsewhere.

**Step 1: Manual dev test**

Run:
```bash
cd projects/keke-vocab
npm run dev
```
Visit: `http://localhost:3003/#/weekly-exam` (or the dev URL Vite prints)
Expected: loads exam and can finish it.

**Step 2: Commit**

```bash
git add projects/keke-vocab/client/src/views/WeeklyExamView.vue \
        projects/keke-vocab/client/src/router/index.js

git commit -m "feat(ui): add weekly exam page"
```

---

## Task 7: Home entry card

**Files:**
- Modify: `projects/keke-vocab/client/src/views/HomeView.vue`

**Behavior:**
- On mount, call `weeklyExamApi.getCurrent()`
- If exam exists and not completed → show a big entry card "📝 本周考试" with total questions
- If completed → show "查看本周成绩（xx分）"
- If backend indicates no eligible words → hide card

**Manual test:** open home and confirm card appears.

**Commit:**
```bash
git add projects/keke-vocab/client/src/views/HomeView.vue

git commit -m "feat(home): show weekly exam card"
```

---

## Task 8: Parent center settings wiring

**Files:**
- Modify: `projects/keke-vocab/client/src/views/ParentView.vue`

**Requirements:**
- Load `weeklyExamConfig` from `/api/config` and fill UI
- Save back via `PUT /api/config` merging into `weeklyExamConfig`
- UI includes:
  - windowWeeks (1-8)
  - examDay (Mon-Sun dropdown)
  - sampleRates: 3 sliders (A1/A2/B1+)
  - questionTypes: 4 groups × 3 sliders, each group sums to 100
    - Validation: if sum != 100, show error and disable save

**Manual test (NO SHELL FEATURES):**
1. Change windowWeeks to 2 and save
2. Change A1 questionTypes to choice=80, fillBlank=10, spelling=10 and save
3. Delete `.weekly-exam-status.json` to force regenerate:
   ```bash
   rm /Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/.weekly-exam-status.json
   ```
4. Refresh home, enter exam, verify:
   - Exam pulls words from 2-week window
   - A1 words are mostly choice questions (80%)
5. If not correct, fix the bug before proceeding

**Commit:**
```bash
git add projects/keke-vocab/client/src/views/ParentView.vue

git commit -m "feat(parent): weekly exam settings"
```

---

## Task 9: Cron/automation hook (optional but recommended)

**Files:**
- Create: `projects/keke-vocab/scripts/generate_weekly_exam.js`
- Docs: `projects/keke-vocab/README.md` (or ops note)

Script behavior:
- Calls weeklyExamService.ensureCurrentExam({ sendSlackReady:true })
- Exits 0

Manual run:
```bash
node projects/keke-vocab/scripts/generate_weekly_exam.js
```

(Actual scheduling can be done via existing OpenClaw Cron / LaunchAgent; keep out of code if environment-specific.)

**Commit:**
```bash
git add projects/keke-vocab/scripts/generate_weekly_exam.js

git commit -m "chore: add weekly exam generation script"
```

---

## Task 10: Verification checklist (before PR/merge)

**Server tests:**
```bash
cd projects/keke-vocab/server
npm test
```
Expected: all PASS.

**Manual E2E:**
1. Ensure learned words exist with dates in last 7 days (or temporarily set `windowWeeks=8` in Parent).
2. Open Home → weekly exam card appears.
3. Enter weekly exam → finish first round with some wrongs.
4. Confirm score is based on first round.
5. Confirm wrong-only redo continues until all correct.
6. Confirm completion sends Slack message.
7. Confirm exam remains available throughout week and only changes on next cycle.

---

## Execution Options

Plan complete and saved to `docs/plans/2026-04-11-keke-vocab-weekly-exam-plan.md`.

Two execution options:

1. **Subagent-Driven (this session)** — use superpowers:subagent-driven-development, dispatch a fresh subagent per task, review between tasks.

2. **Parallel Session (separate)** — open a new session using superpowers:executing-plans and implement the plan with checkpoints.

Which approach do you want?