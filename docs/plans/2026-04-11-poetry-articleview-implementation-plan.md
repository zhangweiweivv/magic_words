# Poetry ArticleView Section Navigation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the poetry reading page (`ArticleView`) feel less plain by improving typography/layout and adding section navigation chips to jump between 原文/注释/译文/赏析.

**Architecture:** Pure frontend change in `apps/poetry/client`. Add a navigation chip row derived from `sections.*` presence. Use DOM refs / element ids and `scrollIntoView()` for smooth jump. No backend changes.

**Tech Stack:** Vue 3 (`<script setup>`), Vite, Vitest.

---

### Task 1: Add failing test for section navigation chips

**Files:**
- Modify: `apps/poetry/client/src/views/__tests__/ArticleView.test.js`

**Step 1: Write the failing test**
Add a new test case (or extend an existing one) that:
- Mocks `fetchArticleContent(articleId)` to return:
  - `sections.original` non-empty
  - `sections.notes` empty
  - `sections.translation` non-empty
  - `sections.appreciation` non-empty
- Asserts the chip row renders chips for: 原文 / 译文 / 赏析
- Asserts 注释 chip is NOT rendered

Pseudo-code sketch (keep consistent with existing test setup):
```
// after mount & flushPromises
expect(wrapper.text()).toContain('原文')
expect(wrapper.text()).toContain('译文')
expect(wrapper.text()).toContain('赏析')
expect(wrapper.text()).not.toContain('注释')
```

**Step 2: Run test to verify it fails**
Run:
```
cd apps/poetry/client
npm test
```
Expected: FAIL because chips do not exist yet.

---

### Task 2: Implement chips row in ArticleView.vue

**Files:**
- Modify: `apps/poetry/client/src/views/ArticleView.vue`

**Step 1: Minimal implementation**
- Add a computed list of available sections:
  - label + key + target element id
  - include only when the corresponding `sections.value.<key>` is non-empty after trimming
- Render a chips row under the header:
  - `<button class="chip" ...>`
- Add ids to section blocks:
  - `id="section-original"`, `section-notes`, `section-translation`, `section-appreciation`
- On chip click:
  - `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })`

**Step 2: Run tests**
Run:
```
cd apps/poetry/client
npm test
```
Expected: PASS for the new chip presence test.

**Step 3: Commit**
```
git add apps/poetry/client/src/views/ArticleView.vue apps/poetry/client/src/views/__tests__/ArticleView.test.js
git commit -m "feat(poetry-ui): add section navigation chips in ArticleView"
```

---

### Task 3: Add failing test for chip click scroll behavior

**Files:**
- Modify: `apps/poetry/client/src/views/__tests__/ArticleView.test.js`

**Step 1: Write the failing test**
- Mock `Element.prototype.scrollIntoView` with a spy.
- Trigger click on a chip (e.g., 译文).
- Assert the spy was called.

Sketch:
```
const spy = vi.fn()
Element.prototype.scrollIntoView = spy
await wrapper.find('[data-chip="translation"]').trigger('click')
expect(spy).toHaveBeenCalled()
```

**Step 2: Run test to verify it fails**
Run `npm test`.
Expected: FAIL until we add `data-chip` attrs / correct wiring.

---

### Task 4: Wire chip click + stable selectors for tests

**Files:**
- Modify: `apps/poetry/client/src/views/ArticleView.vue`

**Step 1: Implement**
- Add `data-chip="original|notes|translation|appreciation"` to each chip button.
- Ensure click handler calls `scrollIntoView` on the target section element.

**Step 2: Run tests**
Run `npm test`.
Expected: PASS.

**Step 3: Commit**
```
git add apps/poetry/client/src/views/ArticleView.vue apps/poetry/client/src/views/__tests__/ArticleView.test.js
git commit -m "test(poetry-ui): cover chip navigation scroll"
```

---

### Task 5: Typography/layout polish (restrained)

**Files:**
- Modify: `apps/poetry/client/src/views/ArticleView.vue` (scoped CSS)

**Step 1: Implement minimal visual polish**
- Add a max width (e.g. `max-width: 820px; margin: 0 auto;`) for the main reading area.
- Improve section headers:
  - consistent spacing
  - subtle divider
- Improve chips row style:
  - pill shape
  - selected/hover state
  - disabled state if needed (optional)

**Step 2: Run tests**
Run `npm test`.
Expected: PASS.

**Step 3: Commit**
```
git add apps/poetry/client/src/views/ArticleView.vue
git commit -m "style(poetry-ui): improve ArticleView reading layout"
```

---

### Task 6: End-to-end sanity check locally

**Files:**
- None

**Step 1: Build**
Run:
```
cd apps/poetry/client
npm run build
```
Expected: build succeeds.

**Step 2: Manual check (browser)**
- Open Portal → poetry → open an article with multiple sections.
- Verify chips appear and jump to the right section smoothly.

---

### Task 7: PR + merge + deploy

**Step 1: Push branch**
```
git push -u origin feat/poetry-articleview-nav
```

**Step 2: Create PR**
Use `gh pr create`.

**Step 3: After merge, deploy**
On the Mac mini:
- `git pull --ff-only`
- `apps/poetry/client` rebuild
- restart `com.keke.poetry`
- verify `/health`

