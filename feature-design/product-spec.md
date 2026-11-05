Status: approved
Version: 7
Updated: 2026-11-05

# Product spec: world event alerts

## Problem

A professional wants to hear right away when something important happens in the world, without watching the news all day. Generic news apps notify too often and too vaguely. They want few alerts, each one clearly worth reading, delivered where they already work: email and Slack.

## Phase 1: the local demo

The first phase is a local demo that is never deployed publicly. It covers one journey from start to finish, using real event data and real email and Slack delivery. Its purpose is to learn how the data and the delivery services behave, so that later plans rest on evidence. It does not cover every journey or edge case. Anything it leaves out is listed under [Post-MVP](#post-mvp) or [Open questions](#open-questions), not left undefined.

The demo covers three kinds of event: breaking news, market movements and natural disasters (DEC-22).

The demo journey (J-01):

1. The demo user opens the app and sets up their alert, choosing email, Slack or both. The alert covers all three kinds of event.
2. A real event happens that clears the importance bar for its kind.
3. The alert arrives on each chosen channel, once.
4. The admin opens the admin view and sees the event come in, the alert fire, and whether each delivery succeeded or failed, and why.

## Users and roles

| Role | Who | Their job | What they never see |
|---|---|---|---|
| Demo user | One pre-set person with a known email address and Slack account | Set up their alert, pick channels, change or delete it | Other users, delivery internals, events that did not clear the bar |
| Admin | One pre-set operator | Watch what came in, what fired, and what was delivered, for each kind of event | The user's email address, Slack webhook URL and message content (DEC-31). Nothing to change: the admin view is read-only |

The two roles have separate screens. No user screen shows admin information, and the admin view has no user settings.

## Scope

### User

- **FR-01 Set up the alert.** The user sets up their alert and picks channels: email, Slack or both. The alert covers breaking news, market movements and natural disasters. The user sets nothing else, because the product decides what is important (DEC-04). At least one channel must be picked before the alert can be saved. Each user has one alert (DEC-17).
- **FR-02 See the alert.** The user sees their alert, the kinds of event it covers, its channels, and the email address and Slack account it delivers to. Before any alert exists, the screen offers to set one up. If saving fails, the user is told plainly and their choice is kept.
- **FR-03 Change channels.** The user can change the channels on an existing alert.
- **FR-04 Removed in v2.** Pause was dropped (DEC-18). Changes are made only on the site, through FR-03 and FR-11.
- **FR-05 Receive alerts.** When an event of any of the three kinds clears its kind's bar, an alert goes to every channel the user picked, at once. One event produces at most one message per channel, ever. Later updates to the same event send nothing new (DEC-07, DEC-26).
- **FR-06 Trust what arrives.** Every message says:
  - what happened,
  - where and when, if available and appropriate.

  Disaster messages also carry a short credit naming the disaster source, such as "Source: GDACS", because that source's licence requires credit. Messages carry nothing else. Their exact wording depends on the data source and is not yet written (DEC-23, DEC-28, OQ-07).
- **FR-11 Delete the alert.** The user can delete their alert on the site after confirming. From then on nothing is sent, and the screen returns to the no-alert state, so the user can set one up again (DEC-19, DEC-21). If the delete fails, the user is told and the alert stays as it was.

### Admin

- **FR-07 Events in.** The admin sees every event received, for all three kinds, newest first, with its kind and whether it made the cut for that kind's bar (DEC-14). For disasters, the admin also sees whether the source marks the item as current (DEC-30). A market event is one instrument's trading day (DEC-29). Separate items that report the same story stay visible as separate rows, so duplicates can be seen and counted (DEC-26).
- **FR-08 Alerts fired.** For each event that made the cut, the admin sees whether an alert was sent, or why not (for example, no alert was set up at the time). The admin never sees the user's email address, the Slack webhook URL or the message content (DEC-31).
- **FR-09 Deliveries.** For each alert sent, the admin sees each channel's outcome, delivered or failed, with the reason for any failure. Failed deliveries are not retried (DEC-20). The admin sees only outcomes and failure reasons, never the user's email address, the Slack webhook URL or the message content (DEC-31).
- **FR-10 Admin states.** Before any data has arrived, the view says it is waiting for the first event and when each kind's source was last checked. If a source cannot be reached, the view says which one and when it last succeeded.

## Non-goals for this phase

Public deployment, sign-up and login, more than one user, kinds of event beyond the three, the user choosing which kinds to follow, channels other than email and Slack, user-set importance or location filters, digests or caps, pausing an alert, retrying failed deliveries, merging separate items about one story, and admin actions that change anything. Each deferred option is listed under Post-MVP.

## Glossary

- **Kind of event:** one of breaking news, market movements or natural disasters.
- **Event:** one item from a kind's single data source, including its later updates (DEC-26). For news, one news story. For markets, one instrument's trading day (DEC-29). For disasters, every item the source lists, whether or not it is marked current (DEC-30). Separate items about the same story are separate events for now (PM-15).
- **Importance bar:** the product-defined test an event must pass to be alerted on. There is one bar per kind of event, the same for every user (DEC-05, DEC-22). It is internal and is not shown in messages (DEC-28).
- **Alert:** the user's standing instruction: "tell me about important events on these channels". Each user has one at most, and it covers all three kinds.
- **Message:** what one alert sends about one event on one channel: what happened, and where and when if available and appropriate (FR-06).
- **Delivery:** one attempt to send a message, which ends as delivered or failed, with a reason.
- **Channel:** a place messages go. In this phase, email or Slack.

## Wording users see

None is drafted yet. All wording users see depends on the data source and is open (OQ-07). That covers messages, in-app text, error messages and the delete confirmation. What each message must carry is fixed by FR-06.

## Open questions

- **OQ-01 Coverage and importance bar per kind.** Closed: one bar per kind, set from the M1 findings, and each kind covers what its source reports, filtered by that bar (DEC-27).
- **OQ-02 One alert or several.** Closed: one alert per user (DEC-17).
- **OQ-03 Events during a pause.** Closed: there is no pause (DEC-18).
- **OQ-04 What pause stops.** Closed: there is no pause (DEC-18).
- **OQ-05 Removing the alert.** Closed: the user can delete it on the site (DEC-19, DEC-21).
- **OQ-06 Failed deliveries.** Closed: not retried, and shown to the admin with the reason (DEC-20).
- **OQ-07 Wording users see (tier one).** All message and in-app wording, written once the data sources are known, to carry FR-06's content: what happened, where and when if available and appropriate, and the disaster source credit. It comes back for approval (DEC-23, DEC-28).
- **OQ-08 What each kind covers.** Merged into OQ-01 (DEC-25).
- **OQ-09 When two reports are the same event.** Closed: one source per kind, and the same source item, including its updates, is one event (DEC-26). Merging separate items about one story is PM-15, and the admin view shows duplicates (FR-07).
- **OQ-10 Source gaps found in M1 (for M3).** The M1 findings found a gap M3 must handle: the news source's free allowance is finite, so how often it is checked is limited. Details are in the [findings](local-demo/findings/data-sources.md#recommended-source-per-kind-for-the-user-to-confirm).
- **OQ-11 Disasters marked as current (known risk, not resolved).** A disaster makes the cut only if the source marks it as current (DEC-30). In M1's sample only 1 of 83 listed disaster events was marked current, so very few disasters may alert. What "current" means at the source is not documented in the findings.

## Post-MVP

PM-01 to PM-03 were removed in v3, because all three kinds of event are now in the demo (DEC-22).

| ID | Deferred option | What the MVP does instead | From |
|---|---|---|---|
| PM-04 | User picks an importance level | One product-defined bar per kind | [DEC-04](#decisions) |
| PM-05 | Location filter | Events anywhere in the world | [DEC-06](#decisions) |
| PM-06 | Daily cap or digest | Instant, once per event, no cap | [DEC-07](#decisions) |
| PM-07 | Admin manages users and alerts | Admin view is read-only | [DEC-08](#decisions) |
| PM-08 | Admin tunes the importance bars. Agreed design: each kind shows its own measure, with no common significance score; each market instrument's threshold is edited separately; a changed bar applies only to events checked after the change; and each change is recorded with its time and its old and new values | Bars set by the team from the data | [DEC-05](#decisions), [DEC-08](#decisions), [DEC-32](#decisions) |
| PM-09 | Sign-up, login, many users | One pre-set user and one pre-set admin | [DEC-09](#decisions) |
| PM-10 | Teams and shared Slack channels | The user's own email and Slack | [DEC-01](#decisions) |
| PM-11 | More channels (for example SMS or push) | Email and Slack. The brief asks that channels can be added later | [DEC-12](#decisions) |
| PM-12 | Pause, from a link in the message or on the site | Change channels or delete the alert on the site | [DEC-18](#decisions) |
| PM-13 | Retrying failed deliveries | No retry, and the failure is shown to the admin | [DEC-20](#decisions) |
| PM-14 | User chooses which kinds of event to follow | The alert covers all three kinds | [DEC-22](#decisions) |
| PM-15 | Merging separate items, or items from several sources, that report one story | One source per kind. Each source item, with its updates, is one event, and the admin view shows the duplicates | [DEC-26](#decisions) |
| PM-16 | The admin sees one aggregated count per day of deliveries delivered and failed, in place of the per-delivery view | Alerts fired and each delivery's outcome, as in FR-08 and FR-09 | [DEC-33](#decisions) |
| PM-17 | News events that look like duplicates are merged. The news source can split one story into two events with different IDs and the same headline; in the M5 journey run (2026-11-05) that sent two identical alerts | Each source event ID is one event and fires once per channel | User in the M5 build: "Record, defer to Later". Extends [DEC-26](#decisions) |

## Decisions

| ID | Decision | Decided by | Reason |
|---|---|---|---|
| DEC-01 | The user is a single professional, and alerts go to their own email and Slack | user (P-059), as recommended | Simplest person to design for, and fully demoable |
| DEC-02 | The demo covers the full loop J-01, including the admin view | user (P-059), as recommended | The one path that tests real data and both channels |
| DEC-03 | ~~Earthquakes are the demo's only event type~~. Superseded by DEC-22 | user (P-059), as recommended | Superseded |
| DEC-04 | The product alone decides what is important. The user picks no level | user (P-059), **override**: I recommended product-defined levels with the user picking one | Setup asks only what the user can answer |
| DEC-05 | Product-defined bars, set from the data once seen. Now one bar per kind (DEC-22), set in DEC-27 | user (P-059), **override**: I recommended two earthquake levels, Major at M6.0+ or a tsunami or red warning, and Significant at M5.0+. Amended by P-063 and P-096 | Decide the bar from evidence, not a guess |
| DEC-06 | The user chooses channels only. No place filter | user (P-059), asked after DEC-04 | Nothing else in setup needs the user's knowledge |
| DEC-07 | Instant delivery, never the same event twice, no cap | user (P-059), **override**: I recommended a cap of 5 per alert per day | One bar and no repeats keep the volume low |
| DEC-08 | The admin only watches: events in, alerts fired, each delivery's outcome and reason | user (P-059), as recommended | Answers the demo's learning question and keeps the roles apart |
| DEC-09 | One pre-set demo user and one pre-set admin, with no sign-up or login | user (P-059), as recommended | Accounts teach the local demo nothing |
| DEC-10 | Every message carries what, where and when, ~~significance, why, and a source link~~. Its "way to pause" is superseded by DEC-18, its wording by DEC-23, and its significance, why and source link by DEC-28 | user (P-059), as recommended. Amended by P-060, P-063 and P-098 | The source and the reason earn trust |
| DEC-11 | "Important world events" means public, global events, not personal or company-internal ones | claude (reading of the brief) | Every example in the brief is public |
| DEC-12 | "Flexible enough to add channels later" is a design requirement. Only email and Slack ship | claude (reading of the brief) | The brief names two channels now and others "later" |
| DEC-13 | "Admin view" means an operator watching the system, not a user's settings page | claude (reading of the brief) | User settings are already covered by "set up alerts" |
| DEC-14 | The admin sees every event received, marked with whether it cleared its bar, not only those that fired | claude | Choosing the bars (OQ-01) needs the events below them in view |
| DEC-15 | Admin lists are newest first | claude | The admin's question is "what just happened" |
| DEC-16 | Message times are shown in the user's time zone with UTC alongside | claude | Local time is readable, and UTC matches the sources |
| DEC-17 | One alert per user | user (P-060), as recommended | With channels as the only setting, a second alert would duplicate the first |
| DEC-18 | No pause at all, neither a link in messages nor a toggle on the site. The alert can be changed only on the site. User's words: "Drop the link for now, make it only editable through the site." | user (P-060), **override**: I recommended a pause link that pauses both channels, with nothing queued while paused | Not stated |
| DEC-19 | The user can delete their alert on the site | user (P-060), **override**: I recommended no delete in this phase | Not stated |
| DEC-20 | Failed deliveries are not retried, and the admin sees each failure and its reason | user (P-060), as recommended | The demo is meant to show how the services fail |
| DEC-21 | Deleting removes the user's alert (its channel choice), and nothing more is sent. The admin view keeps every event, alert fired and delivery recorded before the delete. Setting the alert up again starts fresh and does not resend past events. The user confirms before the delete | claude | The admin history is the record of what was actually sent, which is what the demo exists to learn |
| DEC-22 | The demo covers breaking news, market movements and natural disasters, and the one alert covers all three. The product decides importance with one bar per kind. Supersedes DEC-03 | user (P-063), **override** of DEC-03: I recommended earthquakes only | User's words: "this will give us a fuller picture about the data we can work with with less things to pivot on later." |
| DEC-23 | No wording users see is drafted. It depends on the data source and is open (OQ-07) | user (P-063), **override**: I had drafted the wording for approval | User's words: "drop wording suggestion, make it dependent on the data source for now." |
| DEC-24 | ~~"How strong it was" (DEC-10) is read as each kind's own measure of significance, such as magnitude for a quake or the size of a market move~~. Superseded by DEC-28: messages no longer carry significance | claude | Superseded |
| DEC-25 | Each kind's coverage is decided together with its bar, from what its source offers. Settled in DEC-27: each kind covers what its source reports, filtered by its bar | user (P-064), as recommended. Settled by P-096 | Fits the aim of seeing the fullest picture of the data |
| DEC-26 | One source per kind. The same source item, including its updates, is one event. Merging separate items about one story is deferred (PM-15), and the admin view shows duplicates (FR-07) | user (P-064), as recommended | Learn how often duplicates actually arrive before designing the merge |
| DEC-27 | The importance bar per kind, closing OQ-01. **Natural disasters:** the UN/EU disaster alert service (GDACS) marks the disaster as current (DEC-30), and it reaches the top (Red) alert level, or the second (Orange) level for an earthquake or tropical cyclone. **Market movements:** one of six instruments moves in a day, against the previous close, by more than its threshold: S&P 500 ETF ±3%, Nasdaq-100 ETF ±3%, EUR/USD ±1.2%, Bitcoin ±8%, gold ETF ±3%, oil ETF ±6%. **Breaking news:** one news event is covered by 1,000 or more articles within the current and previous day, as counted by a news-event service (Event Registry). Each kind covers what its source reports, filtered by these bars. Together they aim at "a few alerts a day", roughly 1.5–2.5. The estimates are rough and the bars are expected to be tuned. Details: [findings, "Candidate bars per kind"](local-demo/findings/data-sources.md#candidate-bars-per-kind) | user (P-096). Amended by P-154 | Chosen from the M1 findings to keep the total near "a few a day" |
| DEC-28 | Messages carry only what happened, and where and when if available and appropriate. Significance, why it was sent and the source link are dropped. Exception: disaster messages carry a short credit naming the disaster source, such as "Source: GDACS". Supersedes DEC-24 and part of DEC-10 | user (P-098) | User's words: "significance is an internal value and source link is not available across all channels." The credit is kept because the disaster source's licence (CC BY 4.0) requires it |
| DEC-29 | A market event is one instrument's trading day, identified by the instrument plus the trading day. Every one is shown to the admin, marked with whether it cleared its bar. One instrument alerts at most once per trading day | user (P-154), reversing the user's own P-150 override of my recommendation | Keeps DEC-14 true for markets, so market bars can be judged from the admin view |
| DEC-30 | The admin sees every disaster item the source lists, marked with whether the source marks it as current. A disaster makes the cut only if it is marked current and reaches the alert level in DEC-27. Known risk, not resolved: see OQ-11 | user (P-154), as recommended, reversing the user's own P-150 override | Keeps DEC-14 true for disasters, while only current disasters alert |
| DEC-31 | In FR-08 and FR-09 the admin never sees the user's email address, the Slack webhook URL or the message content, only outcomes and failure reasons | user (P-154), as recommended | The admin needs outcomes, not the user's contact details or what they were sent |
| DEC-32 | Agreed design for PM-08, after the local demo: each kind shows its own measure, with no common significance score; each market instrument's threshold is edited separately; a changed bar applies only to events checked after the change; each change is recorded with its time and old and new values. The admin view stays read-only in the local demo (DEC-08) | user (P-154), as recommended | Each kind's measure means something on its own, and recorded changes keep past results explainable |
| DEC-33 | After the local demo, the admin sees one aggregated count per day of deliveries delivered and failed, in place of the per-delivery view (PM-16). The demo keeps FR-08 and FR-09 as they are | user (P-154), user's own proposal | Not stated |

## Change log

- v1 (2026-11-04): first draft, from the user's answers in P-059.
- v2 (2026-11-04): applied the user's answers in P-060. Closed OQ-02 to OQ-06. Removed pause (FR-04, the message pause line, the pause page and the pause labels). Added delete (FR-11, delete wording, DEC-21). Added PM-12 and PM-13 and DEC-17 to DEC-21.
- v3 (2026-11-04): applied the user's changes in P-063. All three kinds of event are now in the demo, with one bar per kind (DEC-22, superseding DEC-03). Updated the journey, roles, FRs, glossary and OQ-01 to match, removed PM-01 to PM-03, and added PM-14. Dropped all drafted wording (DEC-23) and added OQ-07. Added OQ-08 (what each kind covers), OQ-09 (when two reports are the same event) and DEC-24.
- v3 (2026-11-04, amended): applied the user's answers in P-064. Merged OQ-08 into OQ-01 (DEC-25). Closed OQ-09 (DEC-26). Added PM-15, and pointed OQ-09 and the glossary to it. FR-07 now makes duplicates visible.
- v4 (2026-11-04): applied the user's decision in P-096 from the M1 findings. Closed OQ-01 with the bar per kind (DEC-27), and pointed DEC-05 and DEC-25 to it. Added OQ-10 for the source gaps M3 must handle.
- v5 (2026-11-04): applied the user's decision in P-098 to simplify messages (DEC-28). FR-06 now carries only what happened, and where and when if available and appropriate, plus a source credit on disaster messages. Marked the removed parts of DEC-10, and all of DEC-24, as superseded. Removed the source-link gap from OQ-10, and updated OQ-07 and the glossary (importance bar, message) to match.
- v6 (2026-11-04): applied the user's decisions in P-154, made while M3 was specced. A market event is one instrument's trading day, alerting at most once per day (DEC-29). Disasters alert only if marked current and at the DEC-27 alert level, while the admin sees every listed item with its current mark (DEC-30, amending DEC-27). FR-07 shows every event for all three kinds. FR-08 and FR-09 hide the user's contact details and message content from the admin (DEC-31), and the admin's row in Users and roles says so; FR-08 now says "made the cut", matching FR-07. Added the agreed PM-08 design (DEC-32), PM-16 for a daily delivery count (DEC-33), and OQ-11 for the risk that few disasters alert. Updated the glossary's Event entry. Approved by the user (P-156).
- v7 (2026-11-05): added PM-17, merging news events that look like duplicates, deferred by the user in the M5 build after two identical alerts in the M5 journey run. Nothing else changed.
