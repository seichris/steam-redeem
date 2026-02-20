```text
.
├─ docs/
│  ├─ architecture.mmd
│  ├─ disclaimers.md
│  ├─ folder-structure.md
│  ├─ implementation-plan.md
│  ├─ legal-process-research.md
│  ├─ letter-before-action-template.md
│  └─ requirements-audit.md
├─ supabase/
│  └─ schema.sql
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ auth/
│  │  │  │  ├─ logout/route.ts
│  │  │  │  └─ steam/
│  │  │  │     ├─ callback/route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ me/route.ts
│  │  │  └─ steam/
│  │  │     ├─ app-price/route.ts
│  │  │     └─ owned-games/route.ts
│  │  ├─ dashboard/
│  │  │  ├─ page.tsx
│  │  │  └─ ui/dashboard-client.tsx
│  │  ├─ legal/page.tsx
│  │  ├─ swarm/[appId]/page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ disclaimer-banner.tsx
│  │  └─ ui/
│  │     ├─ alert.tsx
│  │     ├─ badge.tsx
│  │     ├─ button.tsx
│  │     ├─ input.tsx
│  │     ├─ label.tsx
│  │     ├─ select.tsx
│  │     └─ table.tsx
│  ├─ lib/
│  │  ├─ ai/gemini.ts
│  │  ├─ auth/session.ts
│  │  ├─ jurisdiction.ts
│  │  └─ steam/
│  │     ├─ api.ts
│  │     ├─ openid.ts
│  │     └─ store.ts
│  ├─ workflows/
│  │  └─ gemini-swarm.ts
│  └─ lib/utils.ts
├─ .env.example
├─ .eslintrc.json
├─ .gitignore
├─ components.json
├─ next-env.d.ts
├─ next.config.mjs
├─ package.json
├─ pnpm-lock.yaml
├─ postcss.config.mjs
├─ README.md
├─ tailwind.config.ts
└─ tsconfig.json
```
