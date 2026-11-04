# Decisions · Local demo: M1

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-35 · scope · M1: GDACS is the only natural-disaster source, with no history fetch
- **Decided by:** user · [P-074](prompts/prompts.md#p-074); override in I-27
- **What:** M1 tries GDACS alone for natural disasters (free, no key, Green/Orange/Red alert levels), and fetches no history from any source. It will be recorded in the M1 spec's Decisions.
- **Why:** "GDACS is enough." Claude checked GDACS, USGS and EONET live in [P-073](prompts/prompts.md#p-073). Reuse is under CC BY 4.0, through the EU Commission legal notice that GDACS links to (C-45).

### D-36 · scope · M1: keyed non-commercial free tiers are acceptable, and messages credit GDACS
- **Decided by:** user, on the planner's and Claude's recommendations · [P-075](prompts/prompts.md#p-075)
- **What:** the local demo may use free tiers limited to personal, non-commercial or development use. The findings note marks each one as a blocker for later phases. Messages built from GDACS credit it as the source and may note it isn't an official warning. That goes into the wording, OQ-07.
- **Why:** the demo is local and never deployed. GDACS content is under CC BY 4.0, and its terms say it is "not meant to substitute nor to override" official alerts (C-45).

### D-37 · scope · M1: Twelve Data is the only market source
- **Decided by:** user, on Claude's recommendation · [P-075](prompts/prompts.md#p-075)
- **What:** M1 tries Twelve Data alone for market movements: a free key covering US stocks and ETFs, forex and crypto, with the day's change in the quote. Its limits are 8 credits a minute and 800 a day, which is about a 15-minute poll for 6 instruments. The user signs up for the key. Its "internal non-display usage" terms are flagged as a blocker for later phases. It will be recorded in the M1 spec's Decisions.
- **Why:** Claude checked it live (a quote with the `demo` key) and read its pricing page. Finnhub's terms and freshness couldn't be verified, and the no-key options cover only crypto or daily forex.

### D-38 · scope · Twelve Data's "non-display" free tier is accepted for the local trial as evaluation
- **Decided by:** user, on Claude's recommendation · [P-076](prompts/prompts.md#p-076)
- **What:** M1 uses Twelve Data's free tier even though its terms define "Non-Display Use" as "any use of Data that does not involve displaying the Data to natural persons", and alerts show figures to the user. The user is the only viewer and nothing is redistributed. The findings note flags display use as a blocker for any later phase.
- **Why:** the trial is evaluation. A paid tier or a different source can be decided once M1 shows whether the data is worth it. Source: [twelvedata.com/terms](https://twelvedata.com/terms).

### D-39 · scope · M1 news: three RSS feeds grouped and rated by an LLM, with Google News as a baseline
- **Decided by:** user, on Claude's recommendation · [P-077](prompts/prompts.md#p-077); the user proposed the LLM approach
- **What:**
  - M1 fetches BBC World, The Guardian World and Al Jazeera RSS. One LLM pass groups items about the same story and gives each a severity level, against a rubric the planner drafts and the user approves.
  - Google News top stories is fetched as a baseline to compare against.
  - This is a trial. DEC-26 (one source per kind), PM-15 (merging) and DEC-04/05 (the product decides importance) stay unchanged unless the findings support revising the spec before M3.
- **Why:** RSS has no importance signal. Google's ranking is opaque and its reuse terms are unclear. Grouping and rating ourselves gives a signal we control and can explain in "why it was sent".

### D-40 · scope · M1 rates news with Gemini Flash-Lite on the free tier; keys live in a gitignored `.env`
- **Decided by:** user · [P-078](prompts/prompts.md#p-078); Claude had recommended Claude Haiku 5.5, then Gemini once the user asked about it
- **What:** the LLM step uses Gemini Flash-Lite's free tier. `.env` at the repo root holds `GEMINI_API_KEY` and `TWELVE_DATA_API_KEY`, and `.gitignore` excludes it. The terms are recorded in the findings: on the free tier Google may use and human-review prompts, only public headlines are sent, and EEA, UK and Swiss users need the paid tier in any later phase.
- **Why:** it costs nothing, and the data-use terms don't matter for public headlines.

### D-41 · scope · How the M1 trial runs
- **Decided by:** user · [P-078](prompts/prompts.md#p-078), on the planner's defaults except three overrides (I-28)
- **What:**
  - Samples are gitignored, and only the findings note is committed.
  - The trial watches for about 3 minutes.
  - No npm packages.
  - The bars aim for a few alerts a day.
  - Instruments: SPY, QQQ, EUR/USD, BTC/USD, GLD and USO.
  - The findings map source fields to FR-06 and draft no wording.
  - Gemini groups the news items and rates them against a 3-level rubric that the planner drafts and the user approves with the spec.
  - The user settles OQ-01 at the walkthrough.
  - Recorded in the M1 spec's Decisions.
- **Why:** the user asked for the questions to be re-run "in consideration that we worked out the sources ourselves". Two of the planner's questions (who picks the source, and what the command fetches) were dropped as moot.

### D-42 · process · `CLAUDE.md` records that agents never write or read `.env`
- **Decided by:** user · [P-080](prompts/prompts.md#p-080)
- **What:** a Secrets section in `CLAUDE.md`. Keys live in the gitignored `.env`, and their names in `.env.example`. Claude's permission check blocks writing `.env`, so no agent creates, edits or reads it, or retries a blocked write; the user adds keys with a `!` command. Scripts use `node --env-file-if-exists=.env`.
- **Why:** in [P-078](prompts/prompts.md#p-078) the permission check blocked Claude's write to `.env`. The user wanted that recorded "so it persists with the project".

### D-43 · scope · M1 spec approved, with the news severity rubric; Yahoo Finance rejected
- **Decided by:** user · [P-082](prompts/prompts.md#p-082)
- **What:** the M1 spec and its 3-level severity rubric are approved as the planner drafted them: Major, Notable, Routine, with "dozens of deaths or more" as an example of Major. Twelve Data stays the market source. Yahoo Finance was checked live in [P-081](prompts/prompts.md#p-081) and left out, because its terms forbid collecting data "using any automated means". See the [M1 spec](../../../feature-design/local-demo/milestones/01-try-the-data-sources.md).
- **Why:** the rubric decides which news can clear the bar, so it was the user's to approve.

### D-44 · scope · Guardian and Al Jazeera are no longer sent to Gemini; a licensed news path is to be found
- **Decided by:** user, on the executor's recommendation · [P-083](prompts/prompts.md#p-083)
- **What:**
  - Guardian and Al Jazeera RSS are still fetched and counted, but never sent to an LLM.
  - The Gemini step takes BBC items only, pending the user's check of the BBC's terms.
  - Claude looks up news APIs whose terms allow AI processing, for M3 to choose from.
  - Recorded in the [M1 spec's Decisions](../../../feature-design/local-demo/milestones/01-try-the-data-sources.md).
- **Why:** the Guardian's terms forbid AI processing of its content, and Al Jazeera's forbid text and data mining (I-29).

### D-45 · scope · The BBC's terms don't allow AI either, so no news goes to an LLM in M1
- **Decided by:** user · [P-085](prompts/prompts.md#p-085), after checking the BBC's terms in a browser
- **What:** `NEWS_LLM_FEEDS` is empty, and the Gemini step is skipped for news. The user asked to step back and find how to get general breaking news without AI processing of publishers' content.
- **Why:** "BBC terms don't allow AI."

### D-46 · scope · M1 news: Event Registry gives the importance signal; the LLM step is dropped
- **Decided by:** user · [P-086](prompts/prompts.md#p-086); override of Claude's recommendation in I-30
- **What:**
  - M1 adds Event Registry (newsapi.ai). Its clustered events, with an article count per event, are the importance signal for news. Free plan, non-commercial, key in `.env`.
  - The Gemini step and `GEMINI_API_KEY` are removed. The approved rubric (D-43) is kept on file but unused.
  - The mechanical cross-feed headline count is deleted from the findings.
  - The RSS feeds are only fetched and counted, with Google News as the baseline.
- **Why:** "If we go with Event Registry and we get significance, we don't need AI. Term 5 allows use inside own products." The user read Section 5 themselves, after Claude couldn't load the terms page. The cross-feed count is removed because Al Jazeera bans "text or data mining".

### D-47 · scope · M1 news is Event Registry only
- **Decided by:** user · [P-087](prompts/prompts.md#p-087)
- **What:** M1 fetches no RSS feeds and no Google News. News comes from Event Registry alone, so news follows the one-source-per-kind rule (DEC-26) like the other kinds.
- **Why:** not stated (I-31).

### D-48 · scope · Event Registry's window is the current and previous UTC day
- **Decided by:** user, on Claude's recommendation · [P-091](prompts/prompts.md#p-091)
- **What:** M1's Event Registry search covers yesterday and today in UTC, at most about 48 hours. That's still current data, not a history fetch. The M1 spec's wording is changed to match. See the [M1 spec](../../../feature-design/local-demo/milestones/01-try-the-data-sources.md).
- **Why:** Event Registry dates events by whole day, so "roughly the last 24 hours, never older" can't be met exactly. Today alone is nearly empty just after midnight UTC.

### D-49 · process · Develop from saved samples only, with no live data calls until the user says otherwise
- **Decided by:** user · [P-095](prompts/prompts.md#p-095); Claude recommended Event Registry only, and the user chose all sources (I-33)
- **What:** no agent calls GDACS, Twelve Data or Event Registry live. Development and verification use M1's samples in `spikes/samples/`, which no agent may delete or overwrite. A step that needs a live call stops and asks. Recorded in `CLAUDE.md` under "Live data calls".
- **Why:** "the 2000 tokens never renew" (C-52).

### D-50 · process · M1 skips the walkthrough; its open questions are settled directly
- **Decided by:** user · [P-096](prompts/prompts.md#p-096), over the `/build` rule that stage 4 "always runs"
- **What:** no explainer for M1. The questions the walkthrough would have settled go to the user directly: OQ-01's coverage and bar per kind, and the source per kind. This applies to M1 only. The `/build` skill is unchanged.
- **Why:** "We followed closely, so no need for walkthrough."

### D-51 · scope · OQ-01 settled: a bar and a source for each kind
- **Decided by:** user, on the M1 findings' recommendations · [P-096](prompts/prompts.md#p-096)
- **What:**
  - **Disasters (GDACS):** Red for any hazard, or Orange for earthquakes and cyclones (D2).
  - **Markets (Twelve Data):** SPY, QQQ, EUR/USD, BTC/USD, GLD and USO, each moving against the previous close by more than its threshold: ±3%, ±3%, ±1.2%, ±8%, ±3% and ±6% (M2).
  - **News (Event Registry):** an English event with ≥1,000 articles over the current and previous UTC day (N1).
  - Estimated total: about 1.5–2.5 alerts a day. Sources are as in the [M1 findings](../../../feature-design/local-demo/findings/data-sources.md#candidate-bars-per-kind).
- **Why:** the user's target was "a few a day". The estimates rest on one afternoon with no history, so M3 should expect to tune them.

### D-52 · scope · Messages carry only what happened, and where and when
- **Decided by:** user · [P-098](prompts/prompts.md#p-098); the GDACS credit on Claude's recommendation
- **What:**
  - FR-06 becomes: what happened, plus where and when if available and appropriate.
  - Significance, "why it was sent" and the source link are dropped.
  - Disaster messages keep a short "Source: GDACS" credit, as CC BY 4.0 requires. The "not an official warning" note from D-36 goes.
  - The missing source link is no longer a gap for M3 (OQ-10).
- **Why:** "significance is an internal value and source link is not available across all channels."

