# Spec 01: Try the data sources

Roadmap: M1

## Intent

Throwaway scripts in `spikes/` fetch real data from these sources:
- natural disasters: GDACS;
- market movements: Twelve Data;
- breaking news: Event Registry's event (cluster) API, where each event's article count is the signal of how important it is.

No AI or LLM processing is used, and no RSS feeds are fetched. The scripts save the raw samples locally, gitignored. A committed findings note in `feature-design/local-demo/findings/` records what each source returns, maps its fields to FR-06, and proposes two or three candidate bars per kind, so the user can settle OQ-01 at the walkthrough.

DEC-04, DEC-05, DEC-26 and PM-15 in `feature-design/local-demo/product-spec.md` stay as they are. The findings may only propose revising them before M3, and that would go through `/design revise`.

## Allowed files

- `spikes/fetch-sources.mjs` (the one command)
- `spikes/sources/gdacs.mjs`
- `spikes/sources/twelvedata.mjs`
- `spikes/sources/eventregistry.mjs`
- `spikes/sources/news-rss.mjs` (delete only)
- `spikes/sources/gemini-group.mjs` (delete only)
- `spikes/README.md` (how to run, which keys are needed)
- `.env.example` (key names only, no values)
- `.gitignore` (add `spikes/samples/`)
- `feature-design/local-demo/findings/data-sources.md`
- `spikes/samples/**` (written by the script, gitignored, never committed)

## Out of scope

- Fetching history or backfill from any source. The user's words: "Drop the planner idea of fetching history". Event Registry is asked only for its current window (see Sources).
- The following sources and services, or any other not named in this spec:
  - RSS feeds (BBC, Guardian, Al Jazeera or any other);
  - Google News;
  - USGS, GDELT, Finnhub, NewsAPI.org;
  - Gemini.
- Any AI or LLM processing of news content.
- npm packages or other dependencies, including Event Registry's SDKs. Use only built-in `fetch` and `node:` modules. Do not change `package.json` or `package-lock.json`.
- A database, a server, scheduling beyond the 3-minute watch, or any app code for M3.
- Drafting message wording (DEC-23, OQ-07). The findings map fields only.
- Editing `feature-design/local-demo/product-spec.md` or `feature-design/local-demo/roadmap.md`.
- Unit tests (roadmap Decisions: spikes are verified by running them).
- Committing samples or keys.

## Sources and trial setup

### Natural disasters: GDACS

- Endpoint: `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH`. No key.
- Each round makes two calls: one with `?alertlevel=Orange;Red` and one with no filter.
- Fields to read: `alertlevel`, `episodealertlevel`, `episodeid`, `severitydata`, `fromdate`, `todate`, `datemodified`, `country`, `url.report`, and the event type and id.
- Reuse is CC BY 4.0, through the EU Commission legal notice that GDACS links to. Messages must credit GDACS and may say it is not an official warning. This is recorded for OQ-07.

### Markets: Twelve Data

- Endpoint: `https://api.twelvedata.com/quote?symbol=...&apikey=...`. Key in `TWELVE_DATA_API_KEY`.
- Instruments: SPY, QQQ, EUR/USD, BTC/USD, GLD, USO.
- Fields to read: `close`, `previous_close`, `change`, `percent_change`, `datetime` or `timestamp`, and `is_market_open`.
- Free tier: 8 credits a minute and 800 a day, one credit per symbol. One round costs 6 credits.
- The free tier allows "internal non-display usage" only. The user accepts this for the local trial as evaluation. The findings must flag display use as a blocker for later phases.

### Breaking news: Event Registry (newsapi.ai)

- **What it gives.** Events: clusters of articles about one story. The article count per event is the importance signal.
- **Key.** `EVENT_REGISTRY_API_KEY`, in `.env`, which the user adds.
- **Free plan.** 2,000 searches, non-commercial, covering the last 30 days.
- **Terms.** The user read Section 5 of Event Registry's terms themselves: it allows use inside one's own products.
- **Endpoint and parameters.** The executor checks the exact event-search endpoint and its parameters against Event Registry's own docs and the SDK READMEs at github.com/EventRegistry, and cites them in the findings. The SDK is read for reference only, never installed.
- **Request:**
  - English-language events, sorted by article count, highest first;
  - limited to events dated the current or the previous UTC day (at most about 48 hours), the current window, and never older. Event Registry dates events by whole day, so an exact 24-hour cut-off is not possible. This is still current data, not a history fetch (P-091);
  - asking for the event's id, title, date, location, categories and article count.
- **Request budget.** At most one event-search request per round: at most 1 for a single run and 4 for a watch.

### Keys, samples and observation

- **Keys.** `TWELVE_DATA_API_KEY` and `EVENT_REGISTRY_API_KEY` go in the gitignored `.env` at the repo root.
- **Samples.** Raw samples go in `spikes/samples/<run timestamp>/`, which is gitignored. Only the findings note is committed.
- **Watch.** `--watch` runs 4 fetch rounds, at 0, 1, 2 and 3 minutes, so the watch lasts about 3 minutes. Each round costs 6 Twelve Data credits and 1 Event Registry search.
- **What 3 minutes can show.** A 3-minute watch shows the shape of the data. It says little about updates, repeats or volume. The findings must say so wherever they rely on it.

## Acceptance criteria

AC numbers are kept stable across amendments. An AC that was removed keeps its number, marked as removed.

- AC-1: With both keys set, `node --env-file-if-exists=.env spikes/fetch-sources.mjs` does one fetch round and exits 0. It creates a new folder under `spikes/samples/` holding these raw responses as received:
  - GDACS filtered and unfiltered;
  - the Twelve Data quote for all 6 instruments;
  - the Event Registry event search.

  For each source it prints one line with the source name, `ok`, `failed` or `skipped`, the item count, and the age of the newest item at fetch time.
- AC-2: For each GDACS event, the output shows these fields, or `missing` for any absent field:
  - event type and id, `country`;
  - `alertlevel`, `episodealertlevel`, `episodeid`;
  - the severity text from `severitydata`;
  - `fromdate`, `datemodified`, `url.report`.
- AC-3: For each of SPY, QQQ, EUR/USD, BTC/USD, GLD and USO, the output shows `close`, `previous_close`, `change`, `percent_change`, the quote time and `is_market_open`. If one symbol returns an error, the output shows that symbol's error message, and the other symbols still print.
- AC-4: Removed (P-087). It covered RSS feeds and Google News.
- AC-5: The output lists the Event Registry events sorted by article count, highest first. Each line shows the rank, article count, title, event date, location and event id, with `missing` for any absent field. The output also prints how many Event Registry requests the run made. That count is 1 for a single run, and the saved samples show the same number of requests.
- AC-6: `node --env-file-if-exists=.env spikes/fetch-sources.mjs --watch` runs 4 rounds one minute apart and finishes within 5 minutes.
  - Its saved samples are numbered by round.
  - From round 2 on, the output reports for each source what changed since the previous round. If nothing changed, it says so. Changes are:
    - new GDACS events or episodes, or a changed `datemodified`;
    - changed quotes;
    - new Event Registry events, or changed article counts.
  - It never makes more than 6 Twelve Data credits of calls within any minute.
  - It makes at most 4 Event Registry requests.
- AC-7: If `TWELVE_DATA_API_KEY` or `EVENT_REGISTRY_API_KEY` is unset, the output says `skipped: <NAME> not set` for that source, and the run continues and exits 0. The same holds when there is no `.env` file at all.
- AC-8: If a source returns a network error, a non-2xx status or a body that cannot be parsed, the output shows the source name and the status or error. The other sources still run, and the process exits 1.
- AC-9: After a run, `git status --porcelain` lists nothing under `spikes/samples/`. `git check-ignore spikes/samples/any` succeeds. Searching `spikes/samples/` for either key's value finds nothing, because saved request URLs, bodies and headers are redacted. Neither key appears in printed output.
- AC-10: `package.json` and `package-lock.json` are unchanged. Every import in `spikes/` is a relative path or a `node:` module.
  - No AI or LLM service is called: no file under `spikes/` (outside `spikes/samples/`) contains `generativelanguage` or `GEMINI`.
  - No RSS feed or Google News is fetched: no such file contains `rss`, `bbci`, `theguardian`, `aljazeera` or `news.google`.
- AC-11: `feature-design/local-demo/findings/data-sources.md` exists and, for each of GDACS, Twelve Data and Event Registry, covers:
  - the fields returned;
  - how significance is shown;
  - how updates and duplicates show up;
  - how fresh the data is;
  - the limits and terms of free use, each with the URL it came from, marked as either seen in the samples or read on that page. This covers:
    - GDACS CC BY 4.0, the credit to GDACS, and the not-an-official-warning note;
    - Twelve Data's non-display limit as a blocker for later phases;
    - Event Registry's free plan (2,000 searches, non-commercial, last 30 days), with Section 5 noted as read by the user.

  For Event Registry, the note also cites the docs pages and SDK READMEs the endpoint and parameters were checked against.

  It also has a short record of the earlier news trial:
  - the Guardian clause ("machine learning and/or artificial intelligence technologies … to synthesise or combine with any other data or content", without written approval) and the Al Jazeera §6 clause ("text or data mining"), quoted, each with its URL;
  - that the earlier runs, before P-083, sent Guardian and Al Jazeera headlines and summaries to Gemini twice;
  - that the Gemini step (P-086) and then the RSS feeds and Google News (P-087) were removed.
- AC-12: The findings note has a table for each of GDACS, Twelve Data and Event Registry mapping FR-06's items (what happened, where and when, significance, why it was sent, source link) to the fields that fill them. It names any item the source cannot fill. It contains no message wording.
- AC-13: For each kind, the findings note proposes 2 or 3 candidate bars, aiming for "a few a day" in total across the three kinds. News bars are thresholds on Event Registry's article count per event, and rest on Event Registry data alone. Each bar comes with a rough estimate of volume per day or week and the reasoning behind it, and states how weak that estimate is with no history and a 3-minute watch.
- AC-14: The findings note:
  - records how the 4 rounds at 1-minute intervals were run, with dates and times in UTC;
  - recommends a source setup for each kind for the user to confirm;
  - says whether the evidence supports proposing a revision of DEC-04, DEC-05, DEC-26 or PM-15 before M3. It presents this as a proposal only, with no change to the spec.
- AC-15: `git diff --stat` shows no change to `feature-design/local-demo/product-spec.md` or `feature-design/local-demo/roadmap.md`.

## Verification

- Command: `node --env-file-if-exists=.env spikes/fetch-sources.mjs`, then `node --env-file-if-exists=.env spikes/fetch-sources.mjs --watch`. Then run:
  - the AC-7 key-unset case: `env -u TWELVE_DATA_API_KEY -u EVENT_REGISTRY_API_KEY node spikes/fetch-sources.mjs`;
  - the AC-9 checks: `git status --porcelain` and `git check-ignore spikes/samples/any`;
  - the AC-10 check: `grep -rniE "generativelanguage|GEMINI|rss|bbci|theguardian|aljazeera|news\.google" spikes/ --exclude-dir=samples`, which should find nothing.
- Success: the output and saved samples match AC-1 to AC-10, apart from AC-4, which is removed. Each command exits as AC-1, AC-7 and AC-8 describe. Reading `feature-design/local-demo/findings/data-sources.md` confirms AC-11 to AC-14, and `git diff --stat` confirms AC-15. There are no unit tests (roadmap Decisions).

## Decisions from the interview

All decided by the user in P-074 to P-078, after the main session checked the sources live with them, unless a later prompt is named.

- **Natural disaster source:** GDACS only, with a filtered and an unfiltered call. CC BY 4.0, credit GDACS, may note it is not an official warning. **Override:** I recommended GDACS plus USGS.
- **Market source:** Twelve Data only, for SPY, QQQ, EUR/USD, BTC/USD, GLD and USO. Its internal non-display terms are accepted for the local trial, and display use is flagged as a blocker for later phases. **Override:** I recommended Finnhub plus Twelve Data. The instrument list is as I recommended.
- **News source (first answer):** BBC World, Guardian World and Al Jazeera RSS, grouped and rated by Gemini Flash-Lite, with Google News as the baseline. **Override:** I recommended GDELT plus the Guardian Open Platform API. Amended by P-083 and replaced by P-086 and P-087, below.
- **Severity rubric:** a three-level rubric was drafted for the Gemini step and approved. Since P-086 it is kept on file under [Severity rubric (unused)](#severity-rubric-unused), but not used in M1.
- **Non-commercial free tiers:** acceptable, as I recommended.
- **Keys:** keys go in the gitignored `.env`, and a missing key skips its source with a clear message, as I recommended. Since P-086 the keys are `TWELVE_DATA_API_KEY` and `EVENT_REGISTRY_API_KEY`. `GEMINI_API_KEY` is removed.
- **Samples:** gitignored, and only the findings note is committed. **Override:** I recommended committing samples, with news cut down to headlines and metadata.
- **Observation:** a watch of about 3 minutes ("Try 3 minutes."), with no history fetch from any source ("Drop the planner idea of fetching history"). **Override:** I recommended at least 3 runs over at least 2 hours, plus about 30 days of history.
- **Volume target:** "a few a day" in total, with 2 or 3 candidate bars per kind, each with a rough volume estimate and a note on how weak it is. **Override:** I recommended about one a day in total. The 2 or 3 candidate bars are as I recommended.
- **Dependencies:** none. Built-in `fetch` only. As I recommended.
- **Wording:** map fields to FR-06 only, with no wording. As I recommended.
- **Choosing bars and sources:** the user settles OQ-01 and confirms each kind's source at the walkthrough, from the findings. As I recommended.
- **AI-use terms block (P-083), decided by the user:**
  - The executor found during the build that the Guardian's terms forbid processing its content, RSS included, with ML or AI "to synthesise or combine with any other data or content" without written approval, and that Al Jazeera's terms (§6) forbid "text or data mining". The BBC's terms could not be read.
  - The user stopped sending Guardian and Al Jazeera content to Gemini and limited Gemini to a `NEWS_LLM_FEEDS` constant, BBC only.
  - Claude looks up news APIs whose terms allow AI processing, for M3 to choose from. That lookup is outside this spec's acceptance criteria.
  - Superseded by P-086 and P-087.
- **Event Registry replaces the LLM step (P-086), decided by the user:**
  - The user's words: "If we go with Event Registry and we get significance, we don't need AI. Term 5 allows use inside own products." The user read Section 5 of the terms themselves.
  - News importance comes from Event Registry's event API, with the article count per event as the signal. Free plan: 2,000 searches, non-commercial, last 30 days. Key `EVENT_REGISTRY_API_KEY`, added by the user.
  - The executor checks the endpoint and parameters against Event Registry's docs and SDK READMEs and cites them. Requests are kept to a handful per run.
  - The Gemini step is removed entirely: its code, the use of the rubric, `GEMINI_API_KEY` and its ACs. This supersedes the P-083 `NEWS_LLM_FEEDS` approach.
  - News bars are thresholds on Event Registry's article count per event.
- **RSS feeds and Google News dropped (P-087), decided by the user.**
  - The user's words: "Don't keep the RSS feeds and Google news."
  - M1's news is Event Registry only. The BBC, Guardian and Al Jazeera RSS and the Google News baseline are removed, with AC-4 and every findings requirement that depended on them.
  - News bars rest on Event Registry alone.
  - This overrides two calls made after P-086: the plan to keep fetching and counting the RSS feeds, and Claude's tier-two call to compare Event Registry with Google News by ranks and counts.
- **Event Registry window (P-091), decided by the user:** events dated the current or the previous UTC day, at most about 48 hours. Event Registry dates events by whole day, so "roughly the last 24 hours … never older" could not be met exactly. This is still current data, not a history fetch. It replaces Claude's tier-two call of about the last 24 hours.

Tier two, decided by Claude:

- **Cadence:** 4 rounds at 0, 1, 2 and 3 minutes. This covers the 3 minutes and keeps Twelve Data at 6 of its 8 credits a minute.
- **Event Registry budget:** one search per round, so 1 per single run and 4 per watch. That meets "a handful per run", and the watch still shows article counts growing.
- **Event Registry window:** superseded by the user's decision in P-091, above. It was about the last 24 hours only.
- **Record of the earlier news trial kept in the findings (AC-11):** the quoted Guardian and Al Jazeera clauses, and the fact that their content was sent to Gemini twice. These are facts about runs that already happened, not about sources M1 still uses.
- **Removed ACs keep their numbers:** AC-4 is marked removed rather than renumbered, so earlier references to AC numbers stay valid.
- **Command flag:** `--env-file-if-exists` instead of `--env-file`. Node stops with an error when an `--env-file` is missing, which would break AC-7's no-`.env` case.
- **Exit codes:** 1 if any source failed, 0 if sources were only skipped. A failure stays visible, and a missing key is an expected setup state.
- **Layout:** samples in `spikes/samples/<run timestamp>/`, and the findings note at `findings/data-sources.md`. One folder per run keeps the runs apart, and the note is named after what it covers.
- **Files:** `.mjs` with one module per source behind one runner. `spikes/sources/news-rss.mjs` and `spikes/sources/gemini-group.mjs` are deleted. `package.json` is CommonJS, `.mjs` allows top-level `await`, and `package.json` stays untouched.
- **Rubric kept in this spec:** the spec may not have been committed, so git history alone might not keep the rubric.

## Severity rubric (unused)

Approved for the Gemini step, and unused in M1 since P-086. It is kept on file for reference only.

- **3, Major.** A development with large-scale or international consequences that a busy professional would want to be interrupted for. Examples:
  - war breaking out, or a major escalation between states;
  - a mass-casualty attack or disaster (dozens of deaths or more);
  - an unscheduled change of head of state or government (death, coup, resignation);
  - a systemic financial or economic shock;
  - a disaster or industrial accident that triggers an international response.
- **2, Notable.** A significant national-level development with likely international interest, but not interrupt-worthy. Examples:
  - national election results;
  - major policy or court decisions;
  - a notable turn in an ongoing conflict;
  - a deadly incident with a limited toll;
  - major company news at national scale.
- **1, Routine.** Everything else. This includes:
  - incremental updates to ongoing stories;
  - analysis, explainers, features and opinion;
  - local news, sport, culture and human-interest stories.
