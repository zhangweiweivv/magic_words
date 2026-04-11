# Poetry Advanced Parent Center Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the poetry Parent Center to (1) disclose default difficulty/schedule rules, (2) allow editing difficulty-level defaults with optional batch apply to existing states, (3) allow per-article overrides and reset-to-default, and (4) show per-collection article difficulty levels.

**Architecture:**
- Backend: add a persisted `_difficulty_defaults.json` under `STATE_ROOT` + admin APIs to read rules, list collections, list per-collection difficulty, update difficulty defaults, override per-article schedule, reset per-article to default. All state mutations must reuse `applyConfigChange()` to preserve Ebbinghaus state machine correctness.
- Data model: add `scheduleSource: 'level_default'|'override'` to article state; per-article override always takes priority and must never be overwritten by level-default batch operations.
- Frontend: redesign `ParentView.vue` into three sections; wire to new admin APIs.

**Tech Stack:** Express, node:test, Vue 3, Vite, Vitest.

---

### Task 1: Add failing backend tests for scheduleSource priority semantics

**Files:**
- Modify: `apps/poetry/server/test/api.test.js`

**Step 1: Write failing tests**
Add a new `describe('difficulty defaults + scheduleSource priority', ...)` with tests:
1) `PUT /api/config/article/:articleId` sets `scheduleSource='override'` (after change)
2) Batch apply difficulty defaults does NOT overwrite states where `scheduleSource='override'`
3) Reset-to-default flips `override -> level_default`

(These tests will initially fail because API/fields do not exist yet.)

**Step 2: Run tests (RED)**
Run:
```
cd apps/poetry/server
npm test
```
Expected: FAIL on new cases.

---

### Task 2: Add state schema support for scheduleSource

**Files:**
- Modify: `apps/poetry/server/services/models.js` (or equivalent validation) if present
- Modify: `apps/poetry/server/services/stateMachine.js` (when creating new state)
- Modify: `apps/poetry/server/routes/config.js`

**Step 1: Implement minimal changes**
- On `startArticle()`: set `scheduleSource: 'level_default'`
- On article override via existing endpoint `PUT /api/config/article/:articleId`: ensure it sets `scheduleSource='override'` in returned state and persisted state.

**Step 2: Run tests (GREEN)**
Run server tests and ensure previous tests still pass.

**Step 3: Commit**
```
git add apps/poetry/server
git commit -m "feat(poetry): add scheduleSource to preserve override priority"
```

---

### Task 3: Implement difficulty defaults persistence service

**Files:**
- Create: `apps/poetry/server/services/difficultyDefaults.js`
- Modify: `apps/poetry/server/services/difficulty.js`

**Step 1: Write failing unit tests**
- Add tests ensuring:
  - if `_difficulty_defaults.json` missing → fallback to current hardcoded schedules
  - invalid config rejected (intervals length < totalStages)

**Step 2: Minimal implementation**
- Implement `readDifficultyDefaults()` and `writeDifficultyDefaults()` with validation.
- Update `recommendSchedule(difficulty)` to use persisted defaults (fallback if missing).

**Step 3: Run tests**

**Step 4: Commit**

---

### Task 4: Add admin read-only APIs

**Files:**
- Create: `apps/poetry/server/routes/admin.js`
- Modify: `apps/poetry/server/index.js` to mount admin routes

Endpoints:
- `GET /api/admin/difficulty/rules`
- `GET /api/admin/collections`
- `GET /api/admin/collection/:collection/articles`

**Test coverage:**
- verify returned defaults equal persisted ones
- verify collection listing sorted
- verify per-collection articles include difficulty + explanation fields

---

### Task 5: Add admin write APIs (level defaults + applyToExisting)

**Files:**
- Modify: `apps/poetry/server/routes/admin.js`

Endpoints:
- `PUT /api/admin/difficulty/:level` with `{ totalStages, intervals, applyToExisting }`

Behavior:
- Update persisted defaults
- If applyToExisting:
  - iterate all states under `STATE_ROOT`
  - update only `difficulty==level && scheduleSource=='level_default'`
  - use `applyConfigChange()` to recalc `nextDueDate` and auto-graduation rules

**Test coverage (critical):**
- ensure override states remain unchanged
- ensure nextDueDate changes as expected for default states

---

### Task 6: Add per-article admin override + reset-to-default APIs

**Files:**
- Modify: `apps/poetry/server/routes/admin.js`

Endpoints:
- `PUT /api/admin/article/:articleId/override` → sets override
- `PUT /api/admin/article/:articleId/reset-to-default` → uses difficulty default, sets level_default

**Test coverage:**
- reset uses current persisted defaults
- reset sets scheduleSource properly

---

### Task 7: Frontend ParentView redesign (TDD)

**Files:**
- Modify: `apps/poetry/client/src/api/index.js` (add admin API wrappers)
- Modify: `apps/poetry/client/src/views/ParentView.vue`
- Create/Modify tests: `apps/poetry/client/src/views/__tests__/ParentView.test.js`

UI sections:
1) Default rules disclosure
2) Difficulty-level defaults editor (+ applyToExisting)
3) Per-collection list with difficulty + per-article override/reset

**Tests:**
- renders defaults
- saving invalid intervals shows error
- clicking override/reset calls API

---

### Task 8: Code review + verification gates

**Required:**
- Run all server tests + client tests
- Run `npm run build` for client
- Request review (superpowers:requesting-code-review) before opening PR or before merge.

---

### Task 9: PR + deploy
- Push branch
- Create PR
- After merge: pull/build/restart `com.keke.poetry`
- Smoke-check:
  - Parent center loads
  - Level default edit + applyToExisting works
  - Override remains intact after apply

