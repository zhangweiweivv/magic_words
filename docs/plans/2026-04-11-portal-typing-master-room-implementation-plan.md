# Portal Typing Master Room Entry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a third room card on Portal home that opens Typing Master (typing practice) in a new tab.

**Architecture:** Pure frontend change in `PortalHomeView.vue` (add a new `<a class="room-card typing">`), plus a minimal view test to prevent regressions.

**Tech Stack:** Vue 3 + Vite + Vitest + @vue/test-utils (already present in portal client).

---

### Task 1: Add a failing test for the new room card (RED)

**Files:**
- Create: `apps/portal/client/src/views/__tests__/PortalHomeView.test.js`

**Step 1: Write failing test**
- Mount `PortalHomeView.vue`.
- Assert there is an anchor containing text `Typing Master`.
- Assert its `href` is `https://mango-smoke-0c143a30f.4.azurestaticapps.net/`.
- Assert it opens in a new tab: `target="_blank"` and `rel` includes `noopener`.

**Step 2: Run test to confirm it fails**
Run:
```bash
cd apps/portal/client
npm test
```
Expected: FAIL (Typing Master card not found).

**Step 3: Commit (test only)**
```bash
git add apps/portal/client/src/views/__tests__/PortalHomeView.test.js
git commit -m "test(portal): expect Typing Master room card on home"
```

---

### Task 2: Implement the Typing Master room card (GREEN)

**Files:**
- Modify: `apps/portal/client/src/views/PortalHomeView.vue`

**Step 1: Add new room card**
- Add a new room card under `.rooms`:
  - icon: `⌨️`
  - title: `Typing Master`
  - subtitle: `打字练习 · 提升速度与准确率`
  - link: `https://mango-smoke-0c143a30f.4.azurestaticapps.net/`
  - attributes: `target="_blank" rel="noopener noreferrer"`
- Add `.room-card.typing` gradient styling (e.g., purple).

**Step 2: Run tests (expect PASS)**
```bash
cd apps/portal/client
npm test
```

**Step 3: Run build (expect PASS)**
```bash
npm run build
```

**Step 4: Commit**
```bash
git add apps/portal/client/src/views/PortalHomeView.vue
git commit -m "feat(portal): add Typing Master room entry"
```

---

### Task 3: PR + merge + deploy

**Step 1: Push & open PR**
```bash
git push -u origin feat/portal-typing-master
# then gh pr create
```

**Step 2: After merge, deploy portal**
- `git pull` on main
- `apps/portal/client npm test && npm run build`
- restart `com.keke.portal`
- health check: `curl http://localhost:3010/health`
