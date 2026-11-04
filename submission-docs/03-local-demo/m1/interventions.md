# Interventions · Local demo: M1

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

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

