# Legal Process Research (US + UK + EU)

Not legal advice. This is a product/engineering research note to shape a document-generation tool. Laws/processes change; verify with qualified local counsel before launch.

## UK (England & Wales): pre-action + online money claim

### “Letter before action” / pre-action conduct
- HMCTS guidance for Money Claim Online (MCOL) notes the court expects parties to take “pre-action” steps to try to settle, and that you will “usually need to send the defendant a letter before making the claim”. It also warns failing to comply can impact (and in some cases invalidate) a claim and suggests seeking legal advice if unsure. Source: GOV.UK MCOL user guide (Updated 19 Aug 2025). https://www.gov.uk/government/publications/money-claim-online-user-guide/money-claim-online-mcol-user-guide
- A practical statement of common practice: a letter of claim “usually” gives 14 days to respond. Source: Shelter Legal (England & Wales). https://england.shelter.org.uk/professional_resources/legal/court_action_and_complaints/pre-action_protocols_for_court_claims/pre_action_protocol_objectives_and_sanctions

### Filing online
- GOV.UK “Make a court claim for money” describes when you can claim online, and the basic information needed (defendant name/address/email and a payment method or fee-help reference). https://www.gov.uk/make-court-claim-for-money/make-claim
- The Online Civil Money Claims pilot (Practice Direction 51R) currently states the pilot “is to run … to 1st October 2026”. This matters because HMCTS online filing UX and endpoints evolve under the pilot. https://www.justice.gov.uk/courts/procedure-rules/civil/rules/practice-direction-51r-online-court-pilot

### Product implication (UK)
- Treat UK support as **England & Wales only** unless you separately implement Scotland (Simple Procedure) and Northern Ireland processes.
- “Generate Court Filing” should mean: generate **user-ready PDFs + instructions**, and explicitly flag user actions (creating HMCTS account, paying fees, serving docs, etc.).

### “Do not become a legal representative” risk (UK)
- The UK regulates “reserved legal activities” (not all “legal advice” is regulated, but *conducting litigation* is reserved). Building features that file claims or interact with HMCTS on the user’s behalf creates high regulatory risk.
- High-level overview: Legal Services Board FAQ on reserved legal activities. https://legalservicesboard.org.uk/enquiries/frequently-asked-questions/reserved-legal-activities

## EU: consumer law + small claims

### Digital Content Directive 2019/770 (baseline rights)
- Directive (EU) 2019/770 sets out remedies for lack of conformity: bring into conformity, price reduction, or termination (Article 14). The trader must do conformity “within a reasonable time… free of charge… without any significant inconvenience” (Article 14(3)). Official text: EUR‑Lex. https://eur-lex.europa.eu/eli/dir/2019/770/oj

### European Small Claims Procedure (cross-border only)
- The European Small Claims Procedure is a cross-border process for certain payment claims (Commission overview: up to €5,000) and aims to let consumers pursue claims largely in writing, with forms available online and typically no need to be represented by a lawyer. Commission overview: https://commission.europa.eu/law/cross-border-cases/procedures-simplify-cross-border-cases/small-claims-procedure_en
- It is *cross-border* (at least one party in a different EU country than the court). A quick summary source: EUR‑Lex “summary” page. https://eur-lex.europa.eu/EN/legal-content/summary/european-small-claims-procedure-rules-governing-cross-border-legal-disputes.html

### Product implication (EU)
- “EU local courts” is not one workflow. Domestic small claims rules, language, and forms vary by Member State.
- MVP path that’s realistic: support (a) European Small Claims Procedure where eligible, and (b) per-country “local small claims” **as instructions + form download links** (not auto-filing).

## US: small claims + unauthorized practice of law (UPL) risk

### Small claims is state / locality specific
- Even within one state, rules/limits differ; court websites emphasize fees, service rules, and that parties often appear without lawyers.
- Examples of official self-help pages:
  - New York: small claims is “without a lawyer”, with differing limits by location. https://www.nycourts.gov/courthelp/smallClaims/index.shtml
  - California: filing fees vary by amount and service rules matter (self-help guidance). https://selfhelp.courts.ca.gov/small-claims/sue-other-side-back/file

### UPL: document generation can cross the line fast
- US UPL rules are state-based, but multiple authoritative sources show a common boundary: **typing/selling forms ≠ advising/choosing strategy**.
- Florida (state site) describes that generally a nonlawyer may only sell legal forms and type information completed in writing by the customer; cannot counsel about appropriate legal action; and advertising rules may require explicit “I am not an attorney…” notices in some circumstances. https://notaries.dos.fl.gov/education/faq/law.html
- Texas (State Bar of Texas Paralegal Division) describes “practice of law” as including preparing pleadings/documents incident to an action and services requiring legal skill/knowledge, and warns preparing legal documents for the public without attorney supervision can be UPL. https://txpd.org/ethics-articles/the-unauthorized-practice-of-law/ and https://txpd.org/faq-category/ethics-faqs/
- California State Bar warns that legal document preparers/immigration consultants cannot give legal advice or tell someone what form to use; doing so can be UPL. https://www.calbar.ca.gov/public/concerns-about-attorney/avoid-legal-services-fraud/unauthorized-practice-law

### Product implication (US)
- A “nationwide US” launch needs: (1) per-state small claims workflow coverage, and (2) a counsel-reviewed design to avoid UPL (or to structure as an attorney-supervised service).
- If you do US later, restrict the tool to: user-provided facts → document formatting → generic procedural info → clear “no legal advice” + “you choose jurisdiction/court/form”.

