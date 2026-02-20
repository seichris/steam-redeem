# Step-by-step implementation plan

Not legal advice. This plan assumes you will have counsel review the UX copy, disclaimers, and any jurisdiction-specific templates before public launch.

## Guiding constraints (non-negotiable)
- Prominent disclaimers on every page: “We are not lawyers… document-generation only… you file in your own name… no legal advice… no outcome guarantees.”
- No legal representation: no filing/serving/signing on the user’s behalf.
- Fixed fee (Stripe). No contingency %.
- Data minimization: store only what’s needed to generate artifacts and show progress.
- Anti-abuse: prevent spam/vexatious use and fraud.

## Phase 0 — Compliance + product safety (do first)
1. **Scope the jurisdictions** explicitly:
   - UK = England & Wales (MCOL/OCMC) only for MVP.
   - EU = (a) European Small Claims Procedure when eligible, plus (b) per-country “local small claims” as instructions/forms.
   - US = later (state-by-state + UPL review).
2. **Terms & Legal Shield**:
   - “Not a law firm / not legal advice” banner + standalone page.
   - “You are responsible for accuracy and filing.”
   - “No harassment, no fraudulent claims” acceptable use clause.
3. **UPL/regulated-activity guardrails**:
   - UX: user chooses jurisdiction, court, and remedy; the tool only drafts/organizes.
   - Templates must be “draft” and require user review/confirmation.
4. **Privacy/GDPR program**:
   - Data inventory, retention windows, deletion workflow, DSAR process.
   - Secure storage for uploads (Supabase Storage) with expiring links.
5. **Evidence integrity**:
   - Store source URLs, timestamps, hashed excerpts, and (where allowed) screenshots/PDF captures.

## Phase 1 — Steam login + owned-games table (implemented in this repo)
1. Steam OpenID sign-in (OpenID 2.0 verification against Steam).
2. Fetch owned games via Steam Web API (`GetOwnedGames` + `include_appinfo=1`).
3. Jurisdiction picker + optional extra fields (purchase date, refund denial screenshot — UI only in Phase 1).
4. Beautiful games table (TanStack Table + shadcn/ui primitives).
5. Estimated price column (Steam Store API, based on selected jurisdiction country code).
6. “Refund Potential” (simple heuristic placeholder) + “Swarm Strength” (0 placeholder).
7. “Launch Swarm” routes to placeholder page.

## Phase 2 — Payments + claim records
1. Supabase schema:
   - `users` (steamId, email opt-in, consent flags)
   - `claims` (userId, appId, jurisdiction, status, timestamps, disclaimersAcceptedAt)
   - `artifacts` (evidence bundle refs, PDFs, hashes)
   - `progress_events` (streamed status for UI)
2. Stripe Checkout:
   - One-time product per “game swarm”
   - Webhook to activate the claim + enqueue swarm run
3. Upload pipeline:
   - Secure screenshot uploads to Supabase Storage
   - Virus scanning hook (or a provider) + file type/size limits

## Phase 3 — Swarm foundation (LangGraph)
1. Define a single `ClaimState` shape that all agents read/write.
2. Implement orchestrator graph:
   - `scrape_marketing` → `extract_promises` → `legal_mapping` → `draft_letter` → `assemble_bundle`
3. Tooling:
   - Search: Serper or Tavily
   - Browser: Playwright (headless)
   - Storage: Supabase (artifacts + logs)
   - LLM: OpenRouter with structured outputs (Zod schemas)
4. Safety:
   - Source allowlist + ToS-aware scraping.
   - “Do not hallucinate citations”: every claim must map to stored evidence IDs.

## Phase 4 — Letter Before Action (PDF) + notifications
1. Letter template per jurisdiction family (UK + EU baseline), with placeholders.
2. Generate PDF (React PDF or pdf-lib) + evidence index.
3. Email and in-app notifications (Resend/Postmark).
4. Start the 14-day timer; show countdown; schedule reminders.

## Phase 5 — “Generate Court Filing” packets
1. UK (England & Wales):
   - MCOL/OCMC “ready-to-file” packet (not e-filing): claim summary, particulars draft, evidence index, fee/payment instructions.
2. EU:
   - If cross-border eligible: European Small Claims Procedure forms + instructions.
   - Otherwise: per-country small-claims instructions + links to official forms.
3. Hard user hand-offs:
   - Service of documents, court fee payment, identity checks, postal steps.

## Jurisdiction playbooks (product behavior)

### United Kingdom (England & Wales only in MVP)
1. Generate a **Letter Before Action** (draft) + evidence index.
2. Start a **14‑day countdown** and send reminders (user must choose delivery method).
3. If unresolved: generate “ready-to-file” **claim packet** for the HMCTS online process (MCOL/OCMC) + step-by-step instructions.
4. Explicitly flag user actions: setting up HMCTS account, paying the fee, choosing defendant details, submitting claim, and serving docs if required.

### EU
1. Ask whether the claim is **cross-border** (and where the defendant is domiciled).
2. If cross-border and within the **European Small Claims Procedure** scope/limit: generate the standard-form packet + filing instructions.
3. If domestic-only: generate country-specific instructions and official form links; keep automation to “drafting + formatting + checklists”.

### United States (later)
1. Ask for **state + county/city court** selection.
2. Provide per-state form bundles + generic filing/service checklists.
3. Keep strict UPL boundaries: user chooses court/form/remedy; the tool drafts and formats based on user-provided facts.

## Phase 6 — Hardening, ops, and scale
1. Rate limits + abuse detection.
2. Observability: structured logs + traces for each claim run.
3. Human review mode (optional) for high-risk cases.
4. Localization per jurisdiction (language, currency, court names).

## Market notes (what changes for US vs EU/UK)
- US small claims is state/local: limits, forms, service rules vary; you need per-state templates.
- US UPL risk is high: keep “document formatting + generic info” boundaries and get counsel review.
- EU law is harmonized at directive level but enforced nationally; store a per-country implementation map.
