# current-task — The Single Active Task

**Task:** F7 — Unread message badges
**Status:** completed
**Spec:** see `features.md` → F7.

## Completed Work

- Track unread message count per conversation in client state and persist per-user in `localStorage`.
- When `message:new` arrives for a conversation that is not currently selected, increment its unread counter and bump conversation to top.
- Display unread counter badge on the right side of the conversation card in the sidebar:
  - Sage green `#5D866C` pill badge with bold white number
  - Bold peer name and last message snippet when unread
  - Graceful support for counts > 99 (`99+`)
- Clear unread count when conversation is opened / selected.
- Dynamic document title: `(${totalUnread}) DM Messenger` when unread messages exist, reverting to `DM Messenger` when read or upon logout.

## Checklist

- [x] Receiving message for non-active conversation increments its counter
- [x] Badge displays with number on the right side of the sidebar conversation item
- [x] Selecting the conversation clears the badge
- [x] Incoming messages for currently active conversation do not increment unread counter
- [x] Document title reflects total unread count when > 0
- [x] `cd server && npx tsc --noEmit` — clean
- [x] `npm run build --prefix client` — clean

---

*All roadmap features (F0 through F7) are completed. See `features.md` §Later for candidate future features.*
