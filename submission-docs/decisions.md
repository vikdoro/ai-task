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
