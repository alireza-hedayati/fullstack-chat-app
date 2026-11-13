# current-task — The Single Active Task

**Task:** F1 — Auth
**Status:** not started
**Spec:** see `features.md` → F1. Read `rules.md` (§Code) and `architecture.md` (§Data model, §API contract) before starting.

## Scope

- Server:
  - `POST /api/auth/signup`: validate username/password, hash password with bcrypt, insert user, return JWT and UserProfile
  - `POST /api/auth/login`: validate credentials, compare bcrypt hash, return JWT and UserProfile
  - `requireAuth` middleware: verify JWT and ensure user is active (not deleted)
  - `GET /api/me`: return caller's UserProfile
- Client:
  - `/signup` and `/login` pages with inline server error feedback
  - Auth token & user state in `localStorage`
  - `lib/api.ts` fetch wrapper attaching auth header
  - Root page redirect (token → `/chat`, no token → `/login`)
  - Logout functionality (clears storage)

## Out of scope

- Profile editing (`PATCH /api/me` — F2)
- Conversations and user search (F3)
- Realtime sockets (F4)

## Checklist (verify before marking done)

- [ ] Sign up with valid credentials creates user, returns token and profile
- [ ] Duplicate username returns error without leaking internals
- [ ] Log in with wrong credentials returns friendly error
- [ ] `GET /api/me` without token returns 401
- [ ] `GET /api/me` with valid token returns user profile
- [ ] Browser refresh maintains authenticated state
- [ ] Log out clears credentials and redirects to `/login`
- [ ] `cd server && npx tsc --noEmit` — clean
- [ ] `npm run build --prefix client` — clean

## On completion

Append entry to `done.md` → load F2 into this file → commit.
