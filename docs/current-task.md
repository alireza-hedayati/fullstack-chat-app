# current-task — The Single Active Task

**Task:** F3 — Find people & conversations
**Status:** not started
**Spec:** see `features.md` → F3. Read `rules.md` and `architecture.md` (§Data model, §API contract) before starting. Note: invoke frontend-design skill before building/restyling UI.

## Scope

- Server:
  - `GET /api/users?q=`: username prefix search (max 10 results, excludes caller and deleted users)
  - `POST /api/conversations`: get-or-create conversation with `{username}` (returns `200` existing or `201` created `ConversationSummary`)
  - `GET /api/conversations`: list caller's conversations with peer profile and last message, sorted by most recent activity first
- Client:
  - `/chat` layout: responsive sidebar with conversation list and search box
  - Search input with live results to start or open a conversation
  - Conversation list displaying peer avatar, display name, and last message preview
  - Empty state message pane for selected conversation (realtime messaging in F4)

## Out of scope

- Realtime socket event fan-out (`message:send`, `message:new` — F4)
- Message history fetching (F4)
- Account deletion (F5)

## Checklist (verify before marking done)

- [ ] `GET /api/users?q=` returns matching users (case-insensitive prefix), excluding caller and deleted accounts
- [ ] `POST /api/conversations` creates a conversation if none exists (normalized `user_a < user_b`)
- [ ] `POST /api/conversations` with the same peer reuses the existing conversation
- [ ] `GET /api/conversations` returns conversations ordered by recent activity
- [ ] Client sidebar renders conversations with peer avatar and display name
- [ ] Selecting a conversation displays the active conversation panel
- [ ] `cd server && npx tsc --noEmit` — clean
- [ ] `npm run build --prefix client` — clean

## On completion

Append entry to `done.md` → load F4 into this file → commit.
