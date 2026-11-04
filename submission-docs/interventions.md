# Interventions

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

### I-01 · CORRECT · [P-009](prompts/prompts.md#p-009)
- **Claude did:** proposed in [P-007](prompts/prompts.md#p-007) that the `Stop` hook scan each turn for interrupts and rejected tool calls, and named the transcript markers without having checked them.
- **Caught by:** Claude, checking its own claim against real transcripts in `~/.claude/projects/` before building it.
- **Why wrong:** `Stop` does not record a reply for an interrupted turn ([P-004](prompts/prompts.md#p-004) shows the effect), so it would miss interrupts. A plain text search also matched a marker inside an earlier command's output, and the AskUserQuestion "clarify" button produces the same rejection text as a real rejection.
- **Changed:** the scan runs in `UserPromptSubmit` and covers the previous turn. It only matches a marker at the start of a user text block or tool result, and it skips AskUserQuestion.

### I-02 · CORRECT · [P-010](prompts/prompts.md#p-010)
- **Claude did:** wrote a CLAUDE.md rule capping **Checks for you** at three items.
- **Caught by:** user, reading the [P-009](prompts/prompts.md#p-009) reply.
- **Why wrong:** "don't drop important ones just because there are more than three."
- **Changed:** no cap. The checks are numbered so the user can answer "Check 1, 2, 3 done" or report findings by number.

### I-03 · CORRECT · [P-011](prompts/prompts.md#p-011)
- **Claude did:** the [P-010](prompts/prompts.md#p-010) reply had two numbered lists, the open checks from P-009 and the new **Checks for you**, so "check 1, 2" could mean either.
- **Caught by:** Claude, while logging the user's answer. Claude took it to mean the **Checks for you** list, and the user confirmed in [P-012](prompts/prompts.md#p-012).
- **Changed:** `CLAUDE.md` rule: checks still open from earlier replies go into the one **Checks for you** list, so the numbers never collide.

### I-04 · CORRECT · [P-012](prompts/prompts.md#p-012)
- **Claude did:** logged checks that passed as `CHECK` entries in this file. Its last list of checks also included a decision ("add P-003 as D-04?").
- **Caught by:** user: "When I OK a check, it should not be logged as an 'intervention'."
- **Changed:** checks have their own log, [`checks.md`](checks.md). A finding gets one row there linking to an entry here, which holds the details. Choices the user has to make are asked outside the checks list.

### I-05 · CORRECT · [P-014](prompts/prompts.md#p-014)
- **Claude did:** recommended deleting `package.json`, since the tech stack was still open.
- **Caught by:** user, who kept it and set up Node tooling instead.
- **Why wrong:** the runtime was "fixed for consistency in runtime environment" (given in [P-015](prompts/prompts.md#p-015)).
- **Changed:** Node is the runtime; see D-05.

### I-06 · CORRECT · [P-015](prompts/prompts.md#p-015)
- **Claude did:** wrote a `.gitignore` that left the assessment material (now `original-brief/`) to be committed.
- **Caught by:** user, in check C-09.
- **Why wrong:** not stated beyond "add original-brief folder to gitignore".
- **Changed:** `original-brief/` added to `.gitignore`. The `/brief` skill read `brief/`, which the user had renamed, so Claude updated that path in `.claude/skills/brief/SKILL.md` to match.

### I-07 · CORRECT · [P-016](prompts/prompts.md#p-016)
- **Claude did:** as asked in [P-015](prompts/prompts.md#p-015), ignored the whole `original-brief/` folder, which also kept the user's first notes out of the repo. Claude raised this as check C-11.
- **Caught by:** user, answering C-11.
- **Why wrong:** Claude's reason in C-11, which the user agreed with ("You're right"): the notes are part of the process record.
- **Changed:** `first-notes.md` (edited by the user) moved to `submission-docs/`. The PDF moved to the repo root as `original-brief.pdf`, and `.gitignore` names only that file. The paths in the `/brief` skill were updated to match.

### I-08 · CORRECT · [P-024](prompts/prompts.md#p-024)
- **Claude did:** recommended adding a "Process logs" section to `workflow.md` (in [P-020](prompts/prompts.md#p-020), repeated in P-022 and P-023).
- **Caught by:** user.
- **Why wrong:** "to keep them separate from the agentic workflow description" (given in [P-025](prompts/prompts.md#p-025)).
- **Changed:** the logs are described in their own file, [`process-logs.md`](process-logs.md). See D-08.

### I-09 · CORRECT · [P-028](prompts/prompts.md#p-028)
- **Claude did:** kept the `flow` plugin's three autonomy modes (`guided`, `checkpoint`, `auto`) in `CLAUDE.md`, the skills, the agents and `workflow.md`.
- **Caught by:** user, in check C-18, reading the repo on GitHub.
- **Why wrong:** "that mode makes sense for the human-in-the-loop type mode that we use in this repo". This repo is worked with the user approving each stage, so only `guided` is used and the other two were dead weight.
- **Changed:** the `--mode` flag and the `checkpoint` and `auto` modes are gone. `/kickoff` and `/build` always run what was `guided`. See D-09.

### I-10 · CORRECT · [P-028](prompts/prompts.md#p-028)
- **Claude did:** left the repo without a `README.md`.
- **Caught by:** user, in check C-18.
- **Why wrong:** "standard for any repo".
- **Changed:** a short `README.md` at the root saying what the repo is and pointing to the workflow and process logs.

### I-11 · CORRECT · [P-033](prompts/prompts.md#p-033)
- **Claude did:** ran a `cd` into `submission-docs/` in [P-030](prompts/prompts.md#p-030), which left the session's shell there. The user's `git add .` then staged only that folder, and the commit left out `CLAUDE.md`, `README.md`, the skills, the agents and the template.
- **Caught by:** Claude, checking the commit stat after it was made.
- **Why wrong:** the commit logged D-09 to D-11 without the changes they describe. The user fixed it by hand, amending the commit in their own terminal.
- **Changed:** commit `1429176` replaces `f28fb44` with all 15 files. Claude uses absolute paths in shell commands so the working directory stays at the repo root.

### I-12 · CORRECT · [P-038](prompts/prompts.md#p-038)
- **Claude did:** recommended a new `/design` skill that leaves `/kickoff` untouched, "so the old path is still there as a record" ([P-037](prompts/prompts.md#p-037)).
- **Caught by:** user.
- **Why wrong:** not stated. The user kept the name: "Replace kickoff (but use 'design' I like the term better)."
- **Changed:** `/design` replaces `/kickoff`. See D-14.

### I-13 · CORRECT · [P-040](prompts/prompts.md#p-040)
- **Claude did:** kept `/brief` as an optional skill, with `/design` reading `brief.md` when it has content ([P-039](prompts/prompts.md#p-039)).
- **Caught by:** user.
- **Why wrong:** "no need to keep it if we know we will start in this repo with the design, it just adds noise."
- **Changed:** the `/brief` skill and `brief.md` are deleted. `/design` starts from `original-brief.md` alone. See D-17.

### I-14 · CORRECT · [P-043](prompts/prompts.md#p-043)
- **Claude did:** the product designer recommended threshold values (quakes M6.0/M5.0, markets 5%/3%, news by breaking feed and keyword), one optional keyword, region or asset filter per alert, a cap of 5 notifications per alert per hour with an overflow summary, and pause/resume with a pause link in every notification.
- **Caught by:** user, answering the stage 1 questions.
- **Why wrong:** thresholds: "Revisit this once we try the data source." The other three: not stated.
- **Changed:** threshold values stay open until a source is tried; alerts take category and level only; no rate cap; "Only edit per alert", with no pause. See D-18.

### I-15 · CORRECT · [P-044](prompts/prompts.md#p-044)
- **Claude did:** the product designer recommended storing events below "Notable", marked and never sent, so real data could settle the open threshold values.
- **Caught by:** user, answering the follow-up questions.
- **Why wrong:** not stated.
- **Changed:** events below "Notable" are dropped at fetch. Threshold values have to be settled from what the source returns when it is fetched. See D-19.

### I-16 · CORRECT · [P-049](prompts/prompts.md#p-049)
- **Claude did:** recommended:
  - an allowlist for sign-in (the CTO's position)
  - a 60-minute age window on top of the created/edited rule for which events are sent
  - dedup keys for each category
  - a sign-in route through the mail-catcher when there is no domain
  - two system levels per category, chosen per alert, as agreed in D-18
- **Caught by:** user, answering the review questions.
- **Why wrong:** for the age window, the user gave a rule instead: "If event is older than alert creation / edit, don't send." For dedup: "get back to this once we inspect the sources". For magic links: "discuss later when selecting third-party service". For levels: "we shouldn't set up levels for the MVP, just an on-off". For sign-in: not stated.
- **Changed:** open sign-up; the created/edited rule only, with no age window; dedup keys and magic-link delivery left open; the MVP becomes one on/off subscription, with categories, levels and filters moved to post-MVP. See D-21 to D-23.

### I-17 · CORRECT · [P-051](prompts/prompts.md#p-051)
- **Claude did:** the product designer recommended limits for open sign-up of 3 magic links per address and 10 per IP per hour.
- **Caught by:** user.
- **Why wrong:** the user asked whether these were easy to build and suggested "a max number of sign-ups + limit on magic link + send".
- **Changed:** at most 10 accounts, 3 links per address per hour, 5 send tests per user per minute, and no per-IP limit. See D-24.

### I-18 · CORRECT · [P-045](prompts/prompts.md#p-045) – [P-054](prompts/prompts.md#p-054)
- **Claude did:** the product designer's stage 1 draft (v0.1) of `product-spec.md` and `assumptions.md`.
- **Caught by:** the CTO, round 1 FAIL: F-01, magic-link sign-in open to anyone is a spam relay. The eng lead, round 1 FAIL: B-01, delete contradicts itself; B-02, no rule for which events are sent; B-03, the dedup rules contradict each other.
- **Why wrong:** in the reviewers' words, "I could not write functional requirements without inventing a business rule" (eng lead).
- **Changed:**
  - v0.2: open sign-up capped at 10 accounts; hard delete; the created/edited eligibility rule; dedup keys left open as OQ-06; the MVP cut to one subscription (D-21 to D-24).
  - v0.3: round 2 majors (D-25, D-26).
  - Both reviewers passed round 2.

### I-19 · REJECT · [P-057](prompts/prompts.md#p-057)
- **Claude did:** built `/design` as a skill: three roles, five stages, cross-reviews and gates. Ran stage 1 through two review rounds. That produced a v0.3 product spec (62 decisions, 32 assumptions) and four review files.
- **Caught by:** user, at the stage 1 gate.
- **Why wrong:** "we are not ready for making this a skill … the resulting docs are too complicated."
- **Changed:** the `/design` skill is deleted. The stage 1 documents and reviews moved to [`dropped-documents/dropped-from-initial-design-skill/`](dropped-documents/dropped-from-initial-design-skill/). The work restarts as a local-demo phase. See D-27.

### I-20 · CORRECT · [P-058](prompts/prompts.md#p-058)
- **Claude did:** suggested making three source limits the CTO found during the dropped review into roadmap questions for the demo: NewsAPI's and Alpha Vantage's free tiers, and Resend's quota and domain rule ([P-057](prompts/prompts.md#p-057)).
- **Caught by:** user.
- **Why wrong:** "we likely want different sources and service providers."
- **Changed:** dropped. The roadmap starts with no source or provider assumptions.

### I-21 · CORRECT · [P-059](prompts/prompts.md#p-059)
- **Claude did:** the product designer recommended product-defined levels chosen by the user, two magnitude levels (5.0+ and 6.0+), and a cap of 5 alerts per day.
- **Caught by:** user, in the interview.
- **Why wrong:** not stated.
- **Changed:** the product alone decides what is important, the bar is set once the source data has been seen, and there is no cap. See D-29.

### I-22 · CORRECT · [P-060](prompts/prompts.md#p-060)
- **Claude did:** the product designer recommended a pause link that pauses the whole alert, and no delete in this phase. Claude recommended bringing the draft spec back to the agreed outline of about two pages.
- **Caught by:** user.
- **Why wrong:** for the pause, "Drop the link for now, make it only editable through the site." For delete and the outline: not stated.
- **Changed:** no pause anywhere, delete allowed, and the spec keeps its structure. See D-30.

### I-23 · CORRECT · [P-061](prompts/prompts.md#p-061)
- **Claude did:** read "a local-demo phase in the feature-design folder" ([P-057](prompts/prompts.md#p-057)) as the phase living directly in `feature-design/`, and created no subfolder.
- **Caught by:** user, in check C-38.
- **Why wrong:** the user expected a subfolder: "I can't see the suggested local-demo (or similar) subfolder".
- **Changed:** the demo's roadmap and milestones move to `feature-design/local-demo/`. The product spec stays at the root of `feature-design/`. See D-31.

### I-24 · CORRECT · [P-063](prompts/prompts.md#p-063)
- **Claude did:** the product designer drafted every user-facing string in the product spec: the alert message, the in-app text, and the delete confirmation.
- **Caught by:** user, in check C-40.
- **Why wrong:** "drop wording suggestion, make it dependent on the data source for now."
- **Changed:** the drafted wording is removed. The spec says what each message must carry and leaves the wording open until the data sources are known.

### I-25 · CORRECT · [P-063](prompts/prompts.md#p-063)
- **Claude did:** on the product designer's recommendation, which the user accepted in [P-059](prompts/prompts.md#p-059), the spec covered natural disasters (earthquakes) only, with news and markets under Post-MVP.
- **Caught by:** user.
- **Why wrong:** "this will give us a fuller picture about the data we can work with with less things to pivot on later."
- **Changed:** the spec covers all three kinds of event from the brief: breaking news, market movements and natural disasters. See D-32.

### I-26 · CORRECT · [P-067](prompts/prompts.md#p-067)
- **Claude did:** recommended keeping the M1 and M2 code as test-first app modules.
- **Caught by:** user, while the roadmap was being drafted.
- **Why wrong:** not stated.
- **Changed:** M1 and M2 are throwaway scripts. The real fetchers and senders are built in M3 and M5. See D-34.

### I-27 · CORRECT · [P-074](prompts/prompts.md#p-074)
- **Claude did:** in M1 round 1, the planner recommended GDACS plus USGS for natural disasters, and fetching about 30 days of history from each source to estimate alerts per day. Claude backed GDACS plus USGS after checking both live.
- **Caught by:** user.
- **Why wrong:** "GDACS is enough. No need for additional sources for natural disasters." On the history fetch: "Drop the planner idea of fetching history", given a third-party claim that GDACS keeps no public archive.
- **Changed:** M1 tries GDACS only for natural disasters, with no history fetch. See D-35.

### I-28 · CORRECT · [P-078](prompts/prompts.md#p-078)
- **Claude did:** the planner recommended committing trimmed samples, watching for 3+ runs over 2+ hours, and aiming the bars at about one alert a day in total.
- **Caught by:** user.
- **Why wrong:** for the watch window, "Try 3 minutes." For the other two, not stated.
- **Changed:** samples are gitignored, the trial watches for about 3 minutes, and the bars aim for a few alerts a day. See D-41.

### I-29 · CORRECT · [P-083](prompts/prompts.md#p-083)
- **Claude did:** recommended sending BBC, Guardian and Al Jazeera RSS through Gemini (D-39). Claude said publisher RSS terms are "typically personal, non-commercial use, with attribution", which is within D-36, without reading any of them ([P-077](prompts/prompts.md#p-077)).
- **Caught by:** the executor, reading the terms while building M1. The verification had already sent public headlines and summaries to Gemini twice.
- **Why wrong:** the Guardian's terms forbid using its content, including RSS, "with any machine learning and/or artificial intelligence technologies … to synthesise or combine with any other data or content" without written approval. Al Jazeera's terms (§6) forbid "text or data mining". The BBC's full terms couldn't be read.
- **Changed:** Guardian and Al Jazeera are no longer sent to Gemini, and a licensed news path is to be found. See D-44.

### I-30 · CORRECT · [P-086](prompts/prompts.md#p-086)
- **Claude did:** recommended keeping the Gemini step in M1, made conditional on a feed being cleared for AI, and deferring its comparison.
- **Caught by:** user.
- **Why wrong:** "If we go with Event Registry and we get significance, we don't need AI."
- **Changed:** the Gemini step is removed, and Event Registry gives news importance. See D-46.

### I-31 · CORRECT · [P-087](prompts/prompts.md#p-087)
- **Claude did:** told the planner, as a tier-two call, to keep BBC, Guardian and Al Jazeera RSS fetched and counted, and Google News as a baseline for Event Registry ([P-086](prompts/prompts.md#p-086)).
- **Caught by:** user.
- **Why wrong:** not stated: "Don't keep the RSS feeds and Google news."
- **Changed:** M1's news trial is Event Registry alone. The RSS and Google News code, its ACs and the findings sections that depend on it are removed. See D-47.

### I-32 · REJECT · [P-091](prompts/prompts.md#p-091)
- **Claude did:** the executor's M1 build, after the Event Registry amendment.
- **Caught by:** the reviewer, FAIL in round 1.
- **Why wrong:** AC-11: the "non-commercial" term for Event Registry had no source URL. The Event Registry window reaches back about 48 hours against the spec's "never older" than about 24. The reviewer also listed files outside the spec's allowed list. Those were the main session's: `CLAUDE.md` Secrets, the process logs, and the spec itself.
- **Changed:** the executor adds the SDK README URL for the free-user clause. The user accepted the ~48-hour window, and the planner rewords the spec to "the current and previous UTC day". See D-48.

### I-33 · CORRECT · [P-095](prompts/prompts.md#p-095)
- **Claude did:** recommended limiting the samples-only rule to Event Registry, since Twelve Data renews daily and GDACS is free.
- **Caught by:** user.
- **Why wrong:** not stated. The user chose "All sources".
- **Changed:** no live calls to any data source until the user says otherwise. See D-49.

### I-34 · CORRECT · [P-098](prompts/prompts.md#p-098)
- **Claude did:** the product spec's FR-06 (from DEC-10, on the product designer's recommendation) had every message carry what happened, where and when, its significance, why it was sent, and a source link.
- **Caught by:** user.
- **Why wrong:** "significance is an internal value and source link is not available across all channels."
- **Changed:** messages carry only what happened, and where and when if available and appropriate. See D-52.

### I-35 · CORRECT · [P-109](prompts/prompts.md#p-109)
- **Claude did:** the M2 planner recommended deliberately causing safe, free failures on each channel (wrong key, bad recipient, bad webhook URL, timeout) behind a `--fail` flag.
- **Caught by:** user.
- **Why wrong:** not stated: "Go for the happy path."
- **Changed:** no deliberate failures. Failure cases in the M2 findings come from the services' docs and from any that happen naturally. See D-53.

### I-36 · CORRECT · [P-109](prompts/prompts.md#p-109)
- **Claude did:** the M2 planner recommended letting the executor send live test messages, up to 10 per channel.
- **Caught by:** user.
- **Why wrong:** not stated. The user chose "No, I run them".
- **Changed:** the executor verifies offline only; the user runs the live sends and pastes the output. See D-54.

### I-37 · CORRECT · [P-118](prompts/prompts.md#p-118)
- **Claude did:** recommended switching M2's Slack destination from a Workflow Builder webhook to an incoming webhook, keeping "delivered" as HTTP 200 with body `ok` (D-55).
- **Caught by:** user.
- **Why wrong:** not stated: "Workflow webhook is fine for MVP."
- **Changed:** M2 posts through a Slack workflow webhook with a `text` variable; "delivered" also accepts a JSON `{"ok":true}` body. See D-57.

### I-38 · CORRECT · [P-129](prompts/prompts.md#p-129)
- **Claude did:** started the M2 explainer walkthrough automatically after the reviewer's PASS, as `/build` stage 4 required.
- **Caught by:** user, who also stopped the running explainer.
- **Why wrong:** not stated: "don't call explainer automatically, keep that optional".
- **Changed:** `/build` offers the walkthrough after a PASS and runs it only on request. See D-59.

### I-39 · CORRECT · [P-142](prompts/prompts.md#p-142)
- **Claude did:** added `.ignore` (D-60) to keep `submission-docs/` and `spikes/samples/` out of agent searches, without covering shell searches; listed it as check C-64.
- **Caught by:** user, through C-64; [P-139](prompts/prompts.md#p-139) showed shell `grep` ignores `.ignore`.
- **Why wrong:** agents with Bash could still `grep -r` or `find` into both folders.
- **Changed:** in another session, the agents with Bash and the main session were told to exclude both folders from shell searches. See D-61.

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
