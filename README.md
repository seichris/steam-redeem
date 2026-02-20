# Automated Small Claims Nuke

Not legal advice. We are not lawyers. This project generates draft documents and organizes evidence; it does not provide legal representation, cannot file claims for you, cannot sign for you, and does not guarantee any outcome.

## What exists (Phase 1)
- Steam OpenID sign-in
- Fetch owned games via Steam Web API (`IPlayerService/GetOwnedGames?include_appinfo=1`)
- Dashboard with a TanStack Table showing games + estimated store price (by jurisdiction)

## Tech stack (MVP)
- Next.js 15 (App Router) + TypeScript
- Tailwind + shadcn/ui primitives + TanStack Table
- Backend: Next.js route handlers
- DB: Supabase (planned in later phases)
- AI workflow: Gemini-only step runner (single API key)

## Local setup

### Prereqs
- Node.js 20+
- `pnpm`
- Steam Web API Key (for owned games)

### Configure env
1. `cp .env.example .env`
2. Fill in:
   - `AUTH_SECRET` (long random string)
   - `APP_BASE_URL` (e.g. `http://localhost:3000`)
   - `STEAM_WEB_API_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (optional)

### Install + run
```bash
pnpm install --store-dir .pnpm-store
pnpm dev
```

Open `http://localhost:3000` → “Sign in with Steam”.

## Docs
- `docs/requirements-audit.md`
- `docs/legal-process-research.md`
- `docs/architecture.mmd`
- `docs/implementation-plan.md`
- `docs/letter-before-action-template.md`
- `docs/disclaimers.md`
