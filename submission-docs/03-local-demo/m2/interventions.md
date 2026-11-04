# Interventions · Local demo: M2

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

### I-35 · CORRECT · [P-109](prompts/prompts.md#p-109)
- **Claude did:** the M2 planner recommended deliberately causing safe, free failures on each channel (wrong key, bad recipient, bad webhook URL, timeout) behind a `--fail` flag.
- **Caught by:** user.
- **Why wrong:** not stated: "Go for the happy path."
- **Changed:** no deliberate failures. Failure cases in the M2 findings come from the services' docs and from any that happen naturally. See D-53.

### I-36 · CORRECT · [P-109](prompts/prompts.md#p-109)
- **Claude did:** the M2 planner recommended letting the executor send live test messages, up to 10 per channel.
- **Caught by:** user.
- **Why wrong:** not stated. The user chose "No, I run them".
- **Changed:** the executor verifies offline only; the user runs the live sends and pastes the output. See D-54.

### I-37 · CORRECT · [P-118](prompts/prompts.md#p-118)
- **Claude did:** recommended switching M2's Slack destination from a Workflow Builder webhook to an incoming webhook, keeping "delivered" as HTTP 200 with body `ok` (D-55).
- **Caught by:** user.
- **Why wrong:** not stated: "Workflow webhook is fine for MVP."
- **Changed:** M2 posts through a Slack workflow webhook with a `text` variable; "delivered" also accepts a JSON `{"ok":true}` body. See D-57.

### I-38 · CORRECT · [P-129](prompts/prompts.md#p-129)
- **Claude did:** started the M2 explainer walkthrough automatically after the reviewer's PASS, as `/build` stage 4 required.
- **Caught by:** user, who also stopped the running explainer.
- **Why wrong:** not stated: "don't call explainer automatically, keep that optional".
- **Changed:** `/build` offers the walkthrough after a PASS and runs it only on request. See D-59.

### I-39 · CORRECT · [P-142](prompts/prompts.md#p-142)
- **Claude did:** added `.ignore` (D-60) to keep `submission-docs/` and `spikes/samples/` out of agent searches, without covering shell searches; listed it as check C-64.
- **Caught by:** user, through C-64; [P-139](prompts/prompts.md#p-139) showed shell `grep` ignores `.ignore`.
- **Why wrong:** agents with Bash could still `grep -r` or `find` into both folders.
- **Changed:** in another session, the agents with Bash and the main session were told to exclude both folders from shell searches. See D-61.

