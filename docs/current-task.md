# current-task — The Single Active Task

**Task:** F2 — Profile
**Status:** not started
**Spec:** see `features.md` → F2. Read `rules.md` and `architecture.md` (§Display rules, §Validation, §API contract) before starting. Note: invoke frontend-design skill before building/restyling UI.

## Scope

- Server:
  - `PATCH /api/me` (requires auth): accept any of `{first_name, last_name, bio}`
  - Validation: trimmed `first_name` ≤ 40 chars, `last_name` ≤ 40 chars, `bio` ≤ 200 chars
  - Updates DB row and returns updated `UserProfile`
- Client:
  - `/profile` page: view and edit form with save confirmation feedback
  - `Avatar` component: display initials (max 2 characters) with deterministic background color derived from username hashing (gray for deleted users)
  - Display name formatting helper: "First Last" if set, else username ("Deleted User" if deleted)
  - Navigation between `/chat` and `/profile`

## Out of scope

- Avatar image uploads (initials-only per design)
- User search or conversations (F3)
- Realtime sockets (F4)
- Account deletion (F5)

## Checklist (verify before marking done)

- [ ] `PATCH /api/me` updates fields and returns updated `UserProfile`
- [ ] Over-long fields rejected by server with 400 and descriptive error message
- [ ] Edits survive page reload
- [ ] `Avatar` component renders correct initials and deterministic color palette
- [ ] Display name follows rules ("First Last" or username)
- [ ] `cd server && npx tsc --noEmit` — clean
- [ ] `npm run build --prefix client` — clean

## On completion

Append entry to `done.md` → load F3 into this file → commit.
