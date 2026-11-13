# current-task — The Single Active Task

**Task:** F6 — Polish
**Status:** not started
**Spec:** see `features.md` → F6. Read `rules.md` and `frontend-design` before starting.

## Scope

- Auto-scroll behavior (only scroll down when user is already near the bottom, otherwise show new message pill / don't snatch scroll)
- Empty states (no conversations, empty message thread, no search results)
- Loading states (skeleton / subtle pulse states for conversations, message history, user search)
- Realtime connection-status indicator (e.g. connected / reconnecting banner or dot)
- Failed-send feedback & retry handling
- Consistent Tailwind design pass (palette alignment with `#F5F5F0`, `#5D866C`, and `#202734`)
- Usable down to 375px mobile viewport width (smooth mobile sidebar / chat pane navigation)

## Out of scope

- Future features (typing indicators, presence, unread counters, group chats, etc.)

## Checklist (verify before marking done)

- [ ] Killing server shows disconnected / reconnecting state in UI; restart recovers
- [ ] Auto-scroll smoothly keeps to bottom on new messages if near bottom, doesn't snatch scroll if reading history
- [ ] Empty state for conversation list, search results, and empty chat thread
- [ ] Loading states clean with no layout jumps or unstyled flashes
- [ ] Failed message send clearly surfaces error feedback
- [ ] Responsive layout fully usable at 375px viewport width
- [ ] `cd server && npx tsc --noEmit` — clean
- [ ] `npm run build --prefix client` — clean

## On completion

Append entry to `done.md` → load Next task / mark complete → commit.
