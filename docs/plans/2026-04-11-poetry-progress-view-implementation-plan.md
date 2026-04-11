# Poetry Progress View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a kid-friendly Progress page that lists all poetry articles across all collections, shows each article’s Ebbinghaus state, and provides overall + per-collection conquest stats. Must guarantee data consistency with Parent Center and per-article state detail.

**Architecture:**
- Backend: add a single read-only aggregation endpoint `GET /api/progress/overview` that merges catalog (collections+articles) with state files, computes overall/per-collection stats, and uses shared summary logic to avoid drift.
- Frontend: add `ProgressView.vue` at `/progress`, entry link from HomeView. Render overall stats + per-collection accordion lists.
- Consistency: extract a shared server function to build article summaries; add an integration test asserting key fields match between: `/api/state/:id`, `/api/admin/collection/:c/articles`, `/api/progress/overview`.

**Tech Stack:** Express, node:test, Vue 3, Vite, Vitest.

---

### Task 1: Add failing server test for `GET /api/progress/overview`

**Files:**
- Modify: `apps/poetry/server/test/api.test.js`

**Step 1: Write failing test (RED)**
Add a new `describe('GET /api/progress/overview', ...)` with assertions:
- status 200
- body has `overall` and `collections`
- `overall.total` equals sum of per-collection totals
- When a known article state exists, it appears in the response with matching `status/currentStage/nextDueDate`.

**Step 2: Run tests (RED)**
```bash
cd apps/poetry/server
npm install
npm test
```
Expected: FAIL (endpoint not found).

---

### Task 2: Implement shared server summary helper

**Files:**
- Create: `apps/poetry/server/services/articleSummary.js`
- Modify (optional later): `apps/poetry/server/routes/admin.js` to reuse helper

**Helper contract:**
- `buildArticleSummary({ article, state })` where `article` comes from catalog and `state` from disk (or null)
- Return fields:
  - articleId, number, title, section
  - status: active|graduated|not_started
  - difficulty
  - scheduleSource (default to 'level_default' if state exists and field missing)
  - stage/currentStage/totalStages/intervals/nextDueDate

**Step 1: Write minimal implementation**
No side effects.

**Step 2: Unit test (optional) OR rely on integration tests**
(Prefer integration for speed, but helper should be trivial.)

**Step 3: Commit**
```bash
git add apps/poetry/server/services/articleSummary.js
git commit -m "feat(poetry): add shared article summary builder"
```

---

### Task 3: Implement `GET /api/progress/overview`

**Files:**
- Create: `apps/poetry/server/routes/progress.js`
- Modify: `apps/poetry/server/index.js` to mount route

**Implementation details:**
- Get collections via `listCollections()`
- For each collection:
  - `parseCollection(collection)`
  - For each article:
    - read state via `readJson(statePath(article.articleId), null)`
    - build summary via `buildArticleSummary`
  - compute per-collection stats by status
- Compute overall totals by reducing collection stats
- Return JSON structure described in design doc

**Step: Run tests (GREEN)**
```bash
cd apps/poetry/server
npm test
```

**Step: Commit**
```bash
git add apps/poetry/server/routes/progress.js apps/poetry/server/index.js

git commit -m "feat(poetry): add progress overview aggregation API"
```

---

### Task 4: Add hard consistency integration test (Critical)

**Files:**
- Modify: `apps/poetry/server/test/api.test.js`

**Test:** For one started article:
- Fetch `/api/state/:articleId`
- Fetch `/api/admin/collection/:collection/articles` and find that article
- Fetch `/api/progress/overview` and find that article

Assert these are identical:
- status
- stage, currentStage
- totalStages
- intervals
- nextDueDate
- scheduleSource (treat missing as level_default)

Run tests and commit.

---

### Task 5: Frontend API wrapper

**Files:**
- Modify: `apps/poetry/client/src/api/index.js`

Add:
- `fetchProgressOverview()` → GET `/api/progress/overview`

Commit.

---

### Task 6: Add ProgressView + route

**Files:**
- Create: `apps/poetry/client/src/views/ProgressView.vue`
- Modify: `apps/poetry/client/src/router/index.js`

UI:
- Overall stats card
- Accordion by collection
- Each collection shows stats and article list
- Clicking an article navigates to ArticleView route

Commit.

---

### Task 7: Add HomeView entry link

**Files:**
- Modify: `apps/poetry/client/src/views/HomeView.vue`

Add nav link:
- `router-link to="/progress"` label `📚 我的进度`

Commit.

---

### Task 8: Frontend tests (vitest)

**Files:**
- Create/Modify: `apps/poetry/client/src/views/__tests__/ProgressView.test.js`

Tests:
- Mocks `fetchProgressOverview()`
- Asserts overall stats render
- Asserts at least one collection renders with correct counts
- Asserts article row shows status text

Run:
```bash
cd apps/poetry/client
npm install
npm test
```

Commit.

---

### Task 9: Verification gates + PR

**Verify:**
- `cd apps/poetry/server && npm test`
- `cd apps/poetry/client && npm test`
- `cd apps/poetry/client && npm run build`

**Request code review** (superpowers:requesting-code-review) focusing on:
- aggregation correctness
- consistency test strength
- any drift with admin endpoints

**Push + PR**

---

### Task 10: Merge + deploy
After PR merge:
- pull main
- build client
- restart `com.keke.poetry`
- health check

