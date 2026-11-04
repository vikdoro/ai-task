# S1 review, round 1: eng-lead

Reviewer: eng-lead. Date: 2026-11-04.
Reviewed: `feature-design/product-spec.md` (v0.1), `feature-design/assumptions.md` (v0.1), against `original-brief.md`.
Checks: ambiguity, coverage of the brief, testability, contradictions, missing failure paths, unneeded items.

**Coverage of the brief:** every part of the brief has a scope item: alerts (S-03), important events (S-01, S-02), email (S-06), Slack (S-07), more channels later (S-17), admin view (S-13 to S-16). Nothing in scope lacks a need. No scope item looks unneeded.

**Could I write FRs from this without guessing?** Mostly yes. The exceptions are the findings below. B-01 to B-03 would make me invent a business rule, and M-01 changes the data model.

Findings about data shape, deletion and scope come first. Tier one means the user must answer it. Each one has a recommended default.

---

## Blockers

### B-01 · tier one · deletion and data shape: what "Delete is permanent" deletes
- **Where:** S-10 "Delete is permanent and asks for confirmation", and PD-19 "The delivery history is kept for the admin: a deleted alert must not erase the operations record."
- **Check failed:** can be read two ways. It also leaves a failure path out (a delete while a delivery is in flight).
- **Why it matters:** the two lines pull against each other. "Permanent" can mean the row is gone (a hard delete), but kept history needs something to point to: a soft delete, or a snapshot of the alert on each delivery. That choice fixes the data model. Nothing says what happens to a delivery that is pending or waiting to retry when its alert is deleted. Nothing says whether the user's "last 20 notifications" (S-11) also go.
- **Suggested fix:** state it. "Delete removes the alert from every user screen, and it cannot be restored. Pending and retrying deliveries for it are cancelled and never sent. The admin's event and delivery logs keep their rows, labelled 'alert deleted'."
- **Recommended default:** soft delete (a `deleted_at` stamp, never shown to the user, no undelete). Cancel deliveries that have not been sent. Keep the admin log rows.

### B-02 · tier one · business rule: which events a new or edited alert matches (backlog and catch-up)
- **Where:** S-04 "a matching event is sent when it is found". S-05 "an event reaches a given alert at most once, ever". S-10 "Edit".
- **Check failed:** can be read two ways, and a failure path is missing.
- **Why it matters:** three cases are undefined, and each one decides whether users get a burst of old alerts:
  1. A new alert. Do stored events from before it was created match it? If they do, a new "Natural disasters · Notable and up" alert sends dozens of old quakes at once.
  2. The first fetch after deploy, or the first fetch after a source outage. Feeds such as USGS's past-day feed return hours of backlog, so every old quake counts as "found" just now.
  3. An edit that changes category or level. Does it replay stored events that now match?
- **Suggested fix:** add a rule to S-04 or S-05 that says when an event is eligible for an alert.
- **Recommended default:** an event is delivered to an alert only if (a) it was first stored after the alert was created or its criteria were last changed, and (b) its own occurrence time is at most 6 hours before it was stored. An event older than that is stored and shown in the admin event log as "too old to send", and never sent. The 6-hour window is a business rule, so the user should confirm it.

### B-03 · tier one · business rule: dedup for news and markets cannot use "the source's own event ID", and it conflicts with PD-06
- **Where:** PD-06 "Several reports of the same real-world event are merged." A-06 "Several reports of one real-world event count as one event." PD-23 / S-05 "Duplicates are found within a category only, by the source's own event ID and its updates."
- **Check failed:** contradiction between two decisions, and a rule the stack cannot meet for one category.
- **Why it matters:**
  - **News:** one news source returns one item per article. Two outlets' articles about the same story have different source IDs. Under PD-23 both are sent. Under PD-06 they are merged. Both cannot hold. Merging by story needs clustering, which PD-23 seems to rule out.
  - **Markets:** a price feed has no event ID. A "5% move" is something we compute, so the source ID rule has nothing to work on. Without a key we define, an asset that sits above 3% for a whole day re-fires on every 5-minute poll.
  - **Updates:** "and its updates" does not say what happens when an update changes the level. Example: USGS revises a quake from M5.8 (Notable) to M6.1 (Major). Does a "Major only" alert now get it, and does a "Notable and up" alert get it a second time?
- **Suggested fix:** keep PD-23 as the rule. Reword PD-06 and A-06 to "Updates to the same source item are merged", and give a dedup key for each category in S-05.
- **Recommended default:**
  - News: the key is the source item ID, falling back to the canonical URL. There is no story merging, so two outlets covering one story give two events.
  - Markets: the key is (asset, trading day, level). At most one Notable and one Major event per asset per day.
  - Disasters: the key is the source event ID.
  - An update that raises the level sends to alerts that the event did not match before (a "Major only" alert gets the M6.1 update). It does not re-send to alerts that already got the event. An update that lowers the level sends nothing.
  - I own `event-model.md` and will write these keys there once the user confirms.

---

## Majors

### M-01 · data shape: "Delivery" is defined as one attempt but used as the thing that is retried
- **Where:** Glossary "Delivery: One attempt to send one notification on one channel. A delivery is pending, sent or failed." S-09 "3 retries with backoff ..., then the delivery is marked failed." S-14 "manual retry of failed deliveries."
- **Check failed:** can be read two ways. It decides the data model.
- **Why it matters:** if a delivery is one attempt, a retried send is 4 deliveries, and "the delivery is marked failed" does not make sense. The data model needs to know whether attempts are their own records.
- **Suggested fix:** "Delivery: the sending of one notification on one channel. It has up to 4 automatic attempts, plus any manual retries, and is pending, sent or failed. Attempt: one try at a delivery." I would model Attempt as a child of Delivery in `data-model.md`.

### M-02 · tier one · business rule: Slack 404 handling has no lifecycle
- **Where:** S-09 "A Slack 404 is not retried: the alert shows 'Slack webhook no longer works' and the account gets one email." PD-24.
- **Check failed:** can be read two ways, and a failure path is missing.
- **Why it matters:**
  - "One email" does not say one per what: per alert, per webhook URL, per 404, or ever. A user with 5 alerts on one dead webhook could get 5 emails, or 1.
  - It does not say whether later events still try Slack on that alert, or what clears the status (a new URL, a passing "send test", the next success).
  - It does not say what happens if this notice email also fails.
  - Slack's other permanent errors are left out. Per Slack's docs, besides 404 a webhook can answer 400 `invalid_payload`, or 403 with `action_prohibited`, `invalid_token`, `channel_is_archived` and others, and these "should not be retried" (https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks). As written, a 403 would be retried 3 times and then shown only as "last delivery failed".
- **Recommended default:**
  - Treat any 404 or 403 from Slack as "webhook broken". Don't retry it. Stop sending to that alert's Slack channel until the user saves a new URL or a send test passes.
  - Send one notice email each time an alert's Slack channel goes from working to broken. That email uses the normal email retry and is logged as a delivery.
  - Treat a 400 as our own bug: mark it failed, don't retry it, and show it to the admin only.

### M-03 · tier one · business rule: Slack rate limit (429) and bursts, with no rate cap
- **Where:** PD-07 "Rate limit: none." S-09 retries.
- **Check failed:** a failure path is missing (a channel that rate-limits).
- **Why it matters:** Slack limits incoming webhooks to about 1 message per second per channel, with short bursts allowed, and answers HTTP 429 with a `Retry-After` header (https://docs.slack.dev/apis/web-api/rate-limits). PD-07 has no cap, and several alerts can share one webhook, so a burst of events, such as a quake swarm or a market open, can hit 429. The spec does not say whether a 429 uses up one of the 3 retries.
- **Recommended default:** a 429 does not count as a retry. Wait for `Retry-After`, then send again. Send to each webhook URL one at a time, at most 1 per second. A delivery still unsent after 30 minutes is marked failed. This does not reopen PD-07: it limits our sending speed, not what the user receives.

### M-04 · tier one · business rule: admin disable and admin retry while deliveries are in flight
- **Where:** S-15 "disable or re-enable any alert". S-14 "manual retry of failed deliveries".
- **Check failed:** a failure path is missing, and the rule can be read two ways.
- **Why it matters:** the spec does not say:
  - what happens to pending or retrying deliveries when an alert is disabled;
  - whether events that arrive while the alert is disabled are sent when it is re-enabled;
  - whether an admin can manually retry a delivery for an alert that is disabled, deleted or has a broken webhook;
  - whether the owner can still delete a disabled alert.
- **Recommended default:** disabling cancels unsent deliveries. Events during the disabled period are never sent, even after re-enable (the B-02 rule applies from the re-enable time). Manual retry is refused for a deleted or disabled alert and for a broken Slack channel, and allowed otherwise. The owner can edit or delete a disabled alert.

### M-05 · tier one · business rule: who receives an injected test event
- **Where:** S-16 "inject a test event into any category". PD-21. R-02 "Run the demo by injecting a test event."
- **Check failed:** can be read two ways.
- **Why it matters:** an injected event can go to every matching alert of every user, or only to the admin's own alerts. The first means a demo sends a fake "Major earthquake" to real users, marked as a test, which is the trust risk PD-21 names. It is also undefined whether the admin picks the level, and whether each injection is a new event for dedup.
- **Recommended default:** the admin picks the category, level and title. The event goes to all matching alerts, marked as a test (PD-21). The demo then shows real fan-out, and in a 24-hour build the only users are the team. Each injection is a new event with its own ID.

### M-06 · tier one · scope: who can sign in
- **Where:** S-12 "Email magic-link sign-in". R-01.
- **Check failed:** can be read two ways.
- **Why it matters:** the spec does not say whether anyone with an email can create an account on first sign-in, or only invited addresses. That decides whether there is a sign-up path, and how open the app is to abuse (send test to any Slack webhook, email to any address that signs up). A failure path is also missing: sign-in depends on the email provider, so if the provider is down nobody can sign in, admins included.
- **Recommended default:** open sign-up. The first magic link creates the account. Links are single-use and expire after 15 minutes. In dev, the mail-catcher (PD-12) is the way in. The expiry is an NFR detail I can log as tier two.

### M-07 · data shape and status wording: the set of alert statuses is not defined
- **Where:** S-11 "showing each alert's status". S-09 "last delivery failed", "Slack webhook no longer works". S-15 "Disabled by an admin".
- **Check failed:** can be read two ways, and has no acceptance criteria.
- **Why it matters:** an alert can be in several of these states at once, such as disabled and Slack broken, or email OK and Slack failed. The spec does not say whether status is per alert or per channel, which one wins, or what clears "last delivery failed". An e2e test cannot check "shows the status" without that list.
- **Suggested fix:** list the states, their precedence and what clears each one. Wording stays with stage 4 (PD-17).
- **Recommended default:** status is per channel on the alert, plus one flag for the alert. Precedence: Disabled by an admin > Slack webhook no longer works > Last delivery failed > Active. "Last delivery failed" clears on the next successful delivery on that channel.

### M-08 · tier one · business rule: the news level mechanism must be settled at stage 3, not at `/build`
- **Where:** OQ-01 "News Notable needs a new definition ... Settle each category when its source is first integrated in `/build`."
- **Check failed:** a requirement the stack might not be able to meet.
- **Why it matters:** quake and market thresholds are numbers, so they can stay config values tuned in `/build`, and FRs can test them as parameters. The news rule is different. It is a mechanism (top stories, an outlet count, a priority field), and it decides which news source stage 3 can choose. If it waits until `/build`, stage 3 may pick a source that has no such signal. There is also no definition yet for news Major, only Notable.
- **Suggested fix:** split OQ-01. OQ-01a: numeric values (quakes, markets), still settled in `/build`. OQ-01b: the news Notable and Major mechanism, settled in stage 3 together with the source choice.
- **Recommended default:** news Notable = the item appears in the source's top or breaking headlines feed. News Major = the source flags it as breaking or highest priority. Stage 3 picks a source that exposes both signals.

### M-09 · missing failure path: a source that is down or empty is visible only to an admin who looks
- **Where:** S-13 "health of each source (last fetch, last error)". UN-06 "Know when my alerts have stopped reaching me."
- **Check failed:** a failure path is missing.
- **Why it matters:** if the USGS fetch fails for 6 hours, every disaster alert goes silent. The user cannot tell this from a quiet day, which is what UN-06 is meant to prevent. The admin sees it only on opening the view. The spec also does not say how "empty" (fetched fine, nothing at or above Notable) is shown apart from "failing".
- **Suggested fix:** define a source as "stale" after N missed fetches. Say what the admin view shows for it, and whether the user sees anything.
- **Recommended default:** a source is "failing" after 3 fetches in a row fail (about 15 minutes), shown in red in the admin view. An empty fetch counts as healthy. Users are not told (that keeps scope down), and the gap against UN-06 is written down as accepted. Catch-up after the outage follows B-02.

### M-10 · testability: "at most once, ever" cannot be guaranteed for every channel delivery
- **Where:** S-05 "an event reaches a given alert at most once, ever." Success criterion "arrives once."
- **Check failed:** a requirement the stack cannot meet as worded, and a test cannot check it.
- **Why it matters:** retries (S-09) make sending at-least-once. If Slack or the email provider times out after it has already delivered, the retry sends the message again. No HTTP channel can promise exactly-once. A test can check the system's own records, but not this wording. It also does not say whether editing an alert (adding Slack) re-sends past events on the new channel.
- **Suggested fix:** "The system creates at most one notification per (alert, event), and at most one delivery per notification per channel. A retry after a timeout may, rarely, deliver twice." Under B-02, editing never re-sends past events.

---

## Minors

### m-01 · "about 10 minutes" and "with backoff" are not exact
- **Where:** S-09, PD-13.
- **Fix:** I will set the schedule in `non-functional-requirements.md` as a tier-two choice: retries at +1, +3 and +6 minutes, 10 minutes in total. Also say what counts as "sent": HTTP 2xx from the provider, or `ok` from Slack. Bounces after that are out of scope.

### m-02 · S-04 has no latency target for the time from detection to delivery
- **Where:** S-04 "sent when it is found."
- **Fix:** an NFR in my documents: for example, the first attempt within 60 seconds of the event being stored. The time from the event happening to the source publishing it is outside our control. Say so in UN-02.

### m-03 · "Send test": optional or required, and abuse
- **Where:** S-08, UN-05 "Know a channel works before I rely on it."
- **Fix:** say whether saving an alert with Slack requires a passing send test. My default: optional, but the result is shown. Add a per-user limit on send tests (for example 5 per minute), and check that a Slack URL starts with `https://hooks.slack.com/`. That stops the server from being used to post to arbitrary URLs. Neither is in the Decisions section.

### m-04 · a success criterion contradicts PD-21
- **Where:** section 1, "every notification is about a real event", and PD-21: test events are sent, marked as tests.
- **Fix:** "every notification is about a real event, or is clearly marked as a test."

### m-05 · "a handful of choices" cannot be tested
- **Where:** section 1, "under a minute, with no more than a handful of choices."
- **Fix:** give a number. Category, level and channels make 3 required inputs, plus a webhook URL if Slack is chosen. A test can count the inputs. A test cannot check "under a minute", so call it a usability goal.

### m-06 · no failure path for the database
- **Where:** the whole spec.
- **Fix:** one line, or a pointer to NFRs. If the database is down, fetches are not recorded and are tried again on the next poll. No notification is sent without a stored notification row, so dedup is never bypassed. I will write the detail in my NFRs.

### m-07 · the Slack webhook URL is a secret, and the spec does not say who can see it
- **Where:** S-07, S-14.
- **Fix:** the admin delivery log shows a masked URL, and the user sees it only in their own alert's edit form.

### m-08 · alert names
- **Where:** PD-19 "Alert names are generated automatically ... and can be edited." S-03 defines an alert without a name.
- **Fix:** add "name (generated, editable)" to S-03 and the glossary entry for Alert, so the data model does not take it from a Decisions line. Does editing the criteria regenerate an edited name? My default: only if the user has not edited it.

---

## Verdict

**FAIL**: 3 blockers (B-01, B-02, B-03).
