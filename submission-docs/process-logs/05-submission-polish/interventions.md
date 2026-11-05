# Interventions · Submission polish

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

### I-63 · CORRECT · [P-233](prompts/prompts.md#p-233)
- **Claude did:** recommended fixing the `feature-design/` paths in every file, closed phase logs included, once the folder moves into `submission-docs/` ([P-232](prompts/prompts.md#p-232)).
- **Caught by:** user: "closed logs should not be updated"
- **Why wrong:** not stated.
- **Changed:** closed phase logs keep their paths as written, even where links break. Only live documents and the open phase's logs are updated. See D-131.
