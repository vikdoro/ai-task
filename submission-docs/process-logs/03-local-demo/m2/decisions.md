# Decisions · Local demo: M2

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-53 · scope · M2 tries the happy path only
- **Decided by:** user · [P-109](prompts/prompts.md#p-109); overrides Claude's recommendation to cause safe failures behind a `--fail` flag (I-35)
- **What:** no failure is caused on purpose. The M2 findings take failure cases and limits from Resend's and Slack's docs, plus any that happen naturally. See the [M2 spec](../../../feature-design/local-demo/milestones/02-try-email-and-slack-delivery.md#decisions-from-the-interview).
- **Why:** not stated: "Go for the happy path."

### D-54 · process · Agents make no live sends in M2; the user runs them
- **Decided by:** user · [P-109](prompts/prompts.md#p-109); overrides Claude's recommendation of up to 10 agent sends per channel (I-36)
- **What:** the executor and reviewer verify offline with a dry run. The user runs the live sends and pastes the output. See the [M2 spec](../../../feature-design/local-demo/milestones/02-try-email-and-slack-delivery.md#decisions-from-the-interview).
- **Why:** not stated.

### D-55 · scope · M2 delivers through Resend and a Slack incoming webhook
- **Decided by:** user · [P-109](prompts/prompts.md#p-109), all on Claude's recommendation
- **What:** Resend only, from its test sender to the user's own address; a demo-only Slack channel; email "delivered" means accepted plus one status lookup; the planner's test wording; keys `RESEND_API_KEY`, `DEMO_USER_EMAIL`, `SLACK_WEBHOOK_URL` and no dependencies; a 10 s timeout with no retry. Details in the [M2 spec](../../../feature-design/local-demo/milestones/02-try-email-and-slack-delivery.md#decisions-from-the-interview).
- **Why:** no domain or package needed for a local demo.

### D-56 · process · One-off deletion of four fake M2 sample folders
- **Decided by:** user · [P-116](prompts/prompts.md#p-116)
- **What:** Claude deleted `spikes/samples/delivery-2026-11-04T19-59-{27,37,47,58}*`, which held the executor's fake-`fetch` responses (id `abc-123`), so they aren't mistaken for live runs. The rule that no agent deletes under `spikes/samples/` otherwise stands.
- **Why:** "for the sample folders, can you delete them?"

### D-57 · scope · Slack delivery goes through a Workflow Builder webhook for the MVP
- **Decided by:** user · [P-118](prompts/prompts.md#p-118); overrides Claude's recommendation of an incoming webhook (I-37)
- **What:** `SLACK_WEBHOOK_URL` is a workflow webhook (`hooks.slack.com/triggers/…`) whose workflow takes a `text` variable and posts it. Slack "delivered" means HTTP 200 with body `ok` or JSON `{"ok":true}`. See the [M2 spec](../../../feature-design/local-demo/milestones/02-try-email-and-slack-delivery.md#decisions-from-the-interview).
- **Why:** not stated. The first live send showed up in the channel.

### D-58 · scope · M2 drops the email status lookup
- **Decided by:** user · [P-121](prompts/prompts.md#p-121); replaces the "accepted plus one status lookup" part of D-55
- **What:** email "delivered" means Resend accepted the send (2xx); there is no follow-up lookup and no 10-second wait. A "Sending access" Resend key is enough. Delivery is confirmed by hand in the inbox. See the [M2 spec](../../../feature-design/local-demo/milestones/02-try-email-and-slack-delivery.md#decisions-from-the-interview).
- **Why:** "Fine to descope, so sender Resend key is fine, no need for lookup."

### D-59 · process · The explainer walkthrough is optional in /build
- **Decided by:** user · [P-129](prompts/prompts.md#p-129)
- **What:** after a PASS, `/build` ends the turn and offers the stage 4 walkthrough in one line; it runs only when the user asks. Changed in `.claude/skills/build/SKILL.md`, `CLAUDE.md` (way of working, approval gates) and the reviewer's description. Tier-one answers are now logged in stage 1.
- **Why:** not stated.

### D-60 · process · Cut what subagents load and search
- **Decided by:** user · [P-135](prompts/prompts.md#p-135), choosing items 1 to 4 of Claude's suggestions in [P-134](prompts/prompts.md#p-134)
- **What:** the process-log and checks rules move from the root `CLAUDE.md` to [`submission-docs/CLAUDE.md`](../../CLAUDE.md), which the main session reads and subagents don't. A new `.ignore` keeps `submission-docs/` and `spikes/samples/` out of Grep and Glob. The root `CLAUDE.md` says D-numbers don't need to be looked up. The five agents in use get a Reading section: never read `submission-docs/`, and look at samples only in part.
- **Why:** subagents use a lot of tokens. Each one loaded about 4 KB of rules only the main session follows, and broad searches could reach the 800 KB prompt log.

### D-61 · process · Shell searches exclude the ignored folders too
- **Decided by:** user, wording by Claude · [P-140](prompts/prompts.md#p-140), after [P-139](prompts/prompts.md#p-139) showed shell `grep` ignores `.ignore`
- **What:** the executor, explainer and reviewer, which have Bash, are told to search with Grep and Glob, or to exclude `submission-docs/` and `spikes/samples/` from shell `grep -r` and `find`. The root `CLAUDE.md` says the same for the main session, which opens the logs by path only. The planner and product-designer have no Bash, so `.ignore` already covers them. Claude chose an instruction over a blocking hook.
- **Why:** "just reduce token cost. And there's no need to read in submission-docs."

