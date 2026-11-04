# Decisions

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user`, `claude`, or `default-unreviewed` (a recommended default taken without confirmation).

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
