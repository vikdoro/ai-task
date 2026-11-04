# Checks

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-01 | The checks rule in `CLAUDE.md` matches how the user answers checks | [P-010](prompts/prompts.md#p-010) | [P-011](prompts/prompts.md#p-011) | OK |
| C-02 | The quote of the user in I-02's "Why wrong" line is fair | [P-010](prompts/prompts.md#p-010) | [P-011](prompts/prompts.md#p-011) | OK |
| C-03 | I-01 and D-02 are worded the way the user would put them | [P-009](prompts/prompts.md#p-009) | [P-012](prompts/prompts.md#p-012) | OK |
| C-04 | Claude read "check 1, 2" in P-011 as the **Checks for you** list | [P-011](prompts/prompts.md#p-011) | [P-012](prompts/prompts.md#p-012) | OK |
| C-05 | `checks.md` table reads well rendered as Markdown | [P-012](prompts/prompts.md#p-012) | [P-013](prompts/prompts.md#p-013) | OK |
| C-06 | D-04 splits the user's quoted reason from Claude's technical reason correctly | [P-012](prompts/prompts.md#p-012) | [P-013](prompts/prompts.md#p-013) | OK |
| C-07 | `CLAUDE.md` process-log rules no longer route checks to `interventions.md` | [P-012](prompts/prompts.md#p-012) | [P-013](prompts/prompts.md#p-013) | OK |
| C-08 | D-05 matches what the user intended | [P-014](prompts/prompts.md#p-014) | [P-015](prompts/prompts.md#p-015) | OK; reason added to D-05 |
| C-09 | `git status` lists nothing that shouldn't be committed | [P-014](prompts/prompts.md#p-014) | [P-015](prompts/prompts.md#p-015) | Finding: "add original-brief folder to gitignore" → I-06 |
| C-10 | User accepts that cloning needs gitleaks installed | [P-014](prompts/prompts.md#p-014) | [P-015](prompts/prompts.md#p-015) | OK, "no need for README notes" |
| C-11 | Ignoring `original-brief/` also leaving `first-notes.md` uncommitted is intended | [P-015](prompts/prompts.md#p-015) | [P-016](prompts/prompts.md#p-016) | Finding: "You're right", keep the notes in the repo → I-07 |
| C-12 | `interventions.md` headings read right without the date (lines 10–44) | [P-018](prompts/prompts.md#p-018) | [P-019](prompts/prompts.md#p-019) | OK |
| C-13 | `original-brief.md` layout reads right (PM quote, "What to Submit" list) | [P-021](prompts/prompts.md#p-021) | [P-022](prompts/prompts.md#p-022) | OK |
| C-14 | D-07 says what the user meant | [P-021](prompts/prompts.md#p-021) | [P-022](prompts/prompts.md#p-022) | OK |
| C-15 | The **Logged:** rule in `CLAUDE.md` and D-06 say what the user meant | [P-019](prompts/prompts.md#p-019) | [P-023](prompts/prompts.md#p-023) | OK |
| C-16 | `process-logs.md` describes the logs the way the user would explain them to the assessor | [P-024](prompts/prompts.md#p-024) | [P-025](prompts/prompts.md#p-025) | OK |
| C-17 | Logging the separate-file choice as a `CORRECT` entry (I-08) fits | [P-024](prompts/prompts.md#p-024) | [P-025](prompts/prompts.md#p-025) | OK; reason added to I-08 and D-08 |
| C-18 | The repo as published on GitHub (the user's own check, not from a list) | — | [P-028](prompts/prompts.md#p-028) | Finding: "take out autonomy modes" → I-09; "create a simple README.md" → I-10 |
| C-19 | The "Approval gates" section in `CLAUDE.md` says what the user meant by keeping only `guided` | [P-028](prompts/prompts.md#p-028) | [P-029](prompts/prompts.md#p-029) | OK |
| C-20 | `/build` keeps the stop after a passing review, before the walkthrough | [P-028](prompts/prompts.md#p-028) | [P-029](prompts/prompts.md#p-029) | OK |
| C-21 | `README.md` is short enough and describes the repo right | [P-028](prompts/prompts.md#p-028) | [P-029](prompts/prompts.md#p-029) | OK |
| C-22 | Claude's line after the user's quote in I-09 is a fair reading | [P-028](prompts/prompts.md#p-028) | [P-029](prompts/prompts.md#p-029) | OK |
| C-23 | `phases.md` Setup ranges are right, and `/brief` belongs in Kickoff | [P-029](prompts/prompts.md#p-029) | [P-030](prompts/prompts.md#p-030) | OK |
| C-24 | The `CLAUDE.md` rule for closing a phase says what the user wants | [P-029](prompts/prompts.md#p-029) | [P-030](prompts/prompts.md#p-030) | OK |
| C-25 | The "Commit messages" section in `CLAUDE.md` says what the user wants, other global git rules still apply | [P-032](prompts/prompts.md#p-032) | [P-034](prompts/prompts.md#p-034) | OK |
| C-26 | I-11 describes the partial commit and the user's manual fix | [P-033](prompts/prompts.md#p-033) | [P-034](prompts/prompts.md#p-034) | OK |
| C-27 | Role priorities and review checks in the three agent files match what the user meant | [P-037](prompts/prompts.md#p-037) | [P-038](prompts/prompts.md#p-038) | OK |
| C-28 | The shared agent rules, including FAIL needing a blocker, set the bar the user wants | [P-037](prompts/prompts.md#p-037) | [P-038](prompts/prompts.md#p-038) | OK |
| C-29 | The `/design` stage loop does what was agreed, including the stop after a second round | [P-039](prompts/prompts.md#p-039) | [P-040](prompts/prompts.md#p-040) | OK |
| C-30 | Logging every reviewer FAIL in `/design` as a `CORRECT` entry is the record the user wants | [P-039](prompts/prompts.md#p-039) | [P-040](prompts/prompts.md#p-040) | OK |
| C-31 | `CLAUDE.md` describes the new design workflow correctly | [P-039](prompts/prompts.md#p-039) | [P-040](prompts/prompts.md#p-040) | OK |
| C-32 | `feature-design/` holds only `templates/` with the two templates | [P-040](prompts/prompts.md#p-040) | [P-041](prompts/prompts.md#p-041) | OK |
| C-33 | `CLAUDE.md` describes the single folder and no longer mentions `/brief` | [P-040](prompts/prompts.md#p-040) | [P-041](prompts/prompts.md#p-041) | OK |
