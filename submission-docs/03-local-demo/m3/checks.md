# Checks · Local demo: M3

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-65 | Nitro scheduled tasks are experimental (`nitro.experimental.tasks`) and run under `nuxt dev` and the `node-server` preset | [P-146](prompts/prompts.md#p-146) | [P-147](prompts/prompts.md#p-147) | OK; user added that serverless presets have no continuous event loop, so internal cron needs a platform trigger there |
| C-66 | db0 has a connector for Node's built-in `node:sqlite` | [P-146](prompts/prompts.md#p-146) | [P-147](prompts/prompts.md#p-147) | OK |
| C-67 | D-63 to D-67 and I-41 to I-43 record the user's M3 interview answers and overrides fairly | [P-149](prompts/prompts.md#p-149), extended in [P-150](prompts/prompts.md#p-150) | [P-151](prompts/prompts.md#p-151) | OK |
| C-68 | D-68, D-69 and I-44 record the user's P-154 answers fairly, including the "no addresses or content" rule | [P-154](prompts/prompts.md#p-154) | [P-156](prompts/prompts.md#p-156) | OK |
| C-69 | FR-07 to FR-09, DEC-29 to DEC-33 and PM-16 in the v6 product spec say what the user meant | [P-155](prompts/prompts.md#p-155) | [P-156](prompts/prompts.md#p-156) | OK |
| C-70 | The M3 spec's "Decisions from the interview" match the user's answers, including the v6 market and disaster rules | [P-158](prompts/prompts.md#p-158) | [P-161](prompts/prompts.md#p-161) | OK |
| C-71 | The M3 spec's admin view wording and columns are as approved, plus the Current column | [P-158](prompts/prompts.md#p-158) | [P-161](prompts/prompts.md#p-161) | OK |
| C-72 | Full M3 diff, including that `product-spec.md` holds only the approved v6 changes | [P-168](prompts/prompts.md#p-168) | [P-172](prompts/prompts.md#p-172) | OK |
| C-73 | `lib/poll.ts:73`: "made the cut" in `poll:once` output counts that poll's items over the bar, not newly cleared events (tier-two choice) | [P-168](prompts/prompts.md#p-168) | [P-172](prompts/prompts.md#p-172) | OK |
| C-74 | The M3 spec's shortened "Steps the user runs" say what the user meant (D-71) | [P-168](prompts/prompts.md#p-168) | [P-172](prompts/prompts.md#p-172) | OK |
| C-75 | The "M3 live run" section of `findings/data-sources.md` records the live run correctly | [P-171](prompts/prompts.md#p-171) | [P-172](prompts/prompts.md#p-172) | OK |
