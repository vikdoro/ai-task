# Checks · Local demo: M2

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-54 | Resend's test sender `onboarding@resend.dev` delivers only to the Resend account's signup address | [P-110](prompts/prompts.md#p-110) | [P-111](prompts/prompts.md#p-111) | OK |
| C-55 | Resend's free tier is about 100 emails a day and 3,000 a month | [P-110](prompts/prompts.md#p-110) | [P-111](prompts/prompts.md#p-111) | OK |
| C-56 | The M2 spec's "Decisions from the interview" matches the P-109 answers | [P-110](prompts/prompts.md#p-110) | [P-111](prompts/prompts.md#p-111) | OK |
| C-57 | Slack Workflow Builder webhooks are "Available on paid plans" (`delivery.md:107`), and whether that affects D-57 | [P-126](prompts/prompts.md#p-126) | [P-128](prompts/prompts.md#p-128) | OK: keep the workflow webhook; "It seems to run fine in a developer sandbox workspace." |
| C-58 | `feature-design/local-demo/findings/delivery.md` read in full, with Live runs and the M5 notes | [P-126](prompts/prompts.md#p-126) | [P-128](prompts/prompts.md#p-128) | OK |
| C-59 | `.claude/skills/build/SKILL.md` Stage 2–3 step 4 and Stage 4 read as an optional walkthrough the way the user wants | [P-130](prompts/prompts.md#p-130) | [P-131](prompts/prompts.md#p-131) | OK |
| C-60 | The new search paragraph under Reading in `.claude/agents/reviewer.md` (same in `executor.md`, `explainer.md`) | [P-140](prompts/prompts.md#p-140) | [P-141](prompts/prompts.md#p-141) | OK |
| C-61 | `--exclude-dir=samples` skipping every folder named `samples` is fine, with no other `samples` folder planned | [P-140](prompts/prompts.md#p-140) | [P-141](prompts/prompts.md#p-141) | OK |
| C-62 | D-61 in `submission-docs/decisions.md` | [P-140](prompts/prompts.md#p-140) | [P-141](prompts/prompts.md#p-141) | OK |
| C-63 | `submission-docs/CLAUDE.md` does not load in a session that hasn't opened that folder (`/memory`) | [P-135](prompts/prompts.md#p-135) | [P-142](prompts/prompts.md#p-142) | OK |
| C-64 | Claude's Grep and Glob respect `.ignore`, so searches skip `submission-docs/` and `spikes/samples/` | [P-135](prompts/prompts.md#p-135) | [P-142](prompts/prompts.md#p-142) | Finding: "another process now fixed that" → I-39 |
