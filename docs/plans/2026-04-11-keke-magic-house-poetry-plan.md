# Keke Magic House (Portal) + Poetry Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new “Keke Magic House” portal app (castle style) and a new Poetry (小红本) app with per-article Ebbinghaus scheduling, collision handling, detailed state+audit logs, plus Slack notifications.

**Architecture:** Monorepo-style inside `magic_words` repo: independent apps under `apps/portal/` and `apps/poetry/`, each with its own Express server. Poetry reads public content from Obsidian `小红本/` (read-only) and stores learning state+logs in `可可pet/可可古诗文/` (read-write).

**Tech Stack:** Node.js (Express, node:test), Vue 3 + Vite + Vue Router + Element Plus, file-based JSON/JSONL persistence, optional OCR via `tesseract` (Phase 2).

---

## Pre-flight (must be done first)

### Task 0: Create isolated worktree

**Files:** none

1. Run (in repo root):
   - `git check-ignore -q .worktrees && echo ignored`
2. Create worktree + branch:
   - `git worktree add .worktrees/feat-keke-portal-poetry -b feat/keke-portal-poetry`
3. In worktree, verify baseline:
   - `node -v`
   - `cd server && npm test` (Expected: PASS; if fail, stop and report)

---

## Phase 1 — Repository scaffolding + dev scripts

### Task 1: Add `apps/` layout and root scripts

**Files:**
- Modify: `package.json`
- (Optional) Modify: `scripts/start-daemon.sh` (if we later add multi-app support)

**Step 1: Write minimal docs comment in package.json**
- Add scripts (names may be adjusted during implementation):
  - `dev:portal` (portal server + portal client)
  - `dev:poetry` (poetry server + poetry client)
  - `dev:all` (vocab + portal + poetry)

**Step 2: Smoke run**
- Run: `npm run -s dev:all` (Expected: starts multiple processes)

**Step 3: Commit**
- `git add package.json`
- `git commit -m "chore: add dev scripts for portal+poetry apps"`

---

## Phase 2 — Portal app (Castle style)

### Task 2: Scaffold portal client (Vue+Vite)

**Files:**
- Create: `apps/portal/client/package.json`
- Create: `apps/portal/client/vite.config.js`
- Create: `apps/portal/client/src/main.js`
- Create: `apps/portal/client/src/App.vue`
- Create: `apps/portal/client/src/router/index.js`
- Create: `apps/portal/client/src/views/PortalHomeView.vue`

**Step 1: Add minimal portal homepage**
- Render 2 entrance cards:
  - “可可的单词魔法屋” → link to vocab URL
  - “可可古诗文” → link to poetry URL

**Step 2: Run**
- `cd apps/portal/client && npm install && npm run dev`
- Expected: portal renders.

**Step 3: Commit**
- `git add apps/portal/client`
- `git commit -m "feat(portal): scaffold portal client"`

### Task 3: Portal server (static hosting)

**Files:**
- Create: `apps/portal/server/package.json`
- Create: `apps/portal/server/index.js`

**Step 1: Implement Express static server**
- Serve `apps/portal/client/dist`.
- Add `/health` endpoint.

**Step 2: Verify**
- Build portal client: `cd apps/portal/client && npm run build`
- Start server: `cd apps/portal/server && npm install && node index.js`
- Expected: `http://localhost:3010` loads built portal.

**Step 3: Commit**
- `git add apps/portal/server apps/portal/client`
- `git commit -m "feat(portal): add portal server to host static build"`

---

## Phase 3 — Poetry app: backend (state + scheduling + logs)

### Task 4: Poetry server scaffolding

**Files:**
- Create: `apps/poetry/server/package.json`
- Create: `apps/poetry/server/index.js`
- Create: `apps/poetry/server/services/paths.js`
- Create: `apps/poetry/server/services/storage.js`
- Create: `apps/poetry/server/routes/health.js`

**Step 1: Implement basic server + CORS**
- Port: 3002
- `/health`

**Step 2: Add `paths.js`**
- Read-only root: `/Users/vvhome/vv_obsidian/vv_obsidian/小红本/`
- State root: `/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可古诗文/`

**Step 3: Add `storage.js`**
- Functions for atomic-ish writes:
  - `readJson(path, fallback)`
  - `writeJson(path, data)` (write temp + rename)
  - `appendJsonl(path, event)`

**Step 4: Add tests (node:test)**

**Test:** `apps/poetry/server/test/storage.test.js`
- Verify read fallback, write+read roundtrip, appendJsonl format.

Run: `cd apps/poetry/server && npm test`
Expected: PASS

**Step 5: Commit**
- `git add apps/poetry/server`
- `git commit -m "feat(poetry): scaffold server with storage utilities"`

### Task 5: Define data models (article state + event log)

**Files:**
- Create: `apps/poetry/server/services/models.js`
- Create: `apps/poetry/server/test/models.test.js`

**Step 1: Implement model validators**
- `assertArticleState(state)`
- `assertEvent(event)`

**Step 2: Tests**
- Ensure invalid shapes throw.

**Step 3: Commit**
- `git add apps/poetry/server/services/models.js apps/poetry/server/test/models.test.js`
- `git commit -m "test+feat(poetry): add strict models for state and events"`

### Task 6: Implement difficulty + default schedule recommendation

**Files:**
- Create: `apps/poetry/server/services/difficulty.js`
- Test: `apps/poetry/server/test/difficulty.test.js`

**Step 1: Implement**
- `lengthScore(charCount)`
- `genreScore(genre)`
- `computeDifficulty({charCount, genre})` -> 1..4
- `recommendSchedule(difficulty)` -> `{ totalStages, intervals[] }`

**Step 2: Tests**
- Include boundary char counts, each genre mapping.

**Step 3: Commit**
- `git add ...`
- `git commit -m "feat(poetry): add adaptive schedule recommendation"`

### Task 7: Scheduling engine (due list + collision priority)

**Files:**
- Create: `apps/poetry/server/services/scheduler.js`
- Test: `apps/poetry/server/test/scheduler.test.js`

**Step 1: Implement functions**
- `computeNextDueDate({ completedAt, nextStage, intervals })`
- `getDueArticles({ today, states })` returns list with `overdueDays`.
- `sortDueArticles(dueList)` implements:
  1) overdueDays desc
  2) stage desc (later stage higher)
  3) charCount asc

**Step 2: Tests**
- Same-day collision cases
- Overdue recalculation based on *actual completion date*

**Step 3: Commit**
- `git add ...`
- `git commit -m "feat(poetry): add scheduler with collision-priority sorting"`

### Task 8: State transitions + audit logging

**Files:**
- Create: `apps/poetry/server/services/stateMachine.js`
- Test: `apps/poetry/server/test/stateMachine.test.js`

**Step 1: Implement transitions**
- `startArticle(state, meta, now)` -> stage 0 completed
- `completeStage(state, now)` -> advances stage; may graduate
- `deferArticle(state, today)` -> marks overdue (no stage advance)
- `applyConfigChange(state, newConfig, now)` -> recalculates future; may auto-graduate
- Ensure each transition returns:
  - `nextState`
  - `events[]` (to append to JSONL)

**Step 2: Tests for all edge cases**
- Interval shorten causes overdue
- Stage reduction triggers auto-graduate
- Graduated article cannot be “ungraduated” by config

**Step 3: Commit**
- `git add ...`
- `git commit -m "feat(poetry): state machine with detailed audit events"`

### Task 9: Topic rotation (N-topic round robin)

**Files:**
- Create: `apps/poetry/server/services/rotation.js`
- Test: `apps/poetry/server/test/rotation.test.js`

**Step 1: Implement**
- Input: catalog grouped by genre/topic
- Persistent cursor file: `rotation-state.json`
- Output: recommended next article id

**Step 2: Tests**
- N=3,4,5 topics
- Skip exhausted topic

**Step 3: Commit**
- `git add ...`
- `git commit -m "feat(poetry): topic rotation for new-article recommendations"`

### Task 10: Poetry API routes

**Files:**
- Create: `apps/poetry/server/routes/articles.js`
- Create: `apps/poetry/server/routes/state.js`
- Create: `apps/poetry/server/routes/config.js`
- Modify: `apps/poetry/server/index.js`
- Test: `apps/poetry/server/test/api.test.js`

**Endpoints (draft):**
- `GET /api/catalog/collections` (list collections)
- `GET /api/catalog/:collection` (list articles + meta)
- `GET /api/state/due` (today due list)
- `POST /api/state/:articleId/complete` (mark complete, advance)
- `POST /api/state/:articleId/defer` (mark deferred)
- `GET /api/state/:articleId` (detail + history)
- `PUT /api/config/article/:articleId` (override intervals/stages)

Tests: call routes with supertest-like minimal approach (or direct handler invocation).

Commit.

---

## Phase 4 — Poetry app: frontend (water-ink style)

### Task 11: Scaffold poetry client

**Files:**
- Create: `apps/poetry/client/*` (Vite+Vue)

Pages:
- Home: due list + new recommendation + progress summary
- Article page: content + `✅ 今日已学完` button
- Article detail: schedule timeline + event list
- Parent center: per-article override UI

Add build + static serving by poetry server (like portal).

Commit.

---

## Phase 5 — Slack notifications

### Task 12: Slack integration (reuse existing patterns)

**Files:**
- Create: `apps/poetry/server/services/slack.js`
- Modify: `apps/poetry/server/services/stateMachine.js` to emit summary

Add optional env/config for channel.

Commit.

---

## Phase 6 — LaunchAgent daemons

### Task 13: Add daemon scripts + plists

**Files:**
- Create: `apps/portal/scripts/start-daemon.sh`
- Create: `apps/poetry/scripts/start-daemon.sh`
- Create: `launchagents/com.keke.portal.plist`
- Create: `launchagents/com.keke.poetry.plist`

Include:
- Port cleanup
- Process group kill (avoid orphan)

Commit.

---

## Phase 7 — Optional: OCR import tool (directory photo → Obsidian scaffold)

### Task 14 (Phase 2 optional): OCR pipeline

**Files:**
- Create: `apps/poetry/tools/import-collection-from-image.js`
- Create: `apps/poetry/server/routes/admin-import.js`

Approach:
- Use `tesseract` CLI (brew) or `tesseract.js`
- Parse table text into structured items
- Generate `小红本/<集名>.md` + `小红本/<集名>/xx-*.md` skeletons

Commit.

---

## Code Review (mandatory)

- Use `CODE_REVIEW.md` style: full diff review
- Must label findings: Critical/Important/Nice-to-have
- Block merge until all Critical/Important resolved

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-04-11-keke-magic-house-poetry-plan.md`.

Two execution options:

1) Subagent-Driven (this session) — use superpowers:subagent-driven-development, one task per subagent, review between tasks
2) Parallel Session — use superpowers:executing-plans in a separate session/worktree with checkpoints

Which approach do you want?
