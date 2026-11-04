# Decisions · Local demo: M4

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-72 · process · Process logs split into one folder per phase
- **Decided by:** user · [P-175](prompts/prompts.md#p-175), all three as Claude recommended
- **What:** each phase in `phases.md` gets a folder with its own `prompts/prompts.md`, `decisions.md`, `interventions.md` and `checks.md`. Local demo has one subfolder per milestone. New entries go straight into the open phase's folder, which the hook names every turn. `prompts/raw/prompts.jsonl` stays one file, and the hook renders it per phase. IDs run on across phases.
- **Why:** the user's words: "to avoid really long files and make the submission-docs more readable", and so the agents read nothing "that is behind us, to save on tokens".
- **Tier two:** entries were placed by the first prompt they cite. P-144 to P-161, the tech stack talk before `/build M3`, went to M3. P-174 and this split opened M4.
