# done — Completed Work Log

Append-only. One entry per finished feature, newest at the top. Format:

```
## YYYY-MM-DD — F# Feature name
- What shipped (1-3 bullets)
- Deviations from the spec, if any, and where the docs were updated
```

---

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
