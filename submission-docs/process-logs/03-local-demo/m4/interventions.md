# Interventions · Local demo: M4

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.


### I-46 · CORRECT · [P-179](prompts/prompts.md#p-179)
- **Claude did:** the planner recommended that the alert row hold only the channel flags, with the email address and webhook URL read from `.env` when needed.
- **Caught by:** user, in the M4 interview.
- **Why wrong:** not stated. The user picked "Store contact values".
- **Changed:** the row also stores both values, copied in at save. M3's rule that the database never holds them is relaxed to the `alert` table only. See D-73.

### I-47 · CORRECT · [P-179](prompts/prompts.md#p-179)
- **Claude did:** the planner recommended blocking a change to zero channels on an existing alert, and then proposed a special message for that state.
- **Caught by:** user, in the M4 interview.
- **Why wrong:** "An alert with all channels unticked should be a valid entry, so keep it. Make delete an explicit action." On the message: "UI should be self-explanatory. No extra messaging is required."
- **Changed:** zero channels saves, and the screen shows the boxes unticked with no extra message. See D-78.

### I-48 · CORRECT · [P-181](prompts/prompts.md#p-181)
- **Claude did:** the M4 spec (unapproved) read both contact values from `.env` and copied them into the alert row (D-73, D-77).
- **Caught by:** user, before approving the spec.
- **Why wrong:** "Even for this local demo we should move away from Slack webhook and email in the .env file." The email should be the one the user signed in with and is not editable. The Slack webhook should be "an editable field".
- **Changed:** nothing. In [P-182](prompts/prompts.md#p-182) the user rejected Claude's follow-up questions (revise the product spec to v7, an allowlist for the webhook, a user seam, a test-send button) and withdrew the change: "Fine to keep specs as they are with the Email and Slack sourced from .env." See D-83.

### I-49 · CORRECT · [P-188](prompts/prompts.md#p-188), [P-189](prompts/prompts.md#p-189)
- **Claude did:** M4's hand check, which passed on `127.0.0.1`. Opening `http://localhost:3000/` sent the user to `/hu/`, which returned 404 (C-84).
- **Caught by:** user, in the hand check.
- **Why wrong:** not an app defect. `curl` on both hosts returns 200 with no `Location` header, and nothing in the app redirects. The redirect stays after clearing service workers and site data, and goes away in incognito, so it is state held only in the user's normal Chrome profile. In [P-190](prompts/prompts.md#p-190), clearing Chrome's "Cached images and files" removed it: a cached redirect.
- **Changed:** nothing in the code. The demo is run on `127.0.0.1:3000`, as the spec's steps already say.
