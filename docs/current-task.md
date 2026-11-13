# current-task — The Single Active Task

**Task:** F0 — Scaffolding
**Status:** not started
**Spec:** see `features.md` → F0. Read `stack.md` and `architecture.md`
(folder layout + data model) before starting.

## Scope

- `client/`: create-next-app — TypeScript, Tailwind, App Router, ESLint, npm
- `server/`: TypeScript Express app written by hand (no generator):
  `index.ts` with `GET /api/health`, `db.ts` creating the full schema from
  `architecture.md`, `tsconfig.json` (strict), scripts: `dev` (tsx watch),
  `build` (tsc), `start`
- `server/.env` + `server/.env.example` (PORT, JWT_SECRET, CLIENT_URL);
  `client/.env.local` (NEXT_PUBLIC_API_URL); `.gitignore` covering
  node_modules, dist, chat.db*, .env*
- Root `README.md`: what this is + how to run both apps

## Out of scope

No auth, no routes beyond health, no socket code, no UI beyond the
create-next-app default page. (Those are F1-F4.)

## Checklist (verify before marking done)

- [ ] `npm run dev --prefix server` starts on :4000
- [ ] `curl localhost:4000/api/health` → `{"ok":true}`
- [ ] First server start creates `chat.db` with users, conversations, messages
- [ ] Server refuses to start when `JWT_SECRET` is missing
- [ ] `npm run dev --prefix client` renders on :3000
- [ ] `cd server && npx tsc --noEmit` — clean
- [ ] `npm run build --prefix client` — clean

## On completion

Append entry to `done.md` → load F1 into this file → commit.
