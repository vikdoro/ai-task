# Decisions · Local demo: M5

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-85 · business rule · An alert fires only for events that make the cut after it was set up, matched once
- **Decided by:** user · [P-193](prompts/prompts.md#p-193), as recommended
- **What:** an event fires if its `cleared_at` is at or after the alert's `created_at`, with no age cap. Channels are matched once at the cut and never reconsidered. See the [M5 spec](../../../feature-design/local-demo/milestones/05-alerts-delivered.md#decisions-from-the-interview) (Q1, Q2).

### D-86 · business rule · Delivery is at most once per channel
- **Decided by:** user · [P-193](prompts/prompts.md#p-193), as recommended
- **What:** the delivery is recorded as in progress before the send. After a crash it is never retried and shows `Failed: interrupted, outcome unknown`. See the [M5 spec](../../../feature-design/local-demo/milestones/05-alerts-delivered.md#decisions-from-the-interview) (Q3).

### D-87 · data model · Two new tables, `alerts_fired` and `deliveries`
- **Decided by:** user · [P-193](prompts/prompts.md#p-193), as recommended
- **What:** added through the idempotent schema file. `deliveries` is unique on (event, channel). Existing tables are unchanged, and no message text, address or webhook is stored. See the [M5 spec](../../../feature-design/local-demo/milestones/05-alerts-delivered.md#decisions-from-the-interview) (Q4).

### D-88 · business rule · What counts as delivered, pacing and no retry
- **Decided by:** user · [P-193](prompts/prompts.md#p-193), as recommended
- **What:** email counts as delivered when Resend accepts it (labelled `Delivered (accepted by Resend)`), Slack on 200 `ok`. Anything else is failed, with no retry. Sends go one per second per channel, and a 429 is failed. See the [M5 spec](../../../feature-design/local-demo/milestones/05-alerts-delivered.md#decisions-from-the-interview) (Q5, Q6).

### D-89 · scope · `DELIVERY_MODE` switch, fake by default
- **Decided by:** user · [P-193](prompts/prompts.md#p-193), as recommended
- **What:** set on the command line only. `fake` records without sending, and `live` sends for real. Agents never set `live`. See the [M5 spec](../../../feature-design/local-demo/milestones/05-alerts-delivered.md#decisions-from-the-interview) (Q7).

### D-90 · process · M5 is shown with the journey run only; the 60-minute live run stays deferred
- **Decided by:** user · [P-193](prompts/prompts.md#p-193). Claude recommended two runs, the journey run plus the deferred 60-minute live run (D-71). See I-50.
- **What:** samples, `DELIVERY_MODE=live`, a new `DB_PATH`, `POLLING=off`, set up the alert, then `poll:once`. The small `POLLING=off` change to the M3 polling plugin is allowed. See the [M5 spec](../../../feature-design/local-demo/milestones/05-alerts-delivered.md#decisions-from-the-interview) (Q8).

### D-91 · scope · M5 stays minimal
- **Decided by:** user · [P-193](prompts/prompts.md#p-193), as recommended
- **What:** no sent history or test-send button on the user screen, `/admin` stays read-only, no reset command and no new dependencies. See the [M5 spec](../../../feature-design/local-demo/milestones/05-alerts-delivered.md#decisions-from-the-interview) (Q9).

### D-92 · wording · Alert messages and admin wording approved as drafted
- **Decided by:** user · [P-193](prompts/prompts.md#p-193), as recommended
- **What:** the system time zone with UTC alongside, market moves with direction and size, news `Where:` only when given, the message drafts, and the `Alerts fired` admin section. See the [M5 spec](../../../feature-design/local-demo/milestones/05-alerts-delivered.md#decisions-from-the-interview) (Q10 to Q14).

### D-93 · scope · Two M3 tests edited in M5, as an exception to AC-23
- **Decided by:** user · [P-198](prompts/prompts.md#p-198), as recommended
- **What:** `tests/unit/poll-once.test.ts` and `tests/e2e/admin.test.ts` are edited narrowly, because AC-16's summary line and AC-18's second table make the old assertions impossible to keep. Raised by the reviewer as Finding 1. See the [M5 spec](../../../feature-design/local-demo/milestones/05-alerts-delivered.md#decisions-from-the-interview).

### D-94 · scope · README's stale "Nothing is sent yet." removed in M5
- **Decided by:** user · [P-198](prompts/prompts.md#p-198), as recommended (the alternative was to leave it, as the spec said)
- **What:** only that sentence goes. It is an exception to the spec's "existing text stays". Raised by the reviewer as Finding 4. See the [M5 spec](../../../feature-design/local-demo/milestones/05-alerts-delivered.md#decisions-from-the-interview).

### D-95 · scope · Merging same-headline news events is deferred to post-MVP
- **Decided by:** user · [P-200](prompts/prompts.md#p-200), as recommended (the alternatives were to fix it in M5, or record only)
- **What:** in the MVP each source event ID fires once per channel. The merge rule goes to the [product spec](../../../feature-design/product-spec.md)'s Later section, and the case is in `feature-design/local-demo/findings/delivery.md` (M5 journey run). See I-51.

### D-96 · process · `feature-design/` stays at the repo root
- **Decided by:** user · [P-206](prompts/prompts.md#p-206), as recommended. The user had proposed moving it into `submission-docs/`.
- **What:** design documents stay where agents may read them, and `submission-docs/` stays logs-only. A new [`submission-docs/README.md`](../../README.md) is the reader's entry point and links to them.
- **Why:** agents never read `submission-docs/`, and it is hidden from their searches (D-60), but every agent needs the specs.

### D-97 · process · The local demo is frozen and the MVP is a new phase with its own spec
- **Decided by:** user · [P-206](prompts/prompts.md#p-206), as recommended (the alternative was one living spec, revised to v8)
- **What:** product spec v7 moves to `feature-design/local-demo/product-spec.md`, marked frozen. A new `feature-design/product-spec.md` covers the shippable MVP, and `feature-design/mvp/` holds its roadmap and milestones. The `/build` skill, the planner, the roadmap template and `workflow.md` now point at `mvp/`.

### D-98 · process · The product-designer writes the MVP spec, at most about 1,200 words
- **Decided by:** user · [P-206](prompts/prompts.md#p-206), as recommended (the alternative was the main session drafting it with the user)
- **What:** it interviews the user from the brief, the frozen spec and the findings, and cites the findings instead of restating them.

### D-99 · tooling · Fixed read lists for agents and a cap on milestone spec length
- **Decided by:** user · [P-206](prompts/prompts.md#p-206), as recommended. A lighter model for the reviewer and explainer, and sending the executor's report to the reviewer up front, were offered and not chosen.
- **What:** a shared "Reading, to save tokens" rule in `CLAUDE.md` and a fixed read list in each agent file. `feature-design/local-demo/` is off limits except for sections a current doc cites. Milestone specs are capped at about 1,500 words (`TEMPLATE.md`, planner).
- **Why:** the user: "we are still using a lot of tokens and the subprocesses are slow".
