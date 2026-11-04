Status: draft
Version: 1
Updated: 2026-11-04

# Stage 1 review, round 1: CTO

Reviewed: `feature-design/product-spec.md` (v0.1), `feature-design/assumptions.md` (v0.1), against `original-brief.md`.
Lens: deadline, complexity and cost, security, operations, unchecked external-API claims. User decisions (PD-01 to PD-17, PD-23 to PD-26) are not reopened; where one carries a risk the user may not have seen, it is flagged as such.

External facts checked for this review (2026-11-04):

- Slack incoming webhooks: https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/ . Errors are returned as 400, 403 and 404 with strings such as `invalid_token`, `no_service`, `no_active_hooks`, `channel_is_archived`, `team_disabled`, `action_prohibited`. The page does not map strings to status codes. Webhook host is `hooks.slack.com`.
- Resend: https://resend.com/pricing (free: 100 emails/day, 3,000/month; Pro $20/month for 50,000) and https://resend.com/docs/knowledge-base/403-error-resend-dev-domain (without a verified domain you can only send to the Resend account's own address).
- NewsAPI: https://newsapi.org/pricing (free: 100 requests/day, articles delayed 24 hours, development use only; Business $449/month).
- Alpha Vantage: https://www.alphavantage.co/support/ (free key: 25 requests/day).
- USGS GeoJSON feeds: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php (updated every minute; each event has a string `id` and an `updated` timestamp, so events are revised after first publication).

## Findings

Tier-one findings (scope, data shape, deletion, or a reading only the user can settle) come first.

### F-01 · blocker · tier one · Who may sign in, and the magic-link endpoint as a spam channel
- **Where:** product-spec S-12, section 2 ("An admin is a user whose email is on a config allowlist"); assumptions A-17.
- **Quote:** "S-12 | Email magic-link sign-in, with admins set by a config allowlist (PD-15)."
- **Check failed:** auth gap; abuse of an outbound channel; a reading that can go two ways.
- **Why it matters:** the spec says who is an admin but not who is a user. Read as open sign-up, the sign-in form sends an email to any address anyone types in, from our domain and our provider account. That is a spam relay, and on the Resend free tier (100 emails/day) a script can use up the day's quota in seconds, after which no alert and no magic link (including the admin's) goes out. A-17 does not list "who can sign up" as an ambiguity at all.
- **Fix:** add the reading to A-17 and state it in S-12. Whichever reading the user picks, S-12 needs a request limit on magic links.
- **Question for the user:** may anyone sign in, or only listed people?
  **Recommended default:** for this build, sign-in is limited to a config allowlist of user emails (the admin allowlist sits beside it), and a magic-link request for an address not on the list sends nothing and shows the same neutral message. Reason: it closes the spam path and the quota risk with no rate-limiting code, and a demo needs only the team. Open sign-up with per-address and per-IP limits can come later; its windows would then be a further tier-one question.

### F-02 · major · tier one · What a deleted alert leaves behind
- **Where:** product-spec PD-19, S-10.
- **Quote:** "Delete is permanent and asks for confirmation. The delivery history is kept for the admin"
- **Check failed:** secret handling; deletion / data shape.
- **Why it matters:** "permanent" and "history is kept" pull in opposite directions, and the spec does not say what is kept. If the alert's Slack webhook URL survives in the kept history, a secret the user believes they removed is still stored and possibly shown in the admin delivery log.
- **Question for the user:** on delete, what is erased?
  **Recommended default:** the alert and its destinations (the webhook URL) are erased; delivery rows keep event, time, channel type, status and the last error text, with the alert shown as "deleted alert". Reason: the operations record survives (PD-19's purpose) without keeping a credential.

### F-03 · major · tier one · Who receives an injected test event
- **Where:** product-spec S-16, PD-21; assumptions A-23.
- **Quote:** "S-16 | Admin: inject a test event into any category (PD-02)."
- **Check failed:** abuse of an outbound channel; reading can go two ways.
- **Why it matters:** with no rate cap (PD-07), one click sends a real email and Slack message to every matching alert of every user. That is fine with three team members and a problem with real users. The spec does not say which is meant.
- **Question for the user:** does a test event go to all matching alerts or only the injecting admin's own?
  **Recommended default:** all matching alerts, marked as a test (PD-21), with the injecting admin's email recorded on the event. Reason: the demo then exercises the real path; with F-01's default the only users are the team. Revisit if sign-up opens.

### F-04 · major · tier one · Revised events and level changes
- **Where:** product-spec S-05, PD-23; glossary "Event".
- **Quote:** "Duplicates are found within a category only, by the source's own event ID and its updates"
- **Check failed:** a reading that can go two ways; operational behaviour unstated.
- **Why it matters:** USGS revises events after publishing them (each has an `updated` timestamp; verified above). A quake first reported at M5.8 (Notable) and revised to M6.1 (Major) can be read two ways: a "Major only" alert gets it on the revision, or never, because the event was already seen. A revision below Notable also raises whether an already-stored event is withdrawn. The data model in stage 2 cannot be written until this is settled.
- **Question for the user:** what happens when a revision changes an event's level?
  **Recommended default:** a revision that raises the level notifies alerts that newly match, once; alerts already notified get nothing more; a downgrade changes nothing already sent. Reason: keeps "once per alert" and still catches events that become Major.

### F-05 · major · tier one · Which Slack failures count as permanent
- **Where:** product-spec S-09, PD-13, PD-24; assumptions A-14, A-15.
- **Quote:** "A Slack 404 is not retried: the alert shows \"Slack webhook no longer works\""
- **Check failed:** a claim about an external API not checked against its documentation.
- **Why it matters:** Slack's docs list permanent failures that are not 404s, returned as 400 or 403: `invalid_token`, `channel_is_archived`, `team_disabled`, `action_prohibited`, `no_active_hooks`. The docs do not say which status code goes with which string. Treating only 404 as permanent means these are retried three times over ten minutes and then shown as a generic "last delivery failed", which tells the user nothing they can fix. This widens a user decision, so it is put to the user, not decided here.
- **Question for the user:** may "permanent" be widened from "404" to "any 4xx except 429"?
  **Recommended default:** yes. Any 4xx except 429 is permanent and gets the PD-24 handling; 429, 5xx and network errors are retried per PD-13. Reason: it matches what the docs actually list, and the PD-24 message still holds for every case in that set.

### F-06 · major · tier one · Source outages and catch-up
- **Where:** product-spec S-04, S-13; no entry covers it.
- **Quote:** "S-13 | Admin: health of each source (last fetch, last error) (PD-16)."
- **Check failed:** operational gap (what happens when a source is down).
- **Why it matters:** S-13 shows that a source failed but the spec does not say what happens on recovery. Fetching the backlog and sending all of it floods users with stale "breaking" alerts; skipping it silently loses events. The first fetch after a fresh deploy has the same problem: the USGS past-day feed would send a day of quakes at once.
- **Question for the user:** after an outage or first start, how old may an event be and still be sent?
  **Recommended default:** events published more than 60 minutes before they are fetched are stored but not sent, and the event log shows them as "too old to send". Reason: no flood on first start or recovery, and nothing disappears from the admin's view. The 60 minutes is a placeholder for the user to set.

### F-07 · major · Email provider limits and the domain the build depends on
- **Where:** product-spec S-06, PD-12; assumptions A-13.
- **Quote:** "Email channel: sent to the account's own address through one transactional provider"
- **Check failed:** a paid service with no cost or limits stated; operational dependency not named.
- **Why it matters:** two facts the user may not have seen behind PD-12 (checked for Resend, the likely choice; other providers are similar and will be checked in stage 3). First, without a verified sending domain the provider sends only to its own account address, so real delivery to any other user needs a domain the user controls with DNS access. Second, the free tier is 100 emails/day and 3,000/month, shared by alerts and magic links, and PD-07 removed the rate cap. One busy hour of Notable earthquakes across a few alerts can use up the day, and then nobody can sign in either.
- **Fix:** S-06 should state that real delivery needs a verified domain and that email volume is bounded by the provider's quota; the tech stack in stage 3 will give figures and the fallback. Also a **question for the user** (knowledge only they have): is there a domain you control that we can verify for sending? **Default if not:** real email reaches only the provider account's own address, and every other address goes to the mail-catcher; stated as a known limit of the demo.

### F-08 · major · Slack webhook URL: arbitrary outbound requests and an unprotected secret
- **Where:** product-spec S-07, S-08, S-14; glossary "Destination".
- **Quote:** "S-07 | Slack channel: sent to an incoming-webhook URL the user pastes in (PD-10)."
- **Check failed:** auth / secret-handling gap; abuse of an outbound channel.
- **Why it matters:** as written, the server POSTs to any URL a user pastes, and "Send test" (S-08) lets them do it on demand. That makes the server a tool for requests to internal addresses (cloud metadata, localhost services) or to any third-party endpoint. Separately, a Slack webhook URL is itself the credential for posting into a channel; the spec does not say it is hidden after saving or kept out of the admin delivery log (S-14).
- **Fix:** add to S-07: only URLs starting `https://hooks.slack.com/` are accepted (the host given in Slack's docs, cited above); the URL is shown masked after saving, never shown in admin views or logs, and never sent back to the browser in full. This is a security rule, not a business rule, so it needs no user answer. Raised as major, not blocker, because the fix is one sentence; it becomes a blocker if stage 2 is written without it.

### F-09 · major · Scope against 24 hours has no cut line
- **Where:** product-spec section 4 (S-01 to S-17).
- **Quote:** "S-01 | Three event categories ... One live public source each"
- **Check failed:** scope that does not fit the deadline.
- **Why it matters:** seventeen scope items, three live sources, two real channels, magic-link auth, retries with backoff, a Slack-failure email and a four-function admin view is a full build. The design process alone is planned at 15 to 20 agent runs (D-15). The two riskiest items are sources: free news APIs fit poorly with "breaking" (NewsAPI's free plan delays articles 24 hours, allows 100 requests/day and development use only; Business is $449/month), and free market data is tight (Alpha Vantage: 25 requests/day, against 288 polls/day for one asset at 5-minute intervals). News Notable has no definition at all (OQ-01). Markets only move during trading hours, so a weekend demo shows nothing real. Rough estimate: each extra source with its normalisation, threshold work and tests is 3 to 5 hours.
- **Fix:** mark each S-item Must or Should, so the roadmap has a cut line agreed in advance rather than at hour 20. This does not cut anything now. **Recommended order to cut, if time runs short** (for the user to confirm at the roadmap gate): (1) news source, (2) market source, both falling back to inject-only for their category, (3) admin manual retry in S-14, keeping the log, (4) the PD-24 email, keeping the status. Must: USGS source, both channels with send test, alert CRUD, dedup, inject, delivery log, admin disable. This keeps every user decision and preserves the demo.
- **Also flagged on a user decision (PD-09):** "checked at least every 5 minutes" is fine for USGS (updated every minute) but, as above, exceeds the free tiers of the obvious news and market APIs. Stage 3 will pick sources against this; if none fits, the choice is a paid tier or a longer interval for that category, and that will come back to the user.

### F-10 · minor · "At most once, ever" cannot be promised alongside retries
- **Where:** product-spec S-05, section 1 ("arrives once").
- **Quote:** "an event reaches a given alert at most once, ever"
- **Check failed:** operational gap (delivery semantics).
- **Why it matters:** if a provider accepts a message but the response times out, the retry in S-09 sends it again. No email or webhook API we will use offers idempotency for incoming webhooks; Slack's page lists none. The promise as written is not achievable.
- **Fix:** reword to "the system sends each event to an alert once; a retry after a timed-out send may, rarely, deliver it twice."

### F-11 · minor · Admin actions are not attributed
- **Where:** product-spec S-14, S-15, S-16.
- **Check failed:** authorisation (who changed what).
- **Why it matters:** disable, re-enable, manual retry and inject change what users receive, and with several admins nobody can tell who did it.
- **Fix:** add "each admin action records which admin and when, shown in the admin view." Tier two; the owner can decide it.

### F-12 · minor · No way to remove personal data
- **Where:** product-spec NG-11.
- **Quote:** "Self-service account deletion | Not asked for in the brief."
- **Check failed:** secret handling.
- **Why it matters:** the account email and any webhook URLs stay stored with no removal path, even manual. Acceptable for a demo, but it should be visible as a known gap.
- **Fix:** add to NG-11: "an admin removes an account by hand on request; documented in the README."

### F-13 · minor · The operator role is missing from the roles table
- **Where:** product-spec UN-13 versus section 2.
- **Quote:** "UN-13 | Operator (team) | Add a new channel later"
- **Why it matters:** UN-13 refers to a role with no `R-NN`, so requirements cannot trace to it.
- **Fix:** add `R-03 Operator (development team)` or attribute UN-13 to an existing role.

## Note for stage 3 (not a finding)

Market-data terms often forbid passing prices on to third parties; the terms of whichever market source is picked will be checked in `tech-stack.md`. Unverified here.

## Verdict

- `product-spec.md`: **FAIL** (blocker F-01).
- `assumptions.md`: **PASS** for this document on its own, with major F-01 (A-17 is missing the sign-up ambiguity) and F-04 (no entry for revised events). Both are fixed together with the spec.

Overall: **FAIL**.
