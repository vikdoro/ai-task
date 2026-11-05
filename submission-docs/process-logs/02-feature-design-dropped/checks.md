# Checks · Feature design (dropped)

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-27 | Role priorities and review checks in the three agent files match what the user meant | [P-037](prompts/prompts.md#p-037) | [P-038](prompts/prompts.md#p-038) | OK |
| C-28 | The shared agent rules, including FAIL needing a blocker, set the bar the user wants | [P-037](prompts/prompts.md#p-037) | [P-038](prompts/prompts.md#p-038) | OK |
| C-29 | The `/design` stage loop does what was agreed, including the stop after a second round | [P-039](prompts/prompts.md#p-039) | [P-040](prompts/prompts.md#p-040) | OK |
| C-30 | Logging every reviewer FAIL in `/design` as a `CORRECT` entry is the record the user wants | [P-039](prompts/prompts.md#p-039) | [P-040](prompts/prompts.md#p-040) | OK |
| C-31 | `CLAUDE.md` describes the new design workflow correctly | [P-039](prompts/prompts.md#p-039) | [P-040](prompts/prompts.md#p-040) | OK |
| C-32 | `feature-design/` holds only `templates/` with the two templates | [P-040](prompts/prompts.md#p-040) | [P-041](prompts/prompts.md#p-041) | OK |
| C-33 | `CLAUDE.md` describes the single folder and no longer mentions `/brief` | [P-040](prompts/prompts.md#p-040) | [P-041](prompts/prompts.md#p-041) | OK |
| C-34 | The post-MVP lines in `/design` and `/build` say what the user meant | [P-047](prompts/prompts.md#p-047) | [P-050](prompts/prompts.md#p-050) | OK |
| C-35 | Resend and Postmark send only to the account address without a verified domain; Gmail SMTP with an app password reaches anyone, at a few hundred a day | [P-054](prompts/prompts.md#p-054) | [P-055](prompts/prompts.md#p-055) | OK |
