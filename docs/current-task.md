# current-task — The Single Active Task

**Task:** F6 — Polish
**Status:** completed
**Spec:** see `features.md` → F6.

## Completed Work

- Auto-scroll behavior: smooth scroll when near bottom, no scroll snatching when reading history, floating "New messages ↓" pill when new messages arrive.
- Empty states: tailored empty state for conversation list, user search results, and fresh conversation threads.
- Loading states: skeleton layout for initial load and message history (no layout jumps or unstyled flashes).
- Realtime connection indicator: tracks `connected` / `reconnecting` / `disconnected` status with reconnect banner and automatic history refetch upon reconnecting.
- Failed-send error banner with 1-click "Retry" and dismiss actions.
- Responsive design: optimized for 375px mobile viewport with back button, compact padding, and touch-friendly controls.
- Consistent `#F5F5F0`, `#5D866C`, and `#202734` palette alignment across all pages.

## Checklist

- [x] Killing server shows disconnected / reconnecting state in UI; restart recovers
- [x] Auto-scroll smoothly keeps to bottom on new messages if near bottom, doesn't snatch scroll if reading history
- [x] Empty state for conversation list, search results, and empty chat thread
- [x] Loading states clean with no layout jumps or unstyled flashes
- [x] Failed message send clearly surfaces error feedback
- [x] Responsive layout fully usable at 375px viewport width
- [x] `cd server && npx tsc --noEmit` — clean
- [x] `npm run build --prefix client` — clean

---

*All roadmap features (F0 through F6) are completed. See `features.md` §Later for candidate future features.*
