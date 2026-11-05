# Decisions · Local demo: M3

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-62 · scope · M3 builds on Nuxt 4, with a framework-free core
- **Decided by:** user · [P-147](prompts/prompts.md#p-147), as Claude recommended. The M3 planner had proposed plain `node:http` with no dependencies (I-40).
- **What:** Nuxt 4 with TypeScript and Vitest. The source parsers, bar rules and storage are plain modules with no Nuxt imports. Nuxt only holds the pages, the API routes and the polling task.
- **Why:** "My main stack is Vue.js, less backend" ([P-146](prompts/prompts.md#p-146)). M4's alert screen is easier in Vue, and Nitro covers routes, tasks, SQLite through db0, and auth later.

### D-63 · scope · M3 stores a market move only once it clears its bar
- **Superseded by:** D-68.
- **Decided by:** user · [P-149](prompts/prompts.md#p-149); overrides Claude's recommendation of one row per instrument per trading day, cleared or not (I-41)
- **What:** the key stays symbol plus trading day, but no row exists until the move clears its bar. See the [M3 spec](../../../feature-design/local-demo/milestones/03-events-in-and-the-admin-view.md#decisions-from-the-interview).
- **Why:** not stated.

### D-64 · scope · M3 drops GDACS events no longer current
- **Superseded by:** D-68.
- **Decided by:** user · [P-149](prompts/prompts.md#p-149); overrides Claude's recommendation to store every listed event (I-42)
- **What:** only GDACS events with `iscurrent` true are stored. Judging the overall `alertlevel` and using only the alert-level feed call stay as recommended. See the [M3 spec](../../../feature-design/local-demo/milestones/03-events-in-and-the-admin-view.md#decisions-from-the-interview).
- **Why:** not stated.

### D-65 · scope · M3 stack and rules, on Claude's recommendations
- **Decided by:** user · [P-149](prompts/prompts.md#p-149), all as recommended
- **What:** SQLite through db0 with raw SQL and no migration tool; Vitest plus @nuxt/test-utils with no browser; one `pollSource` function behind Nitro scheduled tasks, plus `poll:once` run directly by Node; dependencies limited to nuxt, vue, db0, vitest, @nuxt/test-utils and typescript; `SOURCE_MODE` defaults to samples and live is set on the command line only; the admin view at localhost:3000/admin, refreshing every 60 s; polls every 10, 15 and 60 min; an Event Registry floor of 200 tokens; one retry only for GDACS and Twelve Data; clearing is permanent; all first-poll events are shown; sorted by first received; admin wording as proposed; no reset command; the spikes stay untouched. See the [M3 spec](../../../feature-design/local-demo/milestones/03-events-in-and-the-admin-view.md#decisions-from-the-interview).
- **Why:** no new server, no browser and a small dependency set for a local demo.

### D-66 · process · The user runs M3 live once; agents never do
- **Decided by:** user · [P-149](prompts/prompts.md#p-149), as recommended
- **What:** the executor and reviewer verify on samples only. At the end of M3 the user runs it once with `SOURCE_MODE=live` as the demo check. See the [M3 spec](../../../feature-design/local-demo/milestones/03-events-in-and-the-admin-view.md#decisions-from-the-interview).
- **Why:** keeps D-49 for agents, and still tests the real sources before M5.

### D-67 · scope · Product spec revised for the M3 market and GDACS rules
- **Decided by:** user · [P-150](prompts/prompts.md#p-150); overrides Claude's recommendations to keep the spec as it is (I-43)
- **What:** a market event becomes an instrument's trading day whose move cleared its bar, so the admin sees no below-bar market moves (a limit on DEC-14). Disasters cover only events GDACS marks current (`iscurrent`), which revises DEC-27 and FR-07's "each event received". The product designer makes the change, and the user approves it before the M3 spec is written.
- **Why:** not stated.

### D-68 · scope · The local-demo admin view shows every event, marked whether it made the cut
- **Decided by:** user · [P-154](prompts/prompts.md#p-154). Reverses D-63, D-64 and both parts of D-67 (I-44). Claude recommended the disaster rule and keeping FR-08 and FR-09.
- **What:** the admin view stays read-only. Markets: every instrument-day is shown, marked cleared or not. Disasters: every listed GDACS item is shown with whether it is current, and it makes the cut only if it is current and reaches the alert level. FR-08 and FR-09 stay as they are, but the admin never sees the user's email address, the webhook URL or the message content.
- **Why:** "Show everything (more) for the admin. With something to mark if it made the cut."

### D-69 · scope · After the local demo, the admin tunes the bars and sees daily delivery totals
- **Decided by:** user · [P-154](prompts/prompts.md#p-154), as Claude recommended in [P-153](prompts/prompts.md#p-153), except the delivery totals, which are the user's own
- **What:** post-MVP (PM-08). Each kind shows its own measure, with no common score. Each market instrument's threshold is edited on its own. A new bar applies only to events checked after the change. The admin sees one delivered count and one failed count per day.
- **Why:** the user's words in P-153: "the most useful and safe admin view".

### D-70 · process · M3's scheduled-task check uses a short temporary schedule
- **Decided by:** user · [P-164](prompts/prompts.md#p-164); Claude read "short" as the check only, not the demo's intervals
- **What:** the executor proves scheduled tasks fire with a schedule of about a minute, on samples only, then restores the AC-11 intervals (10, 15, 60 min) in `nuxt.config.ts`. The spec is unchanged.
- **Why:** "we need to move faster. It is not supposed to use live data anyway."

### D-71 · scope · M3's live run is poll:once plus a 2-minute look at /admin
- **Decided by:** user · [P-168](prompts/prompts.md#p-168), as Claude recommended, after the user proposed `poll:once` only
- **What:** the user runs `poll:once` live, then `npm start` live for about 2 minutes to see `/admin`. Both use `data/app.db`, and the startup poll skips fresh sources, so this makes no further live call. The 60-minute schedule run moves to M5's live run. See the [M3 spec](../../../feature-design/local-demo/milestones/03-events-in-and-the-admin-view.md#decisions-from-the-interview).
- **Why:** the user's words: "we're short of time". The scheduled tasks had already fired on samples (D-70).
