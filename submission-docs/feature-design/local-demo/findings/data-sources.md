# Findings: data sources (M1)

Spec: [`../milestones/01-try-the-data-sources.md`](../milestones/01-try-the-data-sources.md). Scripts: [`spikes/`](../../../../spikes/README.md). The raw samples stay local in `spikes/samples/` (gitignored).

This note is for settling OQ-01 and confirming each kind's source at the walkthrough. It maps fields to FR-06 and proposes bars. It contains no message wording (DEC-23, OQ-07).

The M1 sources are GDACS (natural disasters), Twelve Data (markets) and Event Registry (breaking news). No AI or LLM step is used. The earlier news trial, with three feeds and an AI grouping step, was dropped; it is recorded under [Record of the earlier news trial](#record-of-the-earlier-news-trial).

**How much to trust it.** Everything comes from one afternoon (Wednesday 2026-11-04, the day after the US midterms, which made it a heavy news and markets day) and a 3-minute watch. A 3-minute watch shows the *shape* of the data. It says almost nothing about how often items update, repeat, or arrive. Every volume estimate below is marked with how weak it is.

Labels used for terms and limits: **[sample]** = seen in our saved responses; **[page]** = read on the linked page on 2026-11-04; **[user]** = read by the user; **[spec]** = taken from the spec and not re-read.

## Runs

Current setup (GDACS, Twelve Data, Event Registry):

| Run | Command | Rounds (start, UTC) | Result |
|---|---|---|---|
| S | `node --env-file-if-exists=.env spikes/fetch-sources.mjs` | 1: 2026-11-04 18:35:50 | all sources `ok`, 1 Event Registry request, exit 0 |
| W | `node --env-file-if-exists=.env spikes/fetch-sources.mjs --watch` | 1: 18:36:00.9, 2: 18:37:00.9, 3: 18:38:00.9, 4: 18:39:00.9; done 18:39:04.8 | all sources `ok` in every round, 4 Event Registry requests, exit 0, 184 s |
| U | `env -u TWELVE_DATA_API_KEY -u EVENT_REGISTRY_API_KEY node spikes/fetch-sources.mjs` | 1: 18:35:43 | `twelvedata` and `eventregistry` `skipped: <NAME> not set`, exit 0 |

In run W the Twelve Data calls were 61.0 s apart (from `run.json`), and every response said 6 credits used and 2 left for that minute.

Earlier runs, kept because the GDACS and Twelve Data sections below cite them (same GDACS and Twelve Data code):

| Run | Rounds (start, UTC) | Result for GDACS and Twelve Data |
|---|---|---|
| A (single) | 1: 2026-11-04 17:57:00 | both `ok` |
| B (watch) | 1: 17:58:05.7, 2: 17:59:05.7, 3: 18:00:05.7, 4: 18:01:05.7 | `gdacs-all` failed in round 3 with a real `ECONNRESET`; all other calls `ok`; Twelve Data calls 61.0 s apart |

## Natural disasters: GDACS

**Fields returned** [sample]. A GeoJSON `FeatureCollection`. Each feature's `properties` has `eventtype` (EQ, TC, FL, VO, DR, WF), `eventid`, `episodeid`, `eventname`, `name`, `description`, `htmldescription`, `alertlevel` + `alertscore`, `episodealertlevel` + `episodealertscore`, `severitydata {severity, severitytext, severityunit}`, `country`, `iso3`, `affectedcountries[]`, `fromdate`, `todate`, `datemodified`, `iscurrent`, `istemporary`, `source` (e.g. JTWC), `glide`, and `url {report, details, geometry}`. The geometry gives a point.

**What the calls return** [sample]. Both calls returned the same 83 events: 65 Orange, 18 Red, **no Green**. So the unfiltered call does not add Green events; it seems to default to Orange/Red. The list reaches back to `fromdate` 2025-05-21 (long droughts) and only 1 of 83 has `iscurrent: "true"`, so it is a list of recent Orange/Red events, not of active ones. Whether the list is cut by a time window or a count is not known.

**How significance is shown** [sample]. `alertlevel` (Green/Orange/Red) is the event's overall level; `episodealertlevel` is the latest episode's level and can be lower (TC 1001338: event Red, latest episode Green). `severitytext` uses each hazard's own measure: magnitude and depth for EQ, wind speed for TC, area for DR (km²) and WF (ha). It is **empty for all 7 volcanoes** and reads "Magnitude 0" for floods, so for VO and FL the alert level is the only significance there is.

**Updates and duplicates** [sample]. An event is `eventtype` + `eventid`. Updates come as a new `episodeid` (TC 1001346 is on episode 10, DR 1018332 on 26) and a new `datemodified`. In the watch, nothing changed in 3 minutes. In run A, 6 of 83 events had `datemodified` in the previous 24 hours, mostly long droughts and old cyclones being re-modelled, so **`datemodified` alone is not "something new happened"**. No duplicate events were seen across `eventid`s; that would need a longer look.

**Freshness** [sample]. The newest `datemodified` was 6 to 10 minutes old. Dates carry no zone; the script reads them as UTC. That GDACS publishes in UTC is an assumption to check.

**Terms and limits.**
- Reuse is CC BY 4.0: "reuse is allowed, provided appropriate credit is given and changes are indicated", under the Commission Decision of 12 December 2011 [page: <https://commission.europa.eu/legal-notice_en#copyright-notice>, linked as "Copyright" from the GDACS footer, <https://www.gdacs.org/About/overview.aspx>].
- Credit GDACS [page, same CC BY 4.0 notice].
- Not an official warning: "GDACS services are not meant to substitute nor to override any official information or alert message"; EQ, TS and TC notifications are "produced by algorithms and not reviewed by human experts" [page: <https://www.gdacs.org/About/termofuse.aspx>]. Recorded for OQ-07.
- No key and no published rate limit found. One run of 8 calls hit one `ECONNRESET`, so M3 needs a retry rule (a tier-one question for M3).

**FR-06 mapping**

| FR-06 item | Filled by |
|---|---|
| What happened | `eventtype` + `name` (e.g. "Tropical Cyclone MURASU-26") |
| Where and when | `country` / `affectedcountries`, point geometry; `fromdate`, `todate` |
| Significance, in its own measure | `alertlevel` / `episodealertlevel` plus `severitytext`. **Cannot fill** a hazard measure for VO (empty) or FL ("Magnitude 0"): only the alert level |
| Why it was sent | The bar that fired, applied to `alertlevel` / `episodealertlevel` / `eventtype` (the product supplies this, not GDACS) |
| Source link | `url.report` |

## Markets: Twelve Data

**Fields returned** [sample]. One batch call for 6 symbols returns an object keyed by symbol. Each quote has `symbol`, `name`, `exchange`, `mic_code`, `currency`, `datetime`, `timestamp`, `last_quote_at`, `open`, `high`, `low`, `close`, `volume`, `previous_close`, `change`, `percent_change`, `average_volume`, `is_market_open`, `fifty_two_week {...}`. A bad symbol comes back in its slot as `{code, message, status: "error"}`; the script prints that symbol's error and the others still print (checked with a fake response). A bad key or rate limit comes back as **HTTP 200** with `status: "error"`, so the script checks the body, not only the status.

**How significance is shown** [sample]. `percent_change` against `previous_close`. Run A: USO −8.68%, BTC/USD +3.80%, GLD +3.71%, SPY +1.89%, QQQ +1.58%, EUR/USD +0.42%. There is no volatility or "unusual move" field; the bar has to bring its own scale per instrument.

**Updates and duplicates** [sample]. `datetime` / `timestamp` is **the start of the daily bar, not the quote time**: 14:30 UTC for the US ETFs, 20:00 UTC the day before for EUR/USD, 00:00 UTC for BTC/USD. The real quote time is `last_quote_at`, which moved by about 60 s each round. `close` and `percent_change` changed every round for 5 of 6 symbols. So a market "event" is not given by the source: the product must define it (for example one instrument crossing its bar on one trading day), and FR-05's "at most one message per event" depends on that definition. That is a tier-one question for M3.

**Freshness** [sample]. `last_quote_at` was 7 to 60 s old. `is_market_open` was `true` for all six at 18:00 UTC.

**Terms and limits.**
- Free plan: 8 credits a minute [sample: response headers `api-credits-used: 6`, `api-credits-left: 2`], 800 a day [page: <https://twelvedata.com/pricing>, "API requests: 8 (800 a day)"]. One symbol costs one credit [sample: 6 used for 6 symbols].
- Polling every minute would use all 800 daily credits in about 2.2 hours at 6 credits a round. Polling every 5 minutes uses 1,728 a day, more than twice the limit. **A 24-hour poll fits only at about one round every 11 minutes or less often.**
- "Internal non-display usage" only [page: <https://twelvedata.com/pricing>]. The terms limit data to "Internal Use" and "Non-Display Use" and allow "external display of Data only if and as expressly authorized by a Redistribution Rights Add-On" (§2.2(a), (d), (e)), and forbid using "Free Tier data for commercial purposes" (§2.3(l)) [page: <https://twelvedata.com/terms>]. **A blocker for any later phase that displays prices to users**, and arguably already for the alert messages themselves once they leave the trial. Accepted for the local trial only, as the spec records.

**FR-06 mapping**

| FR-06 item | Filled by |
|---|---|
| What happened | `name` / `symbol` and the sign of `change` |
| Where and when | `exchange` / `mic_code` for where; `last_quote_at` for when (not `datetime`, which is the day) |
| Significance, in its own measure | `percent_change` (and `change`, `close`, `previous_close`) |
| Why it was sent | The bar that fired, applied to `percent_change` (product-supplied) |
| Source link | **Cannot fill.** The response has no URL. A link would have to be built to a public quote page, which raises the display terms above |

## Breaking news: Event Registry

**Request** [checked against the SDK source; the docs page renders by script and could not be read].
- The call is `POST https://eventregistry.org/api/v1/event` with a JSON body:
  - `action: "getEvents"`, `lang: "eng"`, `dateStart` (the previous UTC day), `dateEnd` (the current UTC day);
  - `resultType: ["events"]`, `eventsPage: 1`, `eventsCount: 50` (the maximum), `eventsSortBy: "size"`, `eventsSortByAsc: false`;
  - `includeEventTitle`, `includeEventDate`, `includeEventLocation`, `includeEventCategories` and `includeEventArticleCounts`, all true;
  - `includeEventSummary` and `includeEventConcepts`, both false;
  - `forceMaxDataTimeWindow: 31` and `apiKey`.
- Checked against:
  - <https://github.com/EventRegistry/event-registry-python/blob/master/eventregistry/QueryEvents.py> (`action` `getEvents`, path `/api/v1/event`, `lang`, `dateStart`/`dateEnd` "in YYYY-MM-DD format"; `RequestEventsInfo`: `eventsPage`, `eventsCount` "at most 50", `eventsSortBy` with "size (number of articles)");
  - <https://github.com/EventRegistry/event-registry-python/blob/master/eventregistry/ReturnInfo.py> (`EventInfoFlags`: the `includeEvent*` flags);
  - <https://github.com/EventRegistry/event-registry-python/blob/master/eventregistry/EventRegistry.py> (host `https://eventregistry.org`, a JSON POST with `apiKey` in the body, `forceMaxDataTimeWindow` 31);
  - the SDK READMEs at <https://github.com/EventRegistry/event-registry-python> and <https://github.com/EventRegistry/event-registry-node-js>;
  - the wiki pages <https://github.com/EventRegistry/event-registry-python/wiki/Searching-for-events> (sort options, "Max events that can be returned per call is 50") and <https://github.com/EventRegistry/event-registry-python/wiki/Data-models> (event fields).
- The documentation page <https://newsapi.ai/documentation?tab=searchEvents> renders by script and could not be read.
- The SDK was read only, never installed.

**Fields returned** [sample]. `events {results[], totalResults, page, count, pages}`. Each event has:
- `uri`, the event id, such as `eng-<number>`; the prefix is the language of the first article (eng, spa, fra, rus and ita were seen);
- `title`, one title per language (`title.eng` is used);
- `eventDate`, a day such as `2026-11-03`;
- `location {type, label, country}`, **absent for 12 of 50 events**;
- `categories[]`, with dmoz categories and one `news/<section>` category such as `news/Politics`;
- `totalArticleCount` and `articleCounts` per language;
- `sentiment`, `wgt` and `relevance`.

**How significance is shown** [sample]. Only as `totalArticleCount`, which counts articles in every language. The top 50 of the run ranged from 185 to 3,603 articles. Article count measures coverage, not importance:
- the top event in run S (2,156 articles) was a sports story;
- 13 of the top 50 were `news/Sports`, 25 `news/Politics` and 6 `news/Business`.

**Updates and duplicates** [sample, runs S and W].
- **Counts change every minute, in both directions.** One event went from 1,654 to 3,603 articles between rounds 2 and 3, which looks like a merge. Others fell: 1,176 to 1,117, and 424 to 352.
- **One story can have several event ids.** Two events in the top 3 had the same English title, with different ids and counts.
- **An event can be replaced by a new id.** One event (here, event A) left the top 50 under a `fra-` id in round 2 and came back under a new `eng-` id in round 3.
- **Big stories split into many events.** The US midterms appear as many separate events (results by state, analysis, market reactions).
- So "one Event Registry event = one story" does not hold, and an article-count bar can fire twice for one story.

**Freshness** [sample]. `eventDate` is a day, not a time: 43 of the top 50 were dated 2026-11-03 and 7 dated 2026-11-04. There is no event creation or update time in the response, so the script's "newest" age counts from midnight UTC of the newest date. The data itself was live: counts and the top 50 changed within each minute. Big events reach a high article count only some hours after they happen, so a threshold fires late. How late cannot be measured from 3 minutes.

**Terms and limits.**
- Free plan: "The free plan includes 2,000 searches" [page: <https://newsapi.ai/plans>].
- The same page says event searches cost 5 tokens for recent data [page]. Every response in runs S and W had `req-tokens: 5.000` and `x-ratelimit-limit: 2000`, and `x-ratelimit-remaining` fell 1995 → 1990 → 1985 → 1980 across the watch [sample]. So **the 2,000 appear to be tokens, which is about 400 event searches, not 2,000.** Polling once every 15 minutes would use them up in about 4 days. Whether they renew monthly was not found.
- Last 30 days: non-paying users "have access to only last 30 days of content" [page: <https://github.com/EventRegistry/event-registry-python> README].
- Non-commercial: "Free users are not allowed to use the obtained data for any commercial purposes" [page: <https://github.com/EventRegistry/event-registry-node-js> README]; "Non-paying users are not allowed to use the obtained data for any commercial purposes" [page: <https://github.com/EventRegistry/event-registry-python> README]. Both point to the Terms of Service for details. The plans page does not state it.
- Terms of service, Section 5 (use inside one's own products): [user, P-086], <https://newsapi.ai/terms>. That page renders by script and could not be read here.

**FR-06 mapping**

| FR-06 item | Filled by |
|---|---|
| What happened | `title.eng` |
| Where and when | Where: `location.label` + `location.country.label`. **Absent for 12 of 50**, and sometimes off (a Paraguayan bank story was placed in Ueno, Japan). When: `eventDate`, **a day only; no time of day** |
| Significance, in its own measure | `totalArticleCount` (and `articleCounts` per language) |
| Why it was sent | The bar that fired on `totalArticleCount` (product-supplied) |
| Source link | **Cannot fill** from this response: there is no URL. Getting article links would take another search per event (more tokens). An event page built from `uri` may exist on eventregistry.org, but that is not verified |

## Record of the earlier news trial

Kept as a record of runs that already happened. None of this is used in M1.

- **Setup.** The trial fetched BBC World, Guardian World and Al Jazeera RSS, used Google News top stories as a baseline, and sent the three feeds' headlines and summaries to Gemini Flash-Lite (free tier) to group them into stories and rate them on a severity rubric.
- **What was sent.** Before P-083, runs A (2026-11-04 17:57 UTC) and B (18:01 UTC) each sent the headlines and summaries of 93 items, from BBC, Guardian and Al Jazeera, to Gemini: **twice in all**, with no links.
- **The Guardian.** The terms cover RSS and say you shall not use Guardian Content "(c) with any machine learning and/or artificial intelligence technologies to generate any data or content or to synthesise or combine with any other data or content", without "prior written approval" [page: <https://www.theguardian.com/help/terms-of-service>].
- **Al Jazeera.** §6: "You shall not authorise, encourage, permit or assist any unauthorised copying, text or data mining, or web scraping" [page: <https://www.aljazeera.com/terms-and-conditions>].
- **BBC.** The full terms could not be read here; the user checked them and reported they do not allow AI use either (P-085).
- **What changed.** The user stopped sending Guardian and Al Jazeera content (P-083), then the BBC too (P-085). The Gemini step was removed (P-086), and then the RSS feeds and Google News were removed (P-087).

## Candidate bars per kind

Target: "a few a day" in total across the three kinds. **Every estimate below rests on one afternoon and a 3-minute watch, with no history.** The GDACS estimates use the dates on the 83 events in the list, which only covers events still listed. The market estimates use general knowledge of typical daily moves, not our samples, because one sample day is not a rate. Read them as orders of magnitude.

### Natural disasters (GDACS)

An event is `eventtype` + `eventid`; it fires once (FR-05), when it first clears the bar on either `alertlevel` or a new episode's `episodealertlevel`.

| Bar | Rough volume | Reasoning and weakness |
|---|---|---|
| D1: Red only | ~0.7 a week | 3 Red events started in the last 30 days in the list (all cyclones); 18 Red in about 18 months overall. Weak: 30 days of one list, one season |
| D2: Red, or Orange for EQ and TC | ~2 a week | 8 events in the last 30 days (3 TC Red, 3 EQ Orange, 2 TC Orange). Leaves out slow hazards (drought, flood, fire), whose Orange alerts last for months. Weak, same basis |
| D3: Red or Orange, any hazard | ~2–3 a week plus long-running DR/FL/WF events | 10 started in the last 30 days, but 38 of 83 listed events are DR, FL or WF that stay Orange for weeks. Weak, and VO/FL have no severity measure to show |

### Markets (Twelve Data)

An event needs a product definition (proposed: one instrument crossing its bar on one trading day, measured by `percent_change` against `previous_close`). Thresholds are per instrument because their usual moves differ by about 10×.

| Bar | SPY / QQQ | EUR/USD | BTC/USD | GLD | USO | Rough volume (all six) | Today (run A) would fire |
|---|---|---|---|---|---|---|---|
| M1: loose | ±2% | ±0.8% | ±5% | ±2% | ±4% | ~1–2 a week | GLD, USO |
| M2: middle | ±3% | ±1.2% | ±8% | ±3% | ±6% | ~2–4 a month | GLD, USO |
| M3: strict | ±4% | ±1.5% | ±10% | ±4% | ±8% | ~0–2 a month | USO |

Reasoning: SPY moves 2% or more on a few to a dozen-plus days a year depending on the year; BTC moves 5% often; USO is the most volatile ETF here. These rates are general knowledge, not seen in our samples. Weak: no history was fetched (by the user's choice), and one post-election day is not typical.

### Breaking news (Event Registry)

The bars are thresholds on `totalArticleCount` for one event, from Event Registry data alone. The counts below are from run S: the top 50 English events dated 2026-11-03 or 2026-11-04, out of 3,231. The window is the current and previous UTC day; at 18:36 UTC on 11-04 that covered about 1.8 days of events.

| Bar | Events in the window | Rough volume | Reasoning and weakness |
|---|---|---|---|
| N1: ≥ 1,000 articles | 4 (2 of them the same story under two ids; 1 a sports story) | ~1–2 a day | Few and big. Weak: the count is cross-language and favours sport and celebrity stories, and the day after a US election is not typical |
| N2: ≥ 500 articles | 7 | ~3–4 a day | Close to "a few a day" by itself. Includes more duplicates and more sport. Weak, same basis |
| N3: ≥ 300 articles | 18 | ~8–10 a day | Too many with the other kinds. Weak |

Every count is a snapshot of numbers that were still moving (one event doubled in a minute, others fell), and events reach these counts hours after they happen. **One snapshot plus a 3-minute watch with no history** is all this rests on.

**Combined:** D2 (~2 a week) + M2 (~2–4 a month) + N1 (~1–2 a day) is roughly 1.5–2.5 a day, inside "a few a day". Duplicate events per story would push it up unless they are merged (see DEC-26 below).

## Recommended source per kind (for the user to confirm)

- **Natural disasters: GDACS alone, as planned.** Terms fit (CC BY 4.0 with credit), significance is built in, events and episodes are clear. Drop the unfiltered call in M3 (it returned the same Orange/Red list) unless a Green bar is wanted. Add a retry rule (one `ECONNRESET` in 8 calls).
- **Markets: Twelve Data for the local demo only.** It works, and 6 symbols in one call fit the free tier at one round per ~11 minutes for 24 hours. Its non-display, non-commercial terms are a **blocker** for anything beyond the local trial, and it gives no source link for FR-06.
- **Breaking news: Event Registry, with care.** It gives a ready importance signal (article count) without any AI step, and the user has read its terms (Section 5). Three things to settle before M3:
  - **Token budget.** About 400 event searches on the free plan, 5 tokens each; this needs a polling interval (a tier-one rule).
  - **Duplicates.** One story shows up as several events, and ids change.
  - **No source link** in the event response, for FR-06.

  Article count also rewards sport and celebrity coverage. A filter on the `news/<section>` category is possible but is a business rule for the user. This is a recommendation for the user to decide, not a decision.

## Do the findings support revising DEC-04, DEC-05, DEC-26 or PM-15?

A proposal only. `submission-docs/feature-design/local-demo/product-spec.md` is unchanged; any change goes through `/design revise`.

- **DEC-04 (product decides, user picks no level):** no revision suggested.
- **DEC-05 (bars set from the data):** no revision suggested. Every bar above is a product-defined threshold on a source field.
- **DEC-26 (one source per kind; one source item, with its updates, is one event):** **the evidence supports proposing a revision for news.** Event Registry, the one news source, returned one story under two event ids, replaced an event with a new id, and split the US midterms into many events. So "one item = one event" would send several alerts for one story, and FR-05's "at most one message per event" would not stop that. Disasters and markets fit DEC-26 as it is.
- **PM-15 (merging separate items about one story, deferred):** **the evidence supports proposing to bring a simple form into scope for news**, such as treating events with the same English title, or an id that replaces another, as one. A high bar (N1) keeps the problem small but does not remove it: 2 of the 4 events at 1,000+ articles were one story.

If the user takes this up, the revision would be proposed before M3 through `/design revise product-spec`.

## M3 live run

Run by the user on 2026-11-04 at about 23:03 UTC, the time of the three `last checked` lines below. The run follows the spec's shortened steps (P-168).

**Commands**

1. `SOURCE_MODE=live npm run poll:once`
2. `SOURCE_MODE=live npm start`, left running briefly, then `http://127.0.0.1:3000/admin` opened. All three sources had just been checked, so the startup poll skipped them and made no further live call.

**`poll:once` output**

```
gdacs ok 83 items, 1 made the cut
twelvedata ok 6 items, 2 made the cut
eventregistry ok 50 items, 5 made the cut
```

**Source status lines on `/admin`**

```
GDACS: last checked 2026-11-04 23:03:35 UTC
Twelve Data: last checked 2026-11-04 23:03:36 UTC
Event Registry: last checked 2026-11-04 23:03:37 UTC
```

**Events per kind.** The main session read these from `data/app.db` (read-only) after the run. They match the `poll:once` lines.

| Kind | Rows | Made the cut |
|---|---|---|
| Disaster | 83 | 1 |
| Market | 6 | 2 |
| News | 50 | 5 |

Event Registry `ratelimit_remaining` after the run: 1975.

**Failures.** None. All three sources returned `ok`.

**Not covered here.** The 60-minute run of the scheduled polls is deferred to M5's live run (P-168). During the build, the scheduled tasks were seen to fire on samples.
