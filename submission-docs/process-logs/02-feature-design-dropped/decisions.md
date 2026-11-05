# Decisions · Feature design (dropped)

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-12 · process · Feature design deliverables, kept in `feature-design/`
- **Decided by:** user, on Claude's proposal · list proposed in [P-035](prompts/prompts.md#p-035), approved in [P-036](prompts/prompts.md#p-036); folder proposed by the user in [P-036](prompts/prompts.md#p-036)
- **What:** eleven deliverables: product spec, assumptions and open questions, functional requirements, non-functional requirements, event model (kept separate), core entities and data model, high-level design, API design, tech stack, auth and data-source choices, low-fi wireframes (three screens), roadmap. All live in `feature-design/` as living documents: locked once approved, reopened only by an explicit decision logged here.
- **Why:** the user's starting list, plus Claude's additions: an assumptions log because the brief is "vague on purpose", and the event model as its own document because "what counts as important" is the core ambiguity. The user's response: "I agree with the list."

### D-13 · process · A three-role design team, with the user as product manager
- **Decided by:** user, on Claude's recommendation of single owners and independent reviews · proposed in [P-036](prompts/prompts.md#p-036), approved in [P-037](prompts/prompts.md#p-037)
- **What:** agents `cto`, `eng-lead` and `product-designer` in `.claude/agents/`. Each document in `feature-design/` has one owner who writes it; the other two review it on their own, against checks that can fail it. The user settles conflicts and approves. For the feature design phase the roles take over the architect's job; how that changes `/kickoff` is still open.
- **Ownership:** product designer: product spec, assumptions, wireframes. Engineering lead: functional and non-functional requirements, event model, data model, API. CTO: tech stack, auth and data sources, high-level design, roadmap.
- **Why:** the user wanted roles "with slightly different priorities but working towards a shared goal, as a real team would". Claude's condition: one writer per document and independent reviews, so the roles disagree instead of converging politely.

### D-14 · process · `/design` replaces `/kickoff`
- **Decided by:** user, over Claude's recommendation to keep `/kickoff` alongside · [P-038](prompts/prompts.md#p-038)
- **What:** the feature design phase runs as `/design`, orchestrating the three roles from D-13. `/kickoff` and the `architect` agent go once `/design` is written; git history keeps them. See I-12.
- **Why:** not stated beyond the name: "I like the term better."

### D-15 · process · How `/design` runs: five stages, bounded reviews, a gate per stage
- **Decided by:** user, on Claude's proposal · proposed in [P-038](prompts/prompts.md#p-038), approved in [P-039](prompts/prompts.md#p-039)
- **What:** stages in dependency order: frame, requirements, stack and sources, design (five documents written in parallel and cross-reviewed), roadmap. In each stage the author's tier-one questions go to the user first, then the author writes, the two other roles review independently, and the author revises once. A second review round runs only if a blocker remains; after that it goes to the user. Every stage ends at a gate where the user approves. Defined in [`.claude/skills/design/SKILL.md`](../../.claude/skills/design/SKILL.md).
- **Why:** dependency order, plus enough review to surface real disagreement without using up the 24 hours (about 15–20 agent runs). The user's response: "All approved."

### D-16 · process · `/build` reads `feature-design/`; the architect is removed
- **Decided by:** user, on Claude's recommendation · [P-039](prompts/prompts.md#p-039)
- **What:** the planner and `/build` read the documents in `feature-design/` and the roadmap at `feature-design/roadmap.md`, instead of `SPEC.md`, `PLAN.md` and `ROADMAP.md`. A change to a design document goes through `/design revise`. The `architect` agent and the `/kickoff` skill are deleted.
- **Why:** one set of design documents, rather than stage 5 also rewriting them into the old three files. The user's words: "Pointe the planner at `feature-design`."

### D-17 · process · One folder for design and milestone docs; `/brief` dropped
- **Decided by:** user · [P-040](prompts/prompts.md#p-040); subfolder names by Claude
- **What:** `specs/` is gone. The templates moved to `feature-design/templates/`, and the planner writes milestone specs to `feature-design/milestones/NN-title.md`. The `/brief` skill and the `brief.md` stub are deleted, and `/setup` no longer creates the stub. See I-13.
- **Why:** `/brief` "just adds noise" when the repo starts with the design, and the documents belong in the `feature-design` folder the user planned.

### D-18 · scope · Stage 1 frame: seventeen tier-one answers
- **Decided by:** user · [P-043](prompts/prompts.md#p-043), on the product designer's recommended defaults for thirteen of them; the four overrides are I-14
- **What:** news, markets and disasters, one live source each, plus admin "inject test event"; two system levels per category; cross-source dedup, at most once per alert; no rate cap; edit only, no pause; immediate, polled at least every 5 minutes; email to the account address and Slack by pasted webhook, either or both; real email provider; 3 retries then visible failure; channels as a code interface; magic link with an admin allowlist; admin operates the system. Threshold values left open. Full list in the [product spec's Decisions](dropped-documents/dropped-from-initial-design-skill/product-spec.md#decisions).
- **Why:** per question, in the product spec. Overrides are in I-14.

### D-19 · scope · Stage 1 frame: four follow-up answers
- **Decided by:** user · [P-044](prompts/prompts.md#p-044), on the product designer's defaults for three; the override is I-15
- **What:** dedup works within a category only, by the source's event ID. A dead Slack webhook sets a status on the alert and sends one email. Only an admin can re-enable an alert an admin disabled. Events below "Notable" are dropped at fetch. Recorded in the [product spec's Decisions](dropped-documents/dropped-from-initial-design-skill/product-spec.md#decisions).
- **Why:** the designer found these while writing: one source per category leaves cross-source merging nothing to merge within a category, and the others were left open by D-18.

### D-20 · process · Any answer can defer an option to post-MVP
- **Decided by:** user, on Claude's proposal · asked in [P-046](prompts/prompts.md#p-046), approved in [P-047](prompts/prompts.md#p-047)
- **What:** an answer typed as "1 post-MVP, MVP should be X" records X as the decision and adds the deferred option to a Post-MVP section of `product-spec.md` (`PM-NN`, linked to the decision). The CTO turns each one into a milestone after the MVP, or a non-goal, in the roadmap. Added to `/design`, `/build`, `product-designer` and `cto`.
- **Why:** the user wants to "take out some decisions and put them as post-MVP", now and while answering future questions. Claude's addition: every deferral names its MVP behaviour, and the roadmap tracks it.

### D-21 · scope · Stage 1 review: answers to the reviewers' questions
- **Decided by:** user · [P-049](prompts/prompts.md#p-049); overrides of recommendations are in I-16
- **What:**
  - Hard delete that keeps the delivery log rows.
  - An event older than the subscription's creation or last edit is never sent.
  - Slack 404 or 403 means broken; a 400 shows to the admin only; a 429 waits for `Retry-After`.
  - Test events go to everyone they match.
  - No verified email domain.
  - The eng lead's rules for admin disable and retry.
  - Status per channel, with precedence.
  - The news rule is settled in stage 3.
  - Source outages show in the admin view only.
  - Scope is marked Must or Should, with a cut order.
  - Left open: the dedup keys (until the sources are inspected) and how magic links reach users without a domain (until stage 3).
  - Recorded in the [product spec's Decisions](dropped-documents/dropped-from-initial-design-skill/product-spec.md#decisions).
- **Why:** blockers and majors in [S1-cto-r1](dropped-documents/dropped-from-initial-design-skill/reviews/S1-cto-r1.md) and [S1-eng-lead-r1](dropped-documents/dropped-from-initial-design-skill/reviews/S1-eng-lead-r1.md).

### D-22 · scope · Roles disagreed on sign-in, delete and Slack errors; the user settled each
- **Decided by:** user · [P-049](prompts/prompts.md#p-049)
- **Sign-in:** CTO, an allowlist, because an open magic-link form is a spam relay and can use up the free email quota. Eng lead, open sign-up with single-use 15-minute links. **Chosen: open sign-up.**
- **Delete:** CTO, a hard delete that erases the webhook URL and keeps the log rows. Eng lead, a soft delete. **Chosen: hard delete.**
- **Slack errors:** CTO, any 4xx except 429 means broken. Eng lead, 404 or 403 means broken, and a 400 shows to the admin only. **Chosen: the eng lead's.** On a 429 (rate limit), the eng lead's wait for `Retry-After` was chosen over the CTO's counting it as a retry.

### D-23 · scope · MVP is one on/off subscription; categories, levels and filters move to post-MVP
- **Decided by:** user, unprompted · [P-049](prompts/prompts.md#p-049); first use of D-20
- **What:** each user opts in to or out of the whole service and picks the channels: email, Slack or both. One fixed, high importance bar per category, with values still open. Post-MVP: PM-01 per-category opt-in, PM-02 user-chosen levels, PM-03 one optional keyword, region or asset filter. This supersedes PD-03 and PD-05 from D-18.
- **Why:** not stated. The user's words: "we shouldn't set up levels for the MVP, just an on-off".

### D-24 · scope · Stage 1 revision: four follow-up answers, and a cap of 10 accounts
- **Decided by:** user · [P-051](prompts/prompts.md#p-051), on the product designer's defaults for three; OQ-11 is I-17
- **What:**
  - Switching the subscription On counts as an edit, so nothing from the Off period is sent.
  - Events below the MVP bar are dropped at fetch.
  - The inject form has no level field.
  - Open sign-up is capped at 10 accounts.
  - Magic links: 3 per address per hour.
  - Send test: 5 per user per minute.
  - Stage 3 may relax these limits if the email provider covers it.
  - Recorded in the [product spec's Decisions](dropped-documents/dropped-from-initial-design-skill/product-spec.md#decisions).
- **Why:** the one-subscription MVP (D-23) left these rules pointing at levels that no longer exist. For the limits, the user's words: "If we say we support 10 addresses max that should be OK for the demo, no?"

### D-25 · scope · Stage 1 review round 2: five answers
- **Decided by:** user, on the reviewers' defaults · [P-054](prompts/prompts.md#p-054)
- **What:**
  - A new address takes one of the 10 account places when a link is requested, and the place is freed if the link expires unused.
  - The mail-catcher runs in local development only. Real sending to everyone is decided in stage 3.
  - "Disabled by an admin" is stored on the account.
  - The event's own time is compared against three resets: create, switch On, admin re-enable.
  - Switching Off cancels unsent deliveries.
  - Recorded in the [product spec's Decisions](dropped-documents/dropped-from-initial-design-skill/product-spec.md#decisions).
- **Why:** majors in [S1-cto-r2](dropped-documents/dropped-from-initial-design-skill/reviews/S1-cto-r2.md) and [S1-eng-lead-r2](dropped-documents/dropped-from-initial-design-skill/reviews/S1-eng-lead-r2.md). For the catcher, the user asked "Maybe real email sending is simple enough with an external service?". Claude explained that the obstacle is the sending domain, not the code.

### D-26 · scope · Roles disagreed on when an account place is taken; the user chose the CTO's
- **Decided by:** user · [P-054](prompts/prompts.md#p-054)
- **CTO:** a place is taken when a link is requested and freed when the link expires unused. This bounds outbound email.
- **Eng lead:** an account exists only once its first link is used, so typed-in addresses can't fill the cap. But it leaves no limit on links sent to new addresses.
- **Chosen:** the CTO's.

