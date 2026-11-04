# Checks

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](CLAUDE.md#checks-for-the-user).

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
| C-34 | The post-MVP lines in `/design` and `/build` say what the user meant | [P-047](prompts/prompts.md#p-047) | [P-050](prompts/prompts.md#p-050) | OK |
| C-35 | Resend and Postmark send only to the account address without a verified domain; Gmail SMTP with an app password reaches anyone, at a few hundred a day | [P-054](prompts/prompts.md#p-054) | [P-055](prompts/prompts.md#p-055) | OK |
| C-36 | `submission-docs/dropped-documents/` holds the spec, assumptions, README and four reviews | [P-057](prompts/prompts.md#p-057) | [P-058](prompts/prompts.md#p-058) | OK |
| C-37 | I-19 and D-27 quote the user's reasons as meant | [P-057](prompts/prompts.md#p-057) | [P-058](prompts/prompts.md#p-058) | OK |
| C-38 | The new "Way of working" and "Approval gates" in `CLAUDE.md` describe the intended process | [P-058](prompts/prompts.md#p-058) | [P-061](prompts/prompts.md#p-061) | Finding: "I can't see the suggested local-demo (or similar) subfolder" → I-23 |
| C-39 | The `product-designer` agent's spec outline is the shape of spec the user wants | [P-058](prompts/prompts.md#p-058) | [P-063](prompts/prompts.md#p-063) | OK |
| C-40 | The drafted "Wording users see" in the product spec is approved | [P-062](prompts/prompts.md#p-062) | [P-063](prompts/prompts.md#p-063) | Finding: "drop wording suggestion, make it dependent on the data source for now" → I-24 |
| C-41 | The `local-demo/` roadmap and milestone paths read correctly in `CLAUDE.md`, `/build` and the planner | [P-062](prompts/prompts.md#p-062) | [P-063](prompts/prompts.md#p-063) | OK |
| C-42 | What the product spec leaves open (OQ-01 bars and coverage, OQ-07 wording) and defers (PM-12 to PM-15) matches what the demo should teach | [P-065](prompts/prompts.md#p-065) | [P-066](prompts/prompts.md#p-066) | OK |
| C-43 | The M1 and M2 "Done when" lines in the local-demo roadmap describe an acceptable finish | [P-067](prompts/prompts.md#p-067) | [P-068](prompts/prompts.md#p-068) | OK |
| C-44 | The GDACS Orange/Red event list and the USGS significant-month feed return live JSON in a browser | [P-073](prompts/prompts.md#p-073) | [P-074](prompts/prompts.md#p-074) | OK |
| C-45 | The GDACS terms ask only for attribution | [P-073](prompts/prompts.md#p-073) | [P-074](prompts/prompts.md#p-074) | OK: the user asked Claude to check. The terms page has a disclaimer and no licence, and links its copyright to the EU Commission legal notice: CC BY 4.0, credit the source, third-party content excepted |
| C-46 | Twelve Data's Basic plan gives 800 credits a day | [P-075](prompts/prompts.md#p-075) | [P-077](prompts/prompts.md#p-077) | OK |
| C-47 | AI Studio shows the free daily request limit for Gemini Flash-Lite | [P-077](prompts/prompts.md#p-077) | [P-078](prompts/prompts.md#p-078) | OK |
| C-48 | The Secrets section in `CLAUDE.md` says what the user meant | [P-080](prompts/prompts.md#p-080) | [P-081](prompts/prompts.md#p-081) | OK |
| C-49 | The M1 spec's acceptance criteria describe an acceptable finish for a throwaway trial | [P-079](prompts/prompts.md#p-079) | [P-081](prompts/prompts.md#p-081) | OK |
| C-50 | The M1 findings' candidate bars and FR-06 tables are enough to choose bars at the walkthrough | [P-094](prompts/prompts.md#p-094) | [P-095](prompts/prompts.md#p-095) | OK: "bars seem fine" |
| C-51 | `.env.example` lists `TWELVE_DATA_API_KEY=` and `EVENT_REGISTRY_API_KEY=` with no values and no `GEMINI_API_KEY` | [P-094](prompts/prompts.md#p-094) | [P-095](prompts/prompts.md#p-095) | OK |
| C-52 | Event Registry's free allowance: 2,000 tokens or searches, and whether it renews | [P-094](prompts/prompts.md#p-094) | [P-095](prompts/prompts.md#p-095) | OK: 2,000 tokens that never renew |
| C-53 | FR-06, DEC-27, DEC-28 and OQ-10 in the product spec state the bars, the message contents and the remaining gap as meant | [P-099](prompts/prompts.md#p-099) | [P-101](prompts/prompts.md#p-101) | OK |
| C-54 | Resend's test sender `onboarding@resend.dev` delivers only to the Resend account's signup address | [P-110](prompts/prompts.md#p-110) | [P-111](prompts/prompts.md#p-111) | OK |
| C-55 | Resend's free tier is about 100 emails a day and 3,000 a month | [P-110](prompts/prompts.md#p-110) | [P-111](prompts/prompts.md#p-111) | OK |
| C-56 | The M2 spec's "Decisions from the interview" matches the P-109 answers | [P-110](prompts/prompts.md#p-110) | [P-111](prompts/prompts.md#p-111) | OK |
| C-57 | Slack Workflow Builder webhooks are "Available on paid plans" (`delivery.md:107`), and whether that affects D-57 | [P-126](prompts/prompts.md#p-126) | [P-128](prompts/prompts.md#p-128) | OK: keep the workflow webhook; "It seems to run fine in a developer sandbox workspace." |
| C-58 | `feature-design/local-demo/findings/delivery.md` read in full, with Live runs and the M5 notes | [P-126](prompts/prompts.md#p-126) | [P-128](prompts/prompts.md#p-128) | OK |
| C-59 | `.claude/skills/build/SKILL.md` Stage 2–3 step 4 and Stage 4 read as an optional walkthrough the way the user wants | [P-130](prompts/prompts.md#p-130) | [P-131](prompts/prompts.md#p-131) | OK |
| C-60 | The new search paragraph under Reading in `.claude/agents/reviewer.md` (same in `executor.md`, `explainer.md`) | [P-140](prompts/prompts.md#p-140) | [P-141](prompts/prompts.md#p-141) | OK |
| C-61 | `--exclude-dir=samples` skipping every folder named `samples` is fine, with no other `samples` folder planned | [P-140](prompts/prompts.md#p-140) | [P-141](prompts/prompts.md#p-141) | OK |
| C-62 | D-61 in `submission-docs/decisions.md` | [P-140](prompts/prompts.md#p-140) | [P-141](prompts/prompts.md#p-141) | OK |
| C-63 | `submission-docs/CLAUDE.md` does not load in a session that hasn't opened that folder (`/memory`) | [P-135](prompts/prompts.md#p-135) | [P-142](prompts/prompts.md#p-142) | OK |
| C-64 | Claude's Grep and Glob respect `.ignore`, so searches skip `submission-docs/` and `spikes/samples/` | [P-135](prompts/prompts.md#p-135) | [P-142](prompts/prompts.md#p-142) | Finding: "another process now fixed that" → I-39 |
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
