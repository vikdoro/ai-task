# Interventions · Local demo: M3

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

### I-40 · CORRECT · [P-146](prompts/prompts.md#p-146)
- **Claude did:** the M3 planner recommended Node's built-in `node:http` with server-built HTML and no framework (Q1), and Claude put it to the user with the other stack questions.
- **Caught by:** user, who declined the question to discuss it first.
- **Why wrong:** not stated as wrong. The user's words: "I'd like to discuss using Nuxt.js vs anything else. My main stack is Vue.js, less backend".
- **Changed:** M3's stack questions are on hold until the framework is settled. Nuxt is weighed against plain Node.

### I-41 · CORRECT · [P-149](prompts/prompts.md#p-149)
- **Claude did:** the M3 planner recommended one market event per instrument per trading day, stored and shown whether or not it clears the bar (Q11).
- **Caught by:** user.
- **Why wrong:** not stated. The user chose "Only when it clears the bar".
- **Changed:** a market row is stored only once the move clears its bar. See D-63.

### I-42 · CORRECT · [P-149](prompts/prompts.md#p-149)
- **Claude did:** the M3 planner recommended storing every GDACS event returned, including old ones still listed, with no `iscurrent` filter (Q13).
- **Caught by:** user.
- **Why wrong:** not stated. The user chose "Filter on iscurrent".
- **Changed:** GDACS events that the source marks as no longer current are dropped. See D-64.

### I-43 · CORRECT · [P-150](prompts/prompts.md#p-150)
- **Claude did:** the M3 planner found that I-41 and I-42 conflict with the product spec (FR-07, DEC-14, DEC-27). It recommended one market row per instrument-day, and storing every GDACS event with `iscurrent` recorded rather than filtered.
- **Caught by:** user, who kept both overrides.
- **Why wrong:** not stated. The user chose "Only cleared, revise the spec" and "Filter, revise the spec".
- **Changed:** the product designer revises the product spec before M3 is specced. See D-67.

### I-44 · CORRECT · [P-154](prompts/prompts.md#p-154)
- **Claude did:** wrote the user's P-150 override into product spec v6: market moves below the bar are not events and are not shown to the admin (DEC-29).
- **Caught by:** user, after weighing a tunable admin view ([P-153](prompts/prompts.md#p-153)).
- **Why wrong:** a bar can't be judged without the events below it: "Show everything (more) for the admin. With something to mark if it made the cut."
- **Changed:** DEC-29's filter is reversed and the admin sees every market instrument-day, marked cleared or not. See D-68.

### I-45 · CORRECT · [P-164](prompts/prompts.md#p-164)
- **Claude did:** the M3 executor waited for a scheduled poll to fire at the AC-11 intervals (10 min or more) to check that Nitro scheduled tasks work.
- **Caught by:** user, who stopped it ([P-163](prompts/prompts.md#p-163)).
- **Why wrong:** too slow. The user's words: "keep the scheduled polling time short, as we need to move faster. It is not supposed to use live data anyway."
- **Changed:** the executor checks scheduled tasks with a temporary short schedule on samples, then restores the AC-11 intervals. See D-70.
