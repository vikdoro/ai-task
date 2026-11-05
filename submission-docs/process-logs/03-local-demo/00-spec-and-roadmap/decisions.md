# Decisions · Local demo: spec and roadmap

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-27 · process · Drop `/design`; start with a local-demo phase
- **Decided by:** user · [P-057](prompts/prompts.md#p-057); Claude reviewed the plan in the reply
- **What:** the `/design` skill is deleted (see I-19). The new plan:
  - The `product-designer` interviews the user from `original-brief.md` and writes a mostly non-technical product spec in `feature-design/`.
  - A roadmap then leads to a local demo: one user journey that tries real external data sources and email and Slack delivery, with no public deployment, so security stays in the user's control.
  - D-13 to D-16, D-18 to D-21 and D-23 to D-26 no longer apply. D-20 (post-MVP answers) stays in `/build` and the `product-designer`.
- **Why:** "the resulting docs are too complicated." The aim is "a better understanding of the data and external services we may use to guide us in our later plans".

### D-28 · process · Local-demo workflow: interview spec, joint roadmap, references updated
- **Decided by:** user, on Claude's suggestions 1, 4 and 5 · proposed in [P-057](prompts/prompts.md#p-057), approved in [P-058](prompts/prompts.md#p-058)
- **What:**
  - The `product-designer` interviews the user and writes `feature-design/product-spec.md` to a fixed outline of about two pages, with no technologies and without reading `submission-docs/`.
  - The user and Claude draft `feature-design/roadmap.md` together, with no role reviews.
  - `CLAUDE.md`, its `/setup` template, `workflow.md`, `process-logs.md`, `/build`, the planner, `/setup` and both roadmap templates no longer mention `/design`.
  - The `product-designer` agent is rewritten as an interviewer. `cto` and `eng-lead` are kept but unused.
- **Why:** keep the spec small enough that the dropped complexity (I-19) doesn't return. "1, 4 and 5 approved, go ahead".

### D-29 · scope · Product spec interview: ten answers
- **Decided by:** user · [P-059](prompts/prompts.md#p-059), on the product designer's defaults for seven; overrides in I-21
- **What:**
  - One professional user. The demo covers the full loop: an alert is set up, a real earthquake happens, and it reaches the user by email and Slack while the admin watches.
  - The product alone decides what is important, using one bar set from the data.
  - The user picks only the channels.
  - Alerts are instant with no cap, and no event is sent twice.
  - The admin only watches.
  - The demo has a pre-set user and admin, with no login.
  - Each message carries the full content, including a pause link.
  - Recorded in the [product spec's Decisions](../../../feature-design/product-spec.md).
- **Why:** per question, in the spec.

### D-30 · scope · Product spec: one alert, no pause, delete allowed, no retries
- **Decided by:** user · [P-060](prompts/prompts.md#p-060); overrides in I-22
- **What:**
  - One alert per user.
  - No pause, in the message or on the site; the alert is changed on the site by edit or delete.
  - The user can delete their alert.
  - A failed delivery is not retried; the admin sees each failure and its reason.
  - The spec keeps its draft structure (requirement IDs, glossary, eleven post-MVP items) instead of the two-page outline agreed in D-28.
  - Recorded in the [product spec's Decisions](../../../feature-design/product-spec.md).
- **Why:** for no pause, "Drop the link for now, make it only editable through the site." For keeping the structure, the user chose it over Claude's recommendation to return to the outline; no reason stated.

### D-31 · process · One subfolder per phase in `feature-design/`
- **Decided by:** user, on Claude's recommendation · [P-061](prompts/prompts.md#p-061)
- **What:** `feature-design/product-spec.md` and `templates/` stay at the root. Each phase has its own subfolder for its roadmap and milestone specs, starting with `feature-design/local-demo/roadmap.md` and `feature-design/local-demo/milestones/`. The paths are updated in `CLAUDE.md` and its template, `/build`, the planner, both roadmap templates, `workflow.md`, `process-logs.md` and `phases.md`.
- **Why:** the spec describes the product across phases, while a roadmap and its milestones belong to one phase.

### D-32 · scope · The demo covers breaking news, market movements and natural disasters
- **Decided by:** user · [P-063](prompts/prompts.md#p-063), reversing the earthquake-only answer in D-29 (I-25)
- **What:** "important events" in the product spec means the brief's three kinds: breaking news, market movements and natural disasters. The product still decides alone what is important, with one bar per kind set from the data. User-facing wording waits for the data sources (I-24).
- **Why:** "a fuller picture about the data we can work with with less things to pivot on later."

### D-33 · scope · What each kind covers, and when two reports are one event
- **Decided by:** user, on the product designer's defaults · [P-064](prompts/prompts.md#p-064)
- **What:** each kind's coverage is decided with its bar, from what its source offers (merged into OQ-01). Until then everything a source reports is in scope. Each kind has one source, and an item in it, updates included, is one event. Merging one story across items is post-MVP (PM-15), and the admin view makes duplicates visible. Recorded in the [product spec's Decisions](../../../feature-design/product-spec.md).
- **Why:** both came up when the spec widened to three kinds (D-32). Duplicate news items are the main risk to signal over noise under "never twice".

### D-34 · scope · Local-demo roadmap: learn first, with throwaway scripts
- **Decided by:** user · [P-067](prompts/prompts.md#p-067), on Claude's draft; the override is I-26
- **What:**
  - M1 tries the data sources and M2 tries email and Slack delivery. Both are throwaway scripts that leave findings notes and samples.
  - M3 builds events in and the admin view, M4 the alert setup, and M5 delivery, which completes J-01.
  - The stack is chosen in M3's spec.
  - Recorded in the [roadmap's Decisions](../../../feature-design/local-demo/roadmap.md#decisions).
- **Why:** every open question in the approved product spec waits on real data.

