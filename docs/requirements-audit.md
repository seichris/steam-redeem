# Requirements Audit (from prompt)

This document restates every requirement in the provided prompt and flags feasibility/compliance notes. It is not legal advice.

## Product framing / UI tone
- **Must:** Landing page + UI copy matches the “swarm / ruthlessly cited / forces publishers to fold” tone.
- **Risk / note:** Avoid copy that suggests harassment, extortion, or guaranteed outcomes. Keep the “tough documentation” vibe but pair with clear, prominent “no legal advice / no outcome guarantees” language.

## Exact user flow (MVP must implement this exactly)
1. **Sign in with Steam** (OpenID + Steam Web API).
2. Steam returns **SteamID** → fetch owned games via `IPlayerService/GetOwnedGames` with `include_appinfo=1`.
3. User selects **jurisdiction** (dropdown: UK, Germany, France, Spain, Italy, Netherlands, Other EU, …) + optional extra data (purchase date, refund denial screenshot upload).
4. Website shows a **beautiful table**:
   - Game title + Steam icon + price paid (or estimated)
   - “Refund Potential” score (High/Medium)
   - “Swarm Strength” (number of broken promises found)
   - One-click “Launch Swarm on this game”
5. User pays (Stripe) to activate agents for that game.
6. Real-time progress dashboard with statuses.
7. When agents finish: Email + in-app notification with PDF Letter Before Action, plus a 14‑day timer.
8. After 14 days: “Generate Court Filing” button (PDF + step-by-step instructions for MCOL / local EU court).

**Audit notes**
- Steam’s owned-games API does **not** provide “price paid”; only “estimated/current store price” is realistic without purchase receipts.
- “EU local courts” cannot be one workflow; it must be per-country (and often per-region) instructions and forms.
- UK online claiming is evolving (MCOL vs Online Civil Money Claims); MVP should explicitly scope to **England & Wales** and treat “Generate Court Filing” as PDFs + instructions, not e-filing.

**Status in this repo**
- Phase 1 implemented: Steam sign-in, owned-games fetch, jurisdiction selection, game table (with estimated store price), and a placeholder “Launch Swarm”.
- Phase 2+ planned: payments, progress dashboard, LBA PDF, 14‑day timer, and court packet generation.

## Background agent swarm (LangGraph or CrewAI)
**Must design a multi-agent system with at least:**
- Scraper Agent: Steam news + Selenium/Playwright + Serper/Tavily to scrape Steam announcements; dev Twitter/X; YouTube trailers (transcripts); E3 press releases; roadmap PDFs.
- Legal Analyst Agent: map promises → EU Digital Content Directive 2019/770 + UK CRA 2015. Output cited paragraphs.
- Letter Drafter Agent: professional, heavily cited Letter Before Action (PDF).
- Filing Agent: MCOL-ready PDF + instructions (or local EU small-claims form). Flag physical steps.
- Orchestrator Agent: timing, reminders, handoffs.

**Audit notes**
- Twitter/X scraping/API access is fragile and ToS-sensitive. Design a source-allowlist and store only permitted extracts (or require user-provided links).
- “Ruthlessly cited” requires a *citation pipeline* (store URL + timestamp + excerpt hash + screenshot/PDF) and a reproducible evidence bundle.

## Parts agents CANNOT do (must be clearly flagged)
- Physically post letters (use Lob/Postal.io where possible; otherwise instructions).
- File court claims on user’s behalf.
- Sign documents as the user.
- Guarantee any outcome.

## Legal & compliance requirements (non-negotiable)
- Every page: prominent disclaimer “We are not lawyers… document-generation only… you file in your own name… no legal advice.”
- Store nothing that would make us a legal representative.
- Payments: Stripe; users pay a fixed service fee; no % contingency.
- “Terms & Legal Shield” page explaining the model.

**Audit notes**
- Add anti-abuse: identity checks for claimants (lightweight), rate limits, and “truthfulness” attestations to reduce fraudulent or vexatious filings.
- Add privacy/GDPR program: data minimization, retention windows, DSAR handling, and secure storage for uploads.

## Tech stack (exact stack for MVP)
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + TanStack Table
- Auth: Steam OpenID (openid-client or next-auth w/ Steam provider)
- Backend: Next.js API routes + LangGraph (or CrewAI)
- DB: Supabase (Postgres)
- AI: OpenRouter (or Anthropic + Grok) w/ structured outputs
- Scraping: Playwright + Serper.dev or Tavily
- PDF: `@react-pdf/renderer` or `pdf-lib`
- Emails: Resend or Postmark
- Payments: Stripe Checkout + webhooks
- Hosting: Vercel

**Audit notes**
- Steam uses OpenID 2.0; “openid-client” (OpenID Connect) may not fit. Implement OpenID 2.0 verification directly or via a Steam OpenID library, while still meeting the “Steam OpenID” requirement.

## Deliverables (must output in this order)
1. Full project folder structure
2. README.md (setup + legal disclaimer text)
3. Architecture diagram (Mermaid)
4. Step-by-step implementation plan (phased)
5. All code for Phase 1 (Steam login + owned games table)
6. Agent graph definition (LangGraph) with tools
7. Sample Letter Before Action template with placeholders
8. List of every legal disclaimer text needed
