# Portal Weekly Reading Plan Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a fixed (bottom-right) collapsible weekly reading plan widget to the Portal home page, showing 07:15–07:35 and the weekly schedule (语文美文/古诗词 + RAZ 英语阅读). Close button hides for current page session only (no persistence).

**Architecture:**
- Add `WeeklyReadingPlanWidget.vue` component (pure UI, static data).
- Mount it inside `PortalHomeView.vue`.
- Add minimal vitest setup to portal client + 1-2 rendering tests.

**Tech Stack:** Vue 3, Vite. Add: Vitest + @vue/test-utils + jsdom.

---

### Task 1: Add failing test scaffolding (RED)

**Files:**
- Modify: `apps/portal/client/package.json` (add test scripts + dev deps)
- Create: `apps/portal/client/vitest.config.js`
- Create: `apps/portal/client/src/test/setup.js`
- Create: `apps/portal/client/src/components/__tests__/WeeklyReadingPlanWidget.test.js`

**Step 1: Add vitest deps & scripts**
- Add scripts:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
- Add devDependencies:
  - `vitest`, `@vue/test-utils`, `jsdom`

**Step 2: Add minimal vitest config**
- jsdom environment
- setupFiles: `src/test/setup.js`

**Step 3: Write failing test**
Test expectations:
- Default render shows header text `晨读计划` and `07:15–07:35`
- Default state is collapsed (plan rows NOT visible)
- Clicking expand button reveals 7 rows and specific day labels (周一…周日)

**Step 4: Run tests to confirm RED**
```bash
cd apps/portal/client
npm install
npm test
```
Expected: FAIL because component not implemented.

---

### Task 2: Implement `WeeklyReadingPlanWidget.vue` (GREEN)

**Files:**
- Create: `apps/portal/client/src/components/WeeklyReadingPlanWidget.vue`

**Behavior:**
- `visible=true` by default
- `expanded=false` by default
- Close button sets `visible=false`
- Expand toggle toggles `expanded`

**Content:**
- Shows time range 07:15–07:35
- Expanded grid shows 7 days with activities:
  - 周一/周五：语文美文
  - 周三/周日：语文古诗词
  - 周二/周四/周六：RAZ 英语阅读

**Style:**
- `position: fixed; right: 16px; bottom: 16px;`
- Glassmorphism (semi-transparent background + blur)
- Mobile media query: left/right 12px, width auto

**Step 2: Run tests to confirm GREEN**
`npm test` should pass.

**Step 3: Commit**
```bash
git add apps/portal/client/src/components apps/portal/client/src/test apps/portal/client/vitest.config.js apps/portal/client/package.json

git commit -m "feat(portal): add weekly reading plan widget"
```

---

### Task 3: Mount widget on Portal home

**Files:**
- Modify: `apps/portal/client/src/views/PortalHomeView.vue`

Add:
- `import WeeklyReadingPlanWidget from '../components/WeeklyReadingPlanWidget.vue'`
- Add `<WeeklyReadingPlanWidget />` near the root of template.

Run:
- `npm test`
- `npm run build`

Commit.

---

### Task 4: Verification + PR

**Verify:**
```bash
cd apps/portal/client
npm test
npm run build
```

**Push + PR**
- Push branch
- Open PR against main

Manual check:
- Open Portal home
- Widget appears bottom-right collapsed
- Expand shows 7-day plan
- Close hides widget until refresh

