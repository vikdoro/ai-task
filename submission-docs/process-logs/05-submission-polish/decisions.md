# Decisions · Submission polish

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-131 · process · Design and process logs under `submission-docs/`; agents barred only from `process-logs/`
- **Decided by:** user · [P-232](prompts/prompts.md#p-232), [P-233](prompts/prompts.md#p-233); the folder name is Claude's recommendation, closed logs left as written overrides Claude (I-63)
- **What:** `feature-design/` moves to `submission-docs/feature-design/`. The phase folders, `phases.md`, `process-logs.md`, `prompts/` and the main session's `CLAUDE.md` move to `submission-docs/process-logs/`. `first-notes.md`, `README.md`, `scratchpad.md` and `workflow.md` stay in `submission-docs/`. Agents may now read `submission-docs/`, except `process-logs/`, which `.ignore` and the agents' reading rules still bar. The prompt hook writes to the new path. Closed phase logs are not edited.

### D-132 · process · Drop `submission-docs/README.md`; the root README is the entry point
- **Decided by:** user · [P-241](prompts/prompts.md#p-241)
- **What:** `submission-docs/README.md` is deleted. The root `README.md`, edited by the user, links to the reflections, what-was-built-and-why, the workflow and `process-logs/phases.md` directly.
- **Why:** "I think we can drop the submission-docs/README.md." Its links now live in the root README.

### D-133 · process · `scratchpad.md` and `first-notes.md` move to `process-logs/`
- **Decided by:** user · [P-243](prompts/prompts.md#p-243)
- **What:** Both files move from `submission-docs/` to `submission-docs/process-logs/`, so agents no longer read them. This changes where D-131 left them.
- **Why:** not stated.

### D-134 · process · npm `overrides` pin patched `glob` and `minimatch`; `deepmerge` advisory left open
- **Decided by:** claude · [P-245](prompts/prompts.md#p-245)
- **What:** `package.json` overrides force `glob@^14.0.3` and `minimatch@^11.0.4` (both a major above what `@vue/test-utils` and `nitropack` ask for). `npm audit` drops from 15 (9 moderate) to 7 low. The `deepmerge` advisory has no patched release and reaches us only through Nitro's build-time Rollup plugin, so it stays.
- **Why:** `npm audit fix --force` would downgrade `nuxt` to 4.1.3 and `@vue/test-utils` to 2.4.11. With the overrides, tests (279) and `nuxt build` pass.

### D-135 · process · Add `plan-of-attack.md` and `highlights.md` to the submission
- **Decided by:** user · [P-248](prompts/prompts.md#p-248), on Claude's recommendation in [P-247](prompts/prompts.md#p-247)
- **What:** `submission-docs/plan-of-attack.md` lays out the deliverables, their order and how the plan changed, written after the fact. `submission-docs/highlights.md` picks the strongest interventions and maps each open point in the brief to where it was settled. Both are linked from the root `README.md`, and Claude drafted both for the user to edit.
- **Why:** the brief grades the plan of attack and the catches. Neither had one place a reader could find it.
