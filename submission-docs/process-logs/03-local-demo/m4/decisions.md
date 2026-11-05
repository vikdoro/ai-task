# Decisions · Local demo: M4

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-72 · process · Process logs split into one folder per phase
- **Decided by:** user · [P-175](prompts/prompts.md#p-175), all three as Claude recommended
- **What:** each phase in `phases.md` gets a folder with its own `prompts/prompts.md`, `decisions.md`, `interventions.md` and `checks.md`. Local demo has one subfolder per milestone. New entries go straight into the open phase's folder, which the hook names every turn. `prompts/raw/prompts.jsonl` stays one file, and the hook renders it per phase. IDs run on across phases.
- **Why:** the user's words: "to avoid really long files and make the submission-docs more readable", and so the agents read nothing "that is behind us, to save on tokens".
- **Tier two:** entries were placed by the first prompt they cite. P-144 to P-161, the tech stack talk before `/build M3`, went to M3. P-174 and this split opened M4.

### D-73 · data · The alert is one row that also stores the contact values
- **Decided by:** user · [P-179](prompts/prompts.md#p-179), **override**: Claude recommended flags only, with the email address and webhook read from `.env` when needed. See I-46.
- **What:** one `alert` row with email and Slack flags, the email address and webhook URL copied in from `.env` at save, `created_at` and `updated_at`, and no history. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview) (Q1).

### D-74 · data · Deleting the alert is a hard delete
- **Decided by:** user · [P-179](prompts/prompts.md#p-179), as recommended
- **What:** the row is removed, and setting up again starts a new row. Event rows are untouched. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview) (Q2).

### D-75 · data · The alert lives in the database of the mode in use
- **Decided by:** user · [P-179](prompts/prompts.md#p-179), as recommended
- **What:** the alert goes in `samples.db` or `app.db`, depending on the mode, and has to be set up again for the live run. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview) (Q3).

### D-76 · wording · The Slack destination is shown as fixed text
- **Decided by:** user · [P-179](prompts/prompts.md#p-179), as recommended
- **What:** the screen shows `Slack (demo channel)`. The webhook URL is never shown. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview) (Q4).

### D-77 · rule · A channel whose key is missing is disabled
- **Decided by:** user · [P-179](prompts/prompts.md#p-179), as recommended
- **What:** the option shows `not set up` and can't be ticked, and the alert can't be saved with neither key set. An existing alert keeps the values it stored. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview) (Q5).

### D-78 · rule · An alert with no channels is valid; deleting is explicit
- **Decided by:** user · [P-179](prompts/prompts.md#p-179), **override**: Claude recommended blocking a change to zero channels. See I-47.
- **What:** setup still needs one channel (FR-01). Changing to zero channels saves, the screen shows both boxes unticked with no extra message, and deleting goes only through the delete button. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview) (Q6).

### D-79 · wording · M4's in-app wording approved as drafted
- **Decided by:** user · [P-179](prompts/prompts.md#p-179), as recommended. The planner then changed it to fit D-78 (`Your alert is set up.`).
- **What:** the title, states, errors and the on-page delete confirmation. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview) (Q7).

### D-80 · dependency · Component tests with @vue/test-utils and happy-dom
- **Decided by:** user · [P-179](prompts/prompts.md#p-179), as recommended
- **What:** two dev dependencies for the client-side behaviour, and no Playwright. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview) (Q8).

### D-81 · scope · M4 is the user screen and its API only
- **Decided by:** user · [P-179](prompts/prompts.md#p-179), as recommended
- **What:** no sending or test-message button, no admin change, and no link between `/` and `/admin`. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview) (Q9).

### D-82 · process · M4 ends with a short hand check in the browser
- **Decided by:** user · [P-179](prompts/prompts.md#p-179), as recommended
- **What:** set up, change and delete the alert in samples mode. Nothing is pasted back. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview) (Q10).

### D-83 · scope · The demo keeps the email address and Slack webhook in `.env`
- **Decided by:** user · [P-182](prompts/prompts.md#p-182), withdrawing their own P-181 proposal before Claude's questions on it were answered
- **What:** the M4 spec and the product spec stay as written: both values come from `.env` and are copied into the alert row (D-73). Magic-link sign-in, a read-only email from that sign-in and a webhook field the user edits were discussed in [P-181](prompts/prompts.md#p-181) but are not recorded in the spec's Later section. See I-48.
- **Why:** not stated.

### D-84 · tooling · `.nuxtrc` is gitignored
- **Decided by:** user · [P-184](prompts/prompts.md#p-184), as recommended (the alternative was to commit it, as Nuxt usually does)
- **What:** every `npm test` writes `.nuxtrc` (`setups.@nuxt/test-utils`), because the component tests load @nuxt/test-utils (D-80). `.gitignore` is added to the M4 spec's allowed files and gets `.nuxtrc` next to `.nuxt/`. See the [M4 spec](../../../feature-design/local-demo/milestones/04-set-up-the-alert.md#decisions-from-the-interview).
- **Why:** the test run generates the file, and it holds nothing specific to this project.
