# Poetry ArticleView Bookish Style (WenKai + Paper Texture) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the poetry reading page (`ArticleView`) feel like a traditional book page by self-hosting LXGW WenKai for headings and adding subtle paper/binding styling.

**Architecture:** Frontend-only. Add WOFF2 fonts under `apps/poetry/client/src/fonts/`, register via `@font-face` in global CSS (App.vue style), and apply via classes (`article-title`, `section-title`, existing `content-heading`). Add paper texture on `body` and page-frame styling in `ArticleView.vue`.

**Tech Stack:** Vue 3, Vite, Vitest.

---

### Task 1: Add failing tests for title/section class hooks

**Files:**
- Modify: `apps/poetry/client/src/views/__tests__/ArticleView.test.js`

**Step 1: Write failing test**
- Mount ArticleView with mocked content.
- Assert:
  - `.article-header h1` has class `article-title`
  - each section header `h3` has class `section-title`

**Step 2: Run tests and confirm FAIL**
Run:
```
cd apps/poetry/client
npm test
```
Expected: FAIL (classes not present).

---

### Task 2: Add the class hooks in ArticleView.vue

**Files:**
- Modify: `apps/poetry/client/src/views/ArticleView.vue`

**Step 1: Implement minimal changes**
- Add `class="article-title"` to `h1`.
- Add `class="section-title"` to all section `h3`.

**Step 2: Run tests and confirm PASS**
Run `npm test`.

**Step 3: Commit**
Commit message suggestion:
`test(poetry-ui): add class hooks for bookish typography`

---

### Task 3: Add WenKai font files + OFL license

**Files:**
- Create: `apps/poetry/client/src/fonts/LXGWWenKai-Regular.woff2`
- Create: `apps/poetry/client/src/fonts/LXGWWenKai-Bold.woff2` (or SemiBold)
- Create: `apps/poetry/client/src/fonts/OFL.txt`

**Step 1: Add files**
- Download trusted source (upstream or webfont package)
- Store license text.

**Step 2: Commit**
Commit message: `chore(poetry-ui): add LXGW WenKai webfont (OFL)`

---

### Task 4: Register @font-face and apply typography rules globally

**Files:**
- Modify: `apps/poetry/client/src/App.vue` (global style block)

**Step 1: Implement**
- Add `@font-face` rules for WenKai Regular/Bold.
- Add CSS vars:
  - `--font-body`
  - `--font-title`
- Apply:
  - `body { font-family: var(--font-body); }`
  - `.article-title, .section-title, .content-heading { font-family: var(--font-title); }`

**Step 2: Run tests**
`npm test` should still pass.

**Step 3: Commit**
Commit message: `style(poetry-ui): use WenKai for titles`

---

### Task 5: Paper texture + binding styling (CSS)

**Files:**
- Modify: `apps/poetry/client/src/App.vue` (body background)
- Modify: `apps/poetry/client/src/views/ArticleView.vue` (scoped CSS)

**Step 1: Implement**
- Body background: layered gradients for subtle paper texture.
- Article page: page frame + binding line pseudo-element.

**Step 2: Verify**
- `npm test`
- `npm run build`

**Step 3: Commit**
Commit message: `style(poetry-ui): add paper texture and page frame`

---

### Task 6: PR + deploy after merge
- Push branch
- Create PR
- After merge: pull/build/restart `com.keke.poetry`

