# Poetry ArticleView UI Refresh (Reading-first) — Design

**Goal**: Make the poetry *ArticleView* (reading page) feel less "plain" while keeping the experience *restrained* (no heavy gamification). Improve visual hierarchy, readability, and navigation across sections.

**Non-goals**
- No changes to learning semantics (start/complete endpoints remain as-is).
- No new backend APIs.
- No complex markdown rendering; keep current fixed-section extraction (`原文/注释/译文/赏析`).

---

## Current page (baseline)
File: `apps/poetry/client/src/views/ArticleView.vue`

Today the page is essentially:
- Header (Back, Title, meta)
- A single card with up to 4 content blocks (Original/Notes/Translation/Appreciation)
- Bottom actions (start/complete + link to learning record)

Problem: the visual structure is flat, and long articles require lots of scrolling with no “reading navigation”. CTA is present but not “anchored”.

---

## Chosen approach (主人确认): "Option 2" = Visual hierarchy + Section navigation chips

### 1) Visual hierarchy & layout polish (restrained)
- Add a **max-width** reading container (centered) so text doesn’t span too wide.
- Increase typography quality:
  - better line-height
  - subtle section spacing
  - consistent section header style
- Improve header meta from plain text to **badges** (collection, stage, status).
- Improve content card "paper" feeling (consistent padding, subtle shadow, separators).

### 2) Section navigation chips (only show what exists)
Add a compact navigation row under the header:
- Chips: `原文 / 注释 / 译文 / 赏析` (only show a chip if that section has non-empty content)
- Clicking a chip scrolls to its section (`scrollIntoView({behavior:'smooth'})`)
- Optional: highlight the chip for the last clicked section (purely cosmetic; no scroll spy needed initially)

### 3) Keep CTA simple, but make it feel intentional
- Keep existing semantics:
  - no state -> "今日首学完成"
  - has state -> "✅ 今日第N轮完成"
- Minor polish:
  - keep CTA visually prominent
  - ensure spacing/placement is stable

---

## UX acceptance criteria
- Page looks more like a deliberate reading page: comfortable width, spacing, and section hierarchy.
- If content includes multiple sections, user can jump between them without manual scrolling.
- No behavior change to learning state transitions.

---

## Testing strategy
- Add/adjust a **unit test** in `ArticleView.test.js` to assert:
  - chips render only for non-empty sections
  - clicking a chip triggers scroll to the correct section (mock `scrollIntoView`)
- Existing tests should continue passing.

---

## Rollout
- Ship as a small PR.
- After merge: rebuild poetry client and restart `com.keke.poetry` (same as previous UI changes).
