# Interventions

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

### I-01 · CORRECT · [P-009](prompts/prompts.md#p-009)
- **Claude did:** proposed in [P-007](prompts/prompts.md#p-007) that the `Stop` hook scan each turn for interrupts and rejected tool calls, and named the transcript markers without having checked them.
- **Caught by:** Claude, checking its own claim against real transcripts in `~/.claude/projects/` before building it.
- **Why wrong:** `Stop` does not record a reply for an interrupted turn ([P-004](prompts/prompts.md#p-004) shows the effect), so it would miss interrupts. A plain text search also matched a marker inside an earlier command's output, and the AskUserQuestion "clarify" button produces the same rejection text as a real rejection.
- **Changed:** the scan runs in `UserPromptSubmit` and covers the previous turn. It only matches a marker at the start of a user text block or tool result, and it skips AskUserQuestion.

### I-02 · CORRECT · [P-010](prompts/prompts.md#p-010)
- **Claude did:** wrote a CLAUDE.md rule capping **Checks for you** at three items.
- **Caught by:** user, reading the [P-009](prompts/prompts.md#p-009) reply.
- **Why wrong:** "don't drop important ones just because there are more than three."
- **Changed:** no cap. The checks are numbered so the user can answer "Check 1, 2, 3 done" or report findings by number.

### I-03 · CORRECT · [P-011](prompts/prompts.md#p-011)
- **Claude did:** the [P-010](prompts/prompts.md#p-010) reply had two numbered lists, the open checks from P-009 and the new **Checks for you**, so "check 1, 2" could mean either.
- **Caught by:** Claude, while logging the user's answer. Claude took it to mean the **Checks for you** list, and the user confirmed in [P-012](prompts/prompts.md#p-012).
- **Changed:** `CLAUDE.md` rule: checks still open from earlier replies go into the one **Checks for you** list, so the numbers never collide.

### I-04 · CORRECT · [P-012](prompts/prompts.md#p-012)
- **Claude did:** logged checks that passed as `CHECK` entries in this file. Its last list of checks also included a decision ("add P-003 as D-04?").
- **Caught by:** user: "When I OK a check, it should not be logged as an 'intervention'."
- **Changed:** checks have their own log, [`checks.md`](checks.md). A finding gets one row there linking to an entry here, which holds the details. Choices the user has to make are asked outside the checks list.

### I-05 · CORRECT · [P-014](prompts/prompts.md#p-014)
- **Claude did:** recommended deleting `package.json`, since the tech stack was still open.
- **Caught by:** user, who kept it and set up Node tooling instead.
- **Why wrong:** the runtime was "fixed for consistency in runtime environment" (given in [P-015](prompts/prompts.md#p-015)).
- **Changed:** Node is the runtime; see D-05.

### I-06 · CORRECT · [P-015](prompts/prompts.md#p-015)
- **Claude did:** wrote a `.gitignore` that left the assessment material (now `original-brief/`) to be committed.
- **Caught by:** user, in check C-09.
- **Why wrong:** not stated beyond "add original-brief folder to gitignore".
- **Changed:** `original-brief/` added to `.gitignore`. The `/brief` skill read `brief/`, which the user had renamed, so Claude updated that path in `.claude/skills/brief/SKILL.md` to match.

### I-07 · CORRECT · [P-016](prompts/prompts.md#p-016)
- **Claude did:** as asked in [P-015](prompts/prompts.md#p-015), ignored the whole `original-brief/` folder, which also kept the user's first notes out of the repo. Claude raised this as check C-11.
- **Caught by:** user, answering C-11.
- **Why wrong:** Claude's reason in C-11, which the user agreed with ("You're right"): the notes are part of the process record.
- **Changed:** `first-notes.md` (edited by the user) moved to `submission-docs/`. The PDF moved to the repo root as `original-brief.pdf`, and `.gitignore` names only that file. The paths in the `/brief` skill were updated to match.

### I-08 · CORRECT · [P-024](prompts/prompts.md#p-024)
- **Claude did:** recommended adding a "Process logs" section to `workflow.md` (in [P-020](prompts/prompts.md#p-020), repeated in P-022 and P-023).
- **Caught by:** user.
- **Why wrong:** "to keep them separate from the agentic workflow description" (given in [P-025](prompts/prompts.md#p-025)).
- **Changed:** the logs are described in their own file, [`process-logs.md`](process-logs.md). See D-08.
