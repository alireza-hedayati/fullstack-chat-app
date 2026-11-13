# current-task — The Single Active Task

**Task:** F5 — Delete account
**Status:** not started
**Spec:** see `features.md` → F5. Read `rules.md` and `architecture.md` (§Account deletion, §API contract) before starting.

## Scope

- Server:
  - `DELETE /api/me`: requires `{ password }` verification
  - Single atomic transaction:
    - Sets `deleted_at = datetime('now')`
    - Renames `username = 'deleted#' || id`
    - Blanks profile fields (`first_name = ''`, `last_name = ''`, `bio = ''`)
    - Clears `password_hash = ''`
  - Force disconnect all active sockets in `user:<id>`
  - Prevent sending messages to a conversation where the peer is deleted (acks error)
- Client:
  - Danger Zone on `/profile` page: "Delete account" with password confirmation modal
  - On successful deletion: clears `localStorage`, disconnects socket, redirects to `/login`
  - In `/chat`: deleted peers render as "Deleted User" with gray avatar and disabled message input

## Out of scope

- Physical row deletion (anonymize per architecture design)
- F6 polish pass

## Checklist (verify before marking done)

- [ ] `DELETE /api/me` with wrong password returns 401
- [ ] `DELETE /api/me` with valid password anonymizes user in SQLite transaction
- [ ] Deleted user cannot log in or authenticate with old JWT
- [ ] Active sockets for deleted user are force-disconnected
- [ ] Sending messages to a deleted peer is rejected with an error
- [ ] Messages from deleted account render as "Deleted User" with gray avatar
- [ ] `cd server && npx tsc --noEmit` — clean
- [ ] `npm run build --prefix client` — clean

## On completion

Append entry to `done.md` → load F6 into this file → commit.
