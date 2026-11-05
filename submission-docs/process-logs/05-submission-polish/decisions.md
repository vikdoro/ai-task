# Decisions · Submission polish

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-131 · process · Design and process logs under `submission-docs/`; agents barred only from `process-logs/`
- **Decided by:** user · [P-232](prompts/prompts.md#p-232), [P-233](prompts/prompts.md#p-233); the folder name is Claude's recommendation, closed logs left as written overrides Claude (I-63)
- **What:** `feature-design/` moves to `submission-docs/feature-design/`. The phase folders, `phases.md`, `process-logs.md`, `prompts/` and the main session's `CLAUDE.md` move to `submission-docs/process-logs/`. `first-notes.md`, `README.md`, `scratchpad.md` and `workflow.md` stay in `submission-docs/`. Agents may now read `submission-docs/`, except `process-logs/`, which `.ignore` and the agents' reading rules still bar. The prompt hook writes to the new path. Closed phase logs are not edited.
