# done — Completed Work Log

Append-only. One entry per finished feature, newest at the top. Format:

```
## YYYY-MM-DD — F# Feature name
- What shipped (1-3 bullets)
- Deviations from the spec, if any, and where the docs were updated
```

---

## 2026-11-13 — F7 Unread message badges
- Client: implemented unread message counter per conversation; incoming messages for non-active conversations increment counter, highlight the conversation row, and display a counter pill badge on the right side of the sidebar item.
- UX & Persistence: opening a conversation clears its unread count; dynamic browser tab title displays `(N) DM Messenger` when unread messages exist; unread counts persist per-user across page reloads.

## 2026-11-13 — F6 Polish
- Client UX: implemented auto-scroll with reading-history protection (no scroll-snatch when user is scrolled up, with floating "New messages ↓" pill), alternating message loading skeletons, and empty states for conversation list, user search, and fresh chat threads.
- Realtime resilience: added live connection-state tracking (`connected`, `reconnecting`, `disconnected`) with top banner feedback, automatic history refetch on reconnect, and inline failed-send alert with one-click retry.
- Responsive design: refined two-column layout down to 375px mobile viewports, touch-friendly navigation, and polished loading states adhering to the `#F5F5F0` / `#5D866C` / `#202734` palette.

## 2026-11-13 — F5 Delete account
- Server: implemented `DELETE /api/me` with password verification, single atomic SQLite transaction anonymizing account (`deleted_at = datetime('now')`, `username = 'deleted#' || id`, profile fields blanked, `password_hash = ''`), force disconnection of active sockets in `user:<id>`, and rejection of message sending to conversations with deleted peers.
- Client: added Danger Zone on `/profile` with password confirmation modal dialog; cleared local authentication, disconnected socket, and redirected to `/login` upon deletion; styled deleted peers in `/chat` as "Deleted User" with gray initials avatar (`DU`) and disabled message input.

## 2026-11-13 — F4 Realtime messaging
- Server: implemented `sockets.ts` with JWT handshake authentication, personal `user:<id>` room routing, `message:send` with database insertion, ack feedback, and `message:new` dual-room broadcast; added `GET /api/conversations/:id/messages` returning last 50 messages for authorized participants.
- Client: built `lib/socket.ts` client singleton with auto-reconnection and authentication error management; built live message thread in `/chat` with auto-scroll, message bubbles, timestamps, send form with ack handling, and dynamic sidebar reordering on incoming messages.

## 2026-11-12 — F3 Find people & conversations
- Server: implemented `GET /api/users?q=` prefix search (max 10, excludes caller and deleted users), `POST /api/conversations` (get-or-create normalized `user_a < user_b`), and `GET /api/conversations` (recent activity first with peer profile & last message).
- Client: built responsive two-column `/chat` layout with live user search dropdown, conversation list with avatars and previews, and selected conversation thread header.

## 2026-11-12 — F2 Profile
- Server: implemented `PATCH /api/me` with length validation (first/last name ≤ 40, bio ≤ 200) updating SQLite via raw prepared SQL and returning updated `UserProfile`.
- Client: implemented `Avatar` component with initials derivation and deterministic palette hashing; built dedicated `/profile` page with live preview and save confirmation; added profile navigation in `/chat`.

## 2026-11-12 — F1 Auth
- Server auth implemented: `POST /api/auth/signup`, `POST /api/auth/login` (bcrypt hashing, JWT 7-day tokens), `requireAuth` middleware enforcing active user checks, and `GET /api/me`.
- Client auth flow implemented: `/login` and `/signup` pages with inline error handling, auth state persistence in `localStorage`, `lib/api.ts` fetch wrapper with Bearer token injection, root redirect to `/chat` or `/login`, and `/chat` logout flow.

## 2026-11-12 — F0 Scaffolding
- Monorepo scaffolded: client (Next.js App Router, TypeScript, Tailwind CSS, ESLint) and server (Express, TypeScript, better-sqlite3).
- Health check endpoint `GET /api/health` responding `{"ok":true}` and raw SQLite schema initialized automatically on startup (`users`, `conversations`, `messages`).
- Enforced strict env validation requiring `JWT_SECRET` to run; configured root README and environment files.

## 2026-07-09 — Context designed
- Project defined: DM messenger (instant DMs, initials avatars, anonymize on
  delete). Seven context docs written; no code yet.
