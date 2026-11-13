# current-task — The Single Active Task

**Task:** F4 — Realtime messaging
**Status:** not started
**Spec:** see `features.md` → F4. Read `stack.md`, `rules.md`, and `architecture.md` (§Socket routing model, §API contract) before starting. Note: fetch Socket.IO docs via Context7 before implementing.

## Scope

- Server:
  - `sockets.ts`: Socket.IO initialization with JWT handshake auth
  - Sockets join personal room `user:<id>` on connection
  - `message:send` socket event: validate participant & content (non-empty trimmed, ≤ 2000 chars) → INSERT into `messages` → ack success/error → emit `message:new` to `user:<sender>` and `user:<peer>`
  - `GET /api/conversations/:id/messages`: return last 50 messages (oldest first, authorized participants only)
- Client:
  - `lib/socket.ts`: Socket.IO client singleton connecting on login and disconnecting on logout
  - Message pane: load and display message history + incoming live messages
  - Message send form: active sending with Socket.IO ack handling
  - Sidebar reaction: `message:new` bumps conversation to top, updates last message preview, and refetches conversation list if unknown

## Out of scope

- Account deletion (`DELETE /api/me` — F5)
- Read receipts, typing indicators, reactions (Non-goals)

## Checklist (verify before marking done)

- [ ] Socket rejects connection with invalid/missing token
- [ ] Socket joins `user:<id>` room upon valid authentication
- [ ] `message:send` persists message and emits `message:new` to both participant rooms
- [ ] `GET /api/conversations/:id/messages` returns last 50 messages in chronological order
- [ ] Unauthorized user cannot read conversation messages (returns 403)
- [ ] Live messages render in real time on both sender and recipient screens
- [ ] Messages persist across server restart
- [ ] `cd server && npx tsc --noEmit` — clean
- [ ] `npm run build --prefix client` — clean

## On completion

Append entry to `done.md` → load F5 into this file → commit.
