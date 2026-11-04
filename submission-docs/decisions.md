# Decisions

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-01 · process · Log every prompt and reply with Claude Code hooks
- **Decided by:** user · [P-001](prompts/prompts.md#p-001), [P-002](prompts/prompts.md#p-002)
- **What:** `UserPromptSubmit` and `Stop` hooks append to `prompts/raw/prompts.jsonl` and regenerate `prompts/prompts.md`. Nothing is logged by hand.
- **Why:** not stated in the scratchpad. The brief requires "all prompts used during the process".
- **Source:** [`scratchpad.md`](scratchpad.md) ("Log all prompts with hooks.")

### D-02 · process · Copy the flow agents and skills into the repo instead of installing the plugin
- **Decided by:** user · session in `~/dev/flow`, see [`prompts/prompts-elsewhere/`](prompts/prompts-elsewhere/prompts.md)
- **What:** the five agents, four skills and templates live in `.claude/`. The plan had been to install the local `flow` plugin.
- **Why:** "They are not tested and need to be adapted anyway, better to keep them local for evidence."
- **Source:** [`scratchpad.md`](scratchpad.md)

### D-03 · process · Record decisions, checks and corrections in the workflow itself
- **Decided by:** user, on Claude's recommendation · proposed in [P-007](prompts/prompts.md#p-007), approved in [P-009](prompts/prompts.md#p-009)
- **What:** this file and [`interventions.md`](interventions.md). The prompt hook gives each prompt an ID, reminds Claude every turn to log, and reports rejected tool calls and interrupts from the transcript. The `/build` and `/kickoff` skills log reviewer FAILs, walkthrough rejections and tier-one answers.
- **Why:** "not relying on me tagging my prompts". Decision tiers sort out which decisions get logged here.

### D-04 · scope · Drop the model from the prompt log
- **Decided by:** user, Claude agreed · [P-003](prompts/prompts.md#p-003); added to this log in [P-012](prompts/prompts.md#p-012)
- **What:** `prompts.md` records date, mode, prompt and reply, but not the model. [P-001](prompts/prompts.md#p-001) had asked for the model.
- **Why:** "Seems like model logging is complicated." Claude found that the hooks don't receive the model reliably, and switching with `/model` triggers no hook.

### D-05 · scope · Node toolchain and a gitleaks pre-commit hook, set before the brief
- **Decided by:** user · [P-014](prompts/prompts.md#p-014). Claude had recommended deleting `package.json` until `/brief` settles the stack.
- **What:** `package.json` from `npm init -y`, plus `.editorconfig`, `.gitattributes` and `.nvmrc` (Node 26) copied from `~/dev/node-starter`. Husky 9 runs `gitleaks git --pre-commit --staged --no-banner --redact` before every commit. `.gitignore` ignores `node_modules/`, `.DS_Store`, `__pycache__/` and `original-brief.pdf`.
- **Why:** "fixed for consistency in runtime environment" ([P-015](prompts/prompts.md#p-015)). `/brief` takes Node as given.

### D-06 · process · Name new decision and intervention entries in the reply
- **Decided by:** user · [P-019](prompts/prompts.md#p-019)
- **What:** a reply that adds to this file or [`interventions.md`](interventions.md) ends with a **Logged:** line giving each new entry's ID and heading. `checks.md` rows are not listed.
- **Why:** "clearly mark (if not alread) if a new item was added to interventions or decisions". Checks need no marking because "you list them clearly".

### D-07 · process · Keep the assessment brief as Markdown, not PDF
- **Decided by:** user · [P-021](prompts/prompts.md#p-021)
- **What:** `original-brief.pdf` converted to `original-brief.md` and the PDF deleted. `.gitignore` and the `/brief` skill now name the `.md`, which stays out of the repo as the PDF did.
- **Why:** "a format less expensive for you", to avoid running `pdftotext` every time it is read.
- **Checked:** Claude compared the two word for word, ignoring line breaks and list markers. No differences.

### D-08 · process · Describe the process logs in their own file
- **Decided by:** user, over Claude's recommendation of a section in `workflow.md` · [P-024](prompts/prompts.md#p-024)
- **What:** [`process-logs.md`](process-logs.md) explains the four logs, what writes each one and how to read them. It points to the rules in `CLAUDE.md` rather than copying them. `workflow.md` links to it.
- **Why:** "to keep them separate from the agentic workflow description" ([P-025](prompts/prompts.md#p-025)).

### D-09 · process · One autonomy level: the user approves every stage
- **Decided by:** user · [P-028](prompts/prompts.md#p-028)
- **What:** `/kickoff` and `/build` take no `--mode`. Tier-one questions are always asked; `/kickoff` stops after every stage, `/build` after the spec and after the walkthrough. `default-unreviewed` is dropped from `Decided by`, since no default is taken without the user.
- **Why:** "that mode makes sense for the human-in-the-loop type mode that we use in this repo". See I-09.

### D-10 · process · Group the log IDs by phase in `phases.md`
- **Decided by:** user; names by Claude · [P-029](prompts/prompts.md#p-029)
- **What:** [`phases.md`](phases.md) lists, per phase of the work, the range of prompt, decision, intervention and check IDs. The first phase is "Setup". The user proposed `milestones.md` and "repo-setup"; Claude suggested "phases", since "milestone" already means a roadmap entry (`M1`, `M2`, ...) in `ROADMAP.md`.
- **Why:** the repo setup is done and feature design starts next; "at a later stage we want to group the prompts, checks etc. per milestone", and for now "enough to log the IDs somewhere".

### D-11 · process · Commit message format for this repo
- **Decided by:** user, on Claude's recommendation · asked in [P-031](prompts/prompts.md#p-031), settled in [P-032](prompts/prompts.md#p-032)
- **What:** imperative subject of 50 characters or less, no trailing period. A short body only when the reason isn't recorded in the logs or a spec. Set in this repo's `CLAUDE.md`; the global one-line rule is unchanged.
- **Why:** "use industry standard commit messages, clear and descriptive". Claude kept the body optional because the logs here already hold the reasons. Scope: "This repo only is fine."

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
- **What:** stages in dependency order: frame, requirements, stack and sources, design (five documents written in parallel and cross-reviewed), roadmap. In each stage the author's tier-one questions go to the user first, then the author writes, the two other roles review independently, and the author revises once. A second review round runs only if a blocker remains; after that it goes to the user. Every stage ends at a gate where the user approves. Defined in [`.claude/skills/design/SKILL.md`](../.claude/skills/design/SKILL.md).
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

### D-27 · process · Drop `/design`; start with a local-demo phase
- **Decided by:** user · [P-057](prompts/prompts.md#p-057); Claude reviewed the plan in the reply
- **What:** the `/design` skill is deleted (see I-19). The new plan:
  - The `product-designer` interviews the user from `original-brief.md` and writes a mostly non-technical product spec in `feature-design/`.
  - A roadmap then leads to a local demo: one user journey that tries real external data sources and email and Slack delivery, with no public deployment, so security stays in the user's control.
  - D-13 to D-16, D-18 to D-21 and D-23 to D-26 no longer apply. D-20 (post-MVP answers) stays in `/build` and the `product-designer`.
- **Why:** "the resulting docs are too complicated." The aim is "a better understanding of the data and external services we may use to guide us in our later plans".

### D-28 · process · Local-demo workflow: interview spec, joint roadmap, references updated
- **Decided by:** user, on Claude's suggestions 1, 4 and 5 · proposed in [P-057](prompts/prompts.md#p-057), approved in [P-058](prompts/prompts.md#p-058)
- **What:**
  - The `product-designer` interviews the user and writes `feature-design/product-spec.md` to a fixed outline of about two pages, with no technologies and without reading `submission-docs/`.
  - The user and Claude draft `feature-design/roadmap.md` together, with no role reviews.
  - `CLAUDE.md`, its `/setup` template, `workflow.md`, `process-logs.md`, `/build`, the planner, `/setup` and both roadmap templates no longer mention `/design`.
  - The `product-designer` agent is rewritten as an interviewer. `cto` and `eng-lead` are kept but unused.
- **Why:** keep the spec small enough that the dropped complexity (I-19) doesn't return. "1, 4 and 5 approved, go ahead".

### D-29 · scope · Product spec interview: ten answers
- **Decided by:** user · [P-059](prompts/prompts.md#p-059), on the product designer's defaults for seven; overrides in I-21
- **What:**
  - One professional user. The demo covers the full loop: an alert is set up, a real earthquake happens, and it reaches the user by email and Slack while the admin watches.
  - The product alone decides what is important, using one bar set from the data.
  - The user picks only the channels.
  - Alerts are instant with no cap, and no event is sent twice.
  - The admin only watches.
  - The demo has a pre-set user and admin, with no login.
  - Each message carries the full content, including a pause link.
  - Recorded in the [product spec's Decisions](../feature-design/product-spec.md).
- **Why:** per question, in the spec.

### D-30 · scope · Product spec: one alert, no pause, delete allowed, no retries
- **Decided by:** user · [P-060](prompts/prompts.md#p-060); overrides in I-22
- **What:**
  - One alert per user.
  - No pause, in the message or on the site; the alert is changed on the site by edit or delete.
  - The user can delete their alert.
  - A failed delivery is not retried; the admin sees each failure and its reason.
  - The spec keeps its draft structure (requirement IDs, glossary, eleven post-MVP items) instead of the two-page outline agreed in D-28.
  - Recorded in the [product spec's Decisions](../feature-design/product-spec.md).
- **Why:** for no pause, "Drop the link for now, make it only editable through the site." For keeping the structure, the user chose it over Claude's recommendation to return to the outline; no reason stated.

### D-31 · process · One subfolder per phase in `feature-design/`
- **Decided by:** user, on Claude's recommendation · [P-061](prompts/prompts.md#p-061)
- **What:** `feature-design/product-spec.md` and `templates/` stay at the root. Each phase has its own subfolder for its roadmap and milestone specs, starting with `feature-design/local-demo/roadmap.md` and `feature-design/local-demo/milestones/`. The paths are updated in `CLAUDE.md` and its template, `/build`, the planner, both roadmap templates, `workflow.md`, `process-logs.md` and `phases.md`.
- **Why:** the spec describes the product across phases, while a roadmap and its milestones belong to one phase.

### D-32 · scope · The demo covers breaking news, market movements and natural disasters
- **Decided by:** user · [P-063](prompts/prompts.md#p-063), reversing the earthquake-only answer in D-29 (I-25)
- **What:** "important events" in the product spec means the brief's three kinds: breaking news, market movements and natural disasters. The product still decides alone what is important, with one bar per kind set from the data. User-facing wording waits for the data sources (I-24).
- **Why:** "a fuller picture about the data we can work with with less things to pivot on later."

### D-33 · scope · What each kind covers, and when two reports are one event
- **Decided by:** user, on the product designer's defaults · [P-064](prompts/prompts.md#p-064)
- **What:** each kind's coverage is decided with its bar, from what its source offers (merged into OQ-01). Until then everything a source reports is in scope. Each kind has one source, and an item in it, updates included, is one event. Merging one story across items is post-MVP (PM-15), and the admin view makes duplicates visible. Recorded in the [product spec's Decisions](../feature-design/product-spec.md).
- **Why:** both came up when the spec widened to three kinds (D-32). Duplicate news items are the main risk to signal over noise under "never twice".

### D-34 · scope · Local-demo roadmap: learn first, with throwaway scripts
- **Decided by:** user · [P-067](prompts/prompts.md#p-067), on Claude's draft; the override is I-26
- **What:**
  - M1 tries the data sources and M2 tries email and Slack delivery. Both are throwaway scripts that leave findings notes and samples.
  - M3 builds events in and the admin view, M4 the alert setup, and M5 delivery, which completes J-01.
  - The stack is chosen in M3's spec.
  - Recorded in the [roadmap's Decisions](../feature-design/local-demo/roadmap.md#decisions).
- **Why:** every open question in the approved product spec waits on real data.
