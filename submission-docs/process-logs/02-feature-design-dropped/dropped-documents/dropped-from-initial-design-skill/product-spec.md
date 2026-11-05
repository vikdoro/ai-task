Status: draft
Version: 0.3
Updated: 2026-11-04

# Product spec: world-event alerts

Source: `original-brief.md`. Readings of the brief are in `assumptions.md` (`A-NN`). Answers from the user are in [Decisions](#decisions) (`PD-NN`).

## 1. Problem

People want to hear about important world events, such as breaking news, market movements and natural disasters, without watching feeds all day. The brief asks for an alert service a user sets up once and then receives by email or Slack, plus an admin view for the people who run it.

The MVP is deliberately small (PD-27). Each user has one subscription to the whole service and switches it on or off. The system decides what is important, using one fixed, high bar per category (PD-28). The user only chooses where alerts arrive.

The product succeeds when:

- **Quick setup:** a user can set up a working subscription with at most 2 inputs: the channels (email, Slack or both) and, if Slack is chosen, a webhook URL. Saving the setup switches the subscription on (PD-44). "Under a minute" is a usability goal, not a tested requirement.
- **Trust:** the user trusts what arrives. Every notification is about a real event or is clearly marked as a test (PD-21). It says what happened and when, and the system sends it once (S-05).

## 2. Users and roles

| ID | Role | Job | Where they work |
|----|------|-----|-----------------|
| R-01 | User | Switch alerts on or off, choose where they arrive, trust what arrives, and fix delivery when it breaks. | User screens: set up / edit subscription, my subscription |
| R-02 | Admin | Keep the system running: watch source health and deliveries, act on failures, stop a user's alerts if they misbehave, and inject test events for the demo. | Admin view only |
| R-03 | Operator (development team) | Extend the system, for example by adding a channel, and remove an account by hand on request. | The code and config, not the UI |

Anyone with an email address can sign up, up to a cap of 10 places (PD-30, PD-53, PD-55). An admin is a user whose email is on a config allowlist (PD-15). Allowlisted admins are exempt from the cap (PD-54). An admin can also have their own subscription, set up through the user screens. User and admin functions never share a screen or an endpoint.

## 3. User needs

| ID | Role | Need |
|----|------|------|
| UN-01 | User | Set up alerts quickly, with nothing to decide that I cannot sensibly answer. |
| UN-02 | User | Hear about an event soon after the source publishes it. How long the source takes to publish is outside our control. |
| UN-03 | User | Get each event once, not repeated. |
| UN-04 | User | Get alerts where I already am: email, Slack or both. |
| UN-05 | User | Know a channel works before I rely on it. |
| UN-06 | User | Know when alerts have stopped reaching me. This is only partly met: a source outage is shown to admins only (PD-41). |
| UN-07 | User | Change where alerts arrive, switch them off, or remove my setup. |
| UN-08 | User | See what I have been sent lately. |
| UN-09 | Admin | See whether each source is fetching events. |
| UN-10 | Admin | See which deliveries failed, and retry them. |
| UN-11 | Admin | Stop a user's alerts if they misbehave, without changing the user's settings. |
| UN-12 | Admin | Trigger an event on demand to show or test the system. |
| UN-13 | Operator | Add a new channel later without reworking the existing ones. |

## 4. Scope (MVP)

Each item names the needs it serves. **Must** items are the demo. **Should** items are cut, in the order given, if time runs short; the user confirms that order at the roadmap gate (PD-42). The requirements stage refines these items and must not add one that serves no need listed here.

| ID | In scope | Serves | Priority |
|----|----------|--------|----------|
| S-01 | One common event shape for every category. Natural disasters come from one live public source (PD-01, PD-02). | UN-02 | Must |
| S-18 | Breaking news from one live public source. If cut, news is inject-only (S-16). | UN-02 | Should, cut 1 |
| S-19 | Market movements from one live public source. If cut, markets are inject-only (S-16). | UN-02 | Should, cut 2 |
| S-02 | One fixed importance bar per category, set high, near the old "Major". Anything below the bar is dropped at fetch and never stored or sent (PD-51). The values are open: OQ-01a (numbers) and OQ-01b (news). | UN-01 | Must |
| S-03 | A subscription: one per user, On or Off, with channels set to email, Slack or both. There is no choice of category or level (PD-27). | UN-01, UN-04, UN-07 | Must |
| S-04 | Immediate delivery: each source is checked at least every 5 minutes, and an eligible event is sent when it is found (PD-09). An event is eligible only if its event time is not earlier than the subscription's eligibility time. The eligibility time is set by creating the subscription, switching it On, or an admin re-enable, and by nothing else (PD-32, PD-50, PD-58). | UN-02 | Must |
| S-05 | Deduplication: the system creates at most one notification per subscription per event, and one delivery per notification per channel. A retry after a timed-out send may, rarely, deliver twice. Duplicates are found within a category only (PD-06, PD-23). The keys per category, and what a revised event does, are open (OQ-06). | UN-03 | Must |
| S-06 | Email channel: sent to the account's own address through one transactional provider (PD-10, PD-12). Volume is bounded by the provider's quota, shared with magic links. In local development, a mail-catcher receives everything except mail to the provider account's own address. The mail-catcher is never deployed. A deployed demo needs real sending to everyone, decided in stage 3 (PD-37, PD-56, OQ-07). | UN-04 | Must |
| S-07 | Slack channel: sent to an incoming-webhook URL the user pastes in (PD-10). Only URLs starting `https://hooks.slack.com/` are accepted. After saving, the URL is shown masked to its owner. It is never shown in full to the browser again, and never in admin views or logs (PD-47). Sending is paced and handles 429s (PD-35). | UN-04 | Must |
| S-08 | "Send test" for each channel during setup and edit. It is optional, its result is shown (PD-48), and each user can run at most 5 per minute (PD-53). | UN-05 | Must |
| S-09 | Retries and failure statuses per channel: 3 retries with backoff over about 10 minutes, then the delivery is failed (PD-13). A Slack 404 or 403 means the webhook is broken: it is not retried, and Slack stops for this subscription until it is fixed (PD-34). The status lists are in PD-39, PD-45 and PD-60. | UN-06, UN-10 | Must |
| S-20 | A notice email each time the Slack channel goes from working to broken (PD-24, PD-34). If cut, the status alone remains. | UN-06 | Should, cut 4 |
| S-10 | Edit the subscription (channels, Slack URL, On/Off). Switching Off cancels unsent deliveries (PD-59). Delete it permanently, with confirmation (PD-31). | UN-07 | Must |
| S-11 | My subscription: its status per channel and its last 20 notifications, test events included and marked (PD-20, PD-62). | UN-06, UN-08 | Must |
| S-12 | Open sign-up and sign-in by email magic link. Links are single-use and expire after 15 minutes (PD-30). There are at most 10 places, and a place is taken when a link is requested (PD-55). An address can request at most 3 magic links per hour (PD-53). Admins come from a config allowlist (PD-15, PD-54). | R-01, R-02 | Must |
| S-13 | Admin: health of each source: last fetch, last error, and "failing" after 3 failed fetches in a row (PD-41). A fetch that succeeds with nothing above the bar counts as healthy (PD-61). | UN-09 | Must |
| S-14 | Admin: event log and delivery log. | UN-10 | Must |
| S-21 | Admin: manual retry of a failed delivery, with the limits in PD-38 and PD-59. If cut, the log alone remains. | UN-10 | Should, cut 3 |
| S-15 | Admin: disable or re-enable a user. The flag is kept on the user account, so a recreated subscription starts out disabled. The admin cannot change the user's settings (PD-16, PD-25, PD-38, PD-57). | UN-11 | Must |
| S-16 | Admin: inject a test event by picking a category and a title, with no level (PD-36, PD-52). | UN-12 | Must |
| S-17 | Channels sit behind one code-level interface (PD-14). | UN-13 | Must |
| S-22 | Each admin action (disable, re-enable, retry, inject) records the admin and the time, and is shown in the admin view (PD-46). | UN-11 | Must |

**Known effects of user decisions**, written down so nobody is surprised:

- **Test events reach strangers.** With open sign-up (PD-30), an injected test event (PD-36) reaches every subscription that is On and not disabled, real strangers included (at most 10 places, PD-53). It is marked as a test.
- **Deploying needs real email.** The mail-catcher is local only (PD-56). A deployed demo therefore cannot sign anyone in, except the provider account's own address, until stage 3 settles real sending (OQ-07).
- **Catch-up burst.** No age window (PD-32): after a source outage, every above-bar event from the outage that is not earlier than the eligibility time is sent when the source recovers, possibly hours late. The high bar keeps the burst small, but these notifications are late. Stage 4 copy should show the event's own time so a late alert does not read as breaking.
- **Outages are silent to users.** A source outage is shown to admins only (PD-41). The gap against UN-06 is accepted.
- **Abuse limits come from caps, not IPs.** There is no per-IP limit (PD-53). Abuse is bounded by the 10 places and the per-address and per-user limits.
  - A script can hold all 10 places with made-up addresses for as long as it keeps requesting links, since places taken at request are freed only after 15 minutes unused (PD-55). Admins are not affected.
  - Outbound magic-link mail is bounded by about 10 × 3 per hour (CTO, `reviews/S1-cto-r2.md` N-01). That can exceed a free email quota; stage 3 checks it against the chosen provider.
- **Inactive accounts hold places.** A signed-up account keeps its place even with no subscription. Only removal by hand (PD-49) frees it.
- **Late-published events.** Switching On or being re-enabled can drop an event the source publishes late. Its own time falls before the new eligibility time (PD-58).

## 5. Post-MVP

Entries moved out of the MVP by the user (PD-29, process D-20). Each one keeps its earlier design so it can be specced when its turn comes.

| ID | Feature | What the MVP does instead | Decision |
|----|---------|---------------------------|----------|
| PM-01 | Per-category opt-in: the user chooses which of news, markets and disasters they receive. | One subscription to every category. | PD-27 (supersedes the category choice in PD-05) |
| PM-02 | User-chosen levels, "Major only" / "Notable and up", with two system thresholds per category. A level field returns to the inject form (PD-52). It starts with no history below the bar (PD-51). | One fixed bar per category, near the old Major (PD-28). Anything below it is dropped at fetch. | PD-27 (supersedes PD-03), PD-51 |
| PM-03 | One optional filter: a keyword for news, a region for disasters, an asset for markets. | No filter. | PD-29 (Q5 had rejected it; the user moved it here) |

## 6. Non-goals (MVP)

| ID | Out of scope | Why |
|----|--------------|-----|
| NG-01 | Category choice, level choice, keyword/region/asset filters | Post-MVP: PM-01, PM-02, PM-03 |
| NG-02 | Rate caps or summary messages for the user | PD-07. Sending pace (PD-35) is not a cap on what the user receives. |
| NG-03 | Quiet hours, or pausing from inside a notification | PD-08. The On/Off switch (PD-27) is the only mute. |
| NG-04 | Digests or scheduled delivery | PD-09 |
| NG-05 | Email to addresses other than the account's own; a Slack OAuth app | PD-10 |
| NG-06 | Channels configured at runtime, or a plugin marketplace | PD-14 |
| NG-07 | Passwords, SSO, admin roles managed in the UI | PD-15 |
| NG-08 | Admin changing a user's settings; admin creating or deleting users | PD-16 |
| NG-09 | More than one source per category | PD-01 |
| NG-10 | Mobile apps, push or SMS channels, languages other than English | A-21, A-22. S-17 leaves room for new channels later. |
| NG-11 | Self-service account deletion | Not in the brief. The operator (R-03) removes an account by hand on request, as documented in the README (PD-49). |
| NG-12 | Merging events across categories | PD-23 |
| NG-13 | Telling users about a source outage | PD-41 |
| NG-14 | Sending events whose time is before the subscription's eligibility time | PD-32, PD-58 |
| NG-15 | Storing events below the bar | PD-51 |
| NG-16 | Per-IP request limits; more than 10 places | PD-53 |
| NG-17 | A deployed or network-reachable mail-catcher | PD-56 |

**Noise (product designer's note):** there is still no rate cap (PD-07). Noise is now held down by the high fixed bar (S-02), dedup (S-05) and the On/Off switch (PD-27). The switch gives back the "mute" that PD-08 had removed. OQ-01 should still be settled against real source data, with noise in mind.

## 7. Open questions

| ID | Question | Recommended default | When |
|----|----------|---------------------|------|
| OQ-01a | Numeric bar values per category. Placeholders, **not decided**: earthquakes M6.0+; markets a move of 5% or more in one trading day, over a fixed system list of assets. With PD-51 there is no stored history below the bar, so the values are set from live fetch output. | Settle each when its source is integrated in `/build` (PD-40). | `/build`, first milestone per source |
| OQ-01b | The news importance mechanism: what makes a news item clear the bar. The candidates are the source's breaking flag, its top-headlines feed and an outlet count. | Settled together with the news source choice (PD-40). | Stage 3 |
| OQ-06 | Dedup keys per category, and what a revised event does. Examples: USGS revises a quake across the bar; news has two items about one story; markets have no source ID. The user said "Let's get back to this once we inspect the sources." (PD-33) | None yet. The reviewers' defaults are in `reviews/S1-eng-lead-r1.md` B-03 and `reviews/S1-cto-r1.md` F-04. | When sources are inspected (stage 3 / `/build`) |
| OQ-07 | How does a deployed demo send real email, magic links included, to every address? The user said "Mark this as something to discuss later when selecting third-party service." Any answer must keep PD-56: no deployed mail-catcher. | Options to compare in stage 3: a verified sending domain, Gmail SMTP, or another provider. The chosen quota must fit the magic-link bound in section 4. | Stage 3 |
| OQ-02 to OQ-05 | Closed in v0.1 by PD-23 to PD-26. | | Closed |
| OQ-08 to OQ-11 | Closed in v0.2 by PD-50 to PD-53. | | Closed |

## 8. Glossary

| Term | Meaning |
|------|---------|
| Event | One real-world occurrence at or above its category's bar, normalised from a source into the common event shape. It has a category, an event time, a title, a link and a source ID. Items below the bar never become events. |
| Event time | The source's own occurrence or publish time. For a test event, it is the moment of injection (PD-58). |
| Eligibility time | The moment from which a subscription can receive events. It is set by creating the subscription, switching it On, or an admin re-enable (PD-58). |
| Category | One of: breaking news, market movement, natural disaster. |
| Bar | The fixed importance threshold for a category in the MVP (S-02). |
| Subscription | A user's single opt-in to the whole service. It is On or Off and has one or more channels. It receives nothing while its user is disabled by an admin. |
| Place | One of the 10 sign-up slots. It is taken when a magic link is requested for a new address and freed if the link expires unused, or when an account is removed by hand (PD-55). |
| Channel | A way of delivering: email or Slack. |
| Destination | Where a channel delivers to: the account email address, or a Slack webhook URL (a secret, S-07). |
| Notification | The message about one event for one subscription. |
| Delivery | The sending of one notification on one channel. It has up to 4 automatic attempts plus any manual retries, and is pending, sent, failed or cancelled. |
| Attempt | One try at a delivery. A Slack 429 wait is not an attempt (PD-35). |
| Source | An external feed that events are fetched from. "Failing" means 3 failed fetches in a row. |
| Test event | An event an admin injects, with a category and a title. It is marked as a test everywhere, and the admin who injected it is recorded. |
| Admin | A signed-in user whose email is on the config allowlist. |

## Decisions

### Stage 1 answers, P-043 (decided by: user)

- **PD-01** Categories: all three, one source each, one common event shape. (Matches recommendation.) The cut line is in PD-42.
- **PD-02** Data: live public feeds, plus an admin-only "inject test event". (Matches recommendation.)
- **PD-03** *Superseded by PD-27 (moved to PM-02).* It was: two system-defined levels per category; the user picks one.
- **PD-04** Threshold values not decided: "Revisit this once we try the data source." Recommended: accept the placeholders. Now OQ-01a and OQ-01b.
- **PD-05** *Superseded by PD-27 and PD-29.* It was: category and level only, no filter (recommended: one optional filter). The category choice is now PM-01, the level choice PM-02, and the filter PM-03.
- **PD-06** Dedup: one event reaches a subscriber at most once, ever. (Matches recommendation.) Its "merge several reports of the same real-world event" applies only as far as PD-23 allows: within a category. Whether two news items about one story count as one event is part of OQ-06.
- **PD-07** No rate limit. Recommended: 5 per hour, with a summary.
- **PD-08** "Only edit per alert": no pause link in notifications. Recommended: pause/resume and a pause link. *Superseded in part by PD-27*, which adds the On/Off switch.
- **PD-09** Immediate, with each source checked at least every 5 minutes. (Matches recommendation.)
- **PD-10** Email goes to the account address; Slack goes to a pasted incoming webhook; both channels have send test. (Matches recommendation.)
- **PD-11** Email, Slack or both. (Matches recommendation.) This now applies to the subscription.
- **PD-12** Real sending through one provider, with a mail-catcher in dev. (Matches recommendation.) The limits are in PD-37 and PD-56.
- **PD-13** Any channel: 3 retries with backoff over about 10 minutes, then failed. The user sees "Last delivery failed", and the admin sees it in the log with a retry. (Matches recommendation.) Slack exceptions are in PD-34 and PD-35.
- **PD-14** One code-level channel interface. (Matches recommendation.)
- **PD-15** Email magic-link sign-in; admins on a config allowlist. (Matches recommendation.) Who can sign up is in PD-30, PD-53 and PD-55.
- **PD-16** Admin: source health, event log, delivery log with retry, inject, disable. The admin does not edit users' settings. (Matches recommendation.) Disable now targets a user (PD-57).
- **PD-17** The product designer drafts all user-facing copy in stage 4, and the user approves it. (Matches recommendation.)

### Follow-up answers, P-044 (decided by: user)

- **PD-23** Dedup within a category only, by the source's own event ID and its updates. (Matches recommendation.) The keys per category are still open (OQ-06).
- **PD-24** Slack-broken handling: the status "Slack webhook no longer works" plus one email to the account. (Matches recommendation.) Refined by PD-34.
- **PD-25** Admin disable: the owner sees "Disabled by an admin", and only an admin re-enables it. (Matches recommendation.) It now applies with PD-38 and PD-57.
- **PD-26** Events below Notable are dropped at fetch. Recommended: store them, never send. Under the MVP's single bar this is restated by PD-51.

### Stage 1 revision answers, P-049 (decided by: user)

- **PD-27** MVP model: one subscription per user to the whole service, On or Off, with no category or level choice. The user said: "We shouldn't set up levels for the MVP, just an on-off, also there shouldn't be a per-category control." It overrides my recommendation of category + two levels per alert (Q3), and supersedes PD-03 and PD-05.
- **PD-28** One fixed bar per category, set high, near the old "Major". The values are open (OQ-01a, OQ-01b).
- **PD-29** A Post-MVP section (process D-20) holding PM-01 to PM-03. The user said: "This was rejected, but should move to post-MVP: A keyword (news), region (disasters) or asset (markets)."
- **PD-30** Open sign-up; magic links are single-use and expire after 15 minutes. **The roles disagreed:** the eng lead recommended open sign-up; the CTO recommended a sign-in allowlist, because the magic-link form is a spam relay and the free email quota is 100 a day (`reviews/S1-cto-r1.md` F-01). The user settled it for open sign-up, which overrides the CTO. The limits are in PD-53 and PD-55.
- **PD-31** Delete is a hard delete: the subscription and its destinations, the webhook URL included, are erased. Delivery rows keep the event, time, channel type, status and error, labelled "deleted". Unsent deliveries are cancelled. This is the CTO's position (F-02) and overrides the eng lead's soft delete (B-01). An admin disable survives a delete (PD-57).
- **PD-32** "If event is older than alert creation / edit, don't send": an event whose time is before the subscription's creation or last edit is not sent. There is no age window beyond that. This overrides both reviewers, who recommended one (CTO 60 minutes, F-06; eng lead 6 hours, B-02). *Narrowed by PD-58*: "edit" now means only switching On or an admin re-enable. The catch-up effect is in section 4.
- **PD-33** Dedup keys and revisions are deferred: "Let's get back to this once we inspect the sources." This overrides the reviewers' defaults (B-03, F-04). Carried as OQ-06.
- **PD-34** Slack 404 or 403 means the webhook is broken: no retries, and Slack stops for the subscription until the user saves a new URL or a send test passes. One notice email goes out each time the channel goes from working to broken. A 400 is our own bug: it is marked failed and shown to the admin only. This is the eng lead's position (M-02) and overrides the CTO's "any 4xx except 429" (F-05).
- **PD-35** Slack 429 does not count as a retry. Wait for `Retry-After`, send at most 1 message per second per webhook, and mark the delivery failed if it is still unsent after 30 minutes. (Matches the eng lead's M-03.) Slack's limit for incoming webhooks is 1 message per second with short bursts, and a 429 carries `Retry-After` (https://docs.slack.dev/apis/web-api/rate-limits/, checked by the CTO 2026-11-04). Where the 30 minutes start is left to the eng lead's NFRs (R2-m-03).
- **PD-36** Test events go to every subscription that is On and whose user is not disabled, marked as a test, with the admin recorded. Its known effect is in section 4. (Matches F-03 and M-05.) The admin picks the category and title; the level field from P-049 is removed by PD-52.
- **PD-37** There is no email domain. In local development, real email reaches only the provider account's own address, and everything else goes to the mail-catcher. (Matches F-07's default.) *Amended by PD-56*: the mail-catcher is never deployed, and a deployed demo needs real sending to everyone (OQ-07).
- **PD-38** Admin disable cancels unsent deliveries. Events whose time falls in the disabled period are never sent. Manual retry is refused for a subscription that is deleted or Off (PD-59), whose user is disabled, or whose webhook is broken. The owner can still edit or delete their subscription while disabled. Only an admin re-enables. (Matches M-04; reworded by PD-58 to use the event time.)
- **PD-39** Statuses, with precedence. "Disabled by an admin" and "Off" apply to the whole subscription; the rest apply per channel. (Matches M-07, with PD-45.)
  - Email: Disabled by an admin, then Off, then Last delivery failed, then Active.
  - Slack: Disabled by an admin, then Off, then Slack webhook no longer works, then Last delivery failed, then Active.
  - "Last delivery failed" clears on the next success on that channel.
- **PD-40** The news importance rule is settled in stage 3, together with the source. The numeric bars stay for `/build`. (Matches M-08.)
- **PD-41** A source is "failing" after 3 failed fetches in a row, shown in the admin view only. Users are not told, and the gap against UN-06 is accepted. (Matches M-09.)
- **PD-42** Scope items are marked Must or Should. The order to cut is news source, market source, admin manual retry, then the Slack-broken email. The user confirms it at the roadmap gate. (Matches F-09.)
- **PD-43** Magic links without a verified domain are deferred to stage 3: "Mark this as something to discuss later when selecting third-party service." Carried as OQ-07, now framed by PD-56.

### Open-question answers, P-051 (decided by: user)

- **PD-50** Switching the subscription On counts as an edit for PD-32, so nothing from the Off period is sent (closes OQ-08). (Matches recommendation.)
- **PD-51** Everything below the MVP bar is dropped at fetch (closes OQ-09). The user said: "Below the bar and user-chosen levels should not be part of the MVP." (Matches recommendation.) Cost: PM-02 later starts with no history below the bar.
- **PD-52** The MVP inject form has no level field; it comes back with PM-02 (closes OQ-10). (Matches recommendation.)
- **PD-53** Request limits (closes OQ-11): at most 10 places (counted per PD-55); after that, a new address gets the same neutral message and nothing is sent. Magic links: 3 per address per hour. Send test: 5 per user per minute. No per-IP limit. Stage 3 may relax these if the email provider covers it: "likely they offer spam protection" (*unverified; checked in stage 3 `tech-stack.md`*; the CTO doubts it will justify relaxing, `reviews/S1-cto-r2.md` N-03). The user's idea was "a max number of sign-ups + limit on magic link + send". This overrides my recommendation of 3 links per address and 10 per IP per hour plus 5 send tests per user per minute, with no account cap.

### Stage 1 round 2 answers, P-054 (decided by: user)

- **PD-55** A place is taken when a magic link is requested for a new address. It is freed if the link expires unused after 15 minutes. Admins are exempt, and removing an account by hand frees a place. **The roles disagreed:** the CTO recommended this (N-01), because it bounds outbound email. The eng lead recommended that an account exists only after its first link is used, with the cap checked at request and at use (R2-M-03). The user chose the CTO's position.
- **PD-56** The mail-catcher runs in local development only and is never deployed. A deployed demo needs real sending to everyone; stage 3 decides how (OQ-07), for example a verified domain or Gmail SMTP. (CTO N-02: a reachable mail-catcher would let anyone read every magic link.) Amends PD-37.
- **PD-57** "Disabled by an admin" is stored on the user account, so a subscription the user deletes and recreates starts out disabled. (Matches eng lead R2-M-01.) This closes the gap where delete-and-recreate undid an admin disable.
- **PD-58** The event time is the source's own occurrence or publish time, and the injection time for a test event. Only three things reset the eligibility time: creating the subscription, switching it On, and an admin re-enable. Changing a channel or the URL does not. PD-38 now reads "events whose time falls in the disabled period are never sent". (Matches eng lead R2-M-02.) This narrows the "creation / edit" wording of PD-32, which the user has now approved.
- **PD-59** Switching Off cancels unsent deliveries, and manual retry is refused while the subscription is Off. (Matches eng lead R2-M-04.)

### Tier-two choices (product designer)

Accepted by the user in P-043:

- **PD-18** *Superseded by PD-27*: with one subscription per user there is no list to sort.
- **PD-19** *Superseded by PD-27 and PD-31*: subscriptions have no names, and what delete erases is now set by PD-31.
- **PD-20** The last 20 notifications are shown, now for the subscription rather than per alert: enough to judge it, without building search.

Not yet reviewed by the user:

- **PD-21** Test events are marked as tests in every notification and log, so a demo is never mistaken for a real disaster. The wording comes in stage 4.
- **PD-44** Saving the setup switches the subscription On. Saving is the opt-in, so no extra step is needed.
- **PD-45** The user's own Off is shown after "Disabled by an admin" and before the channel statuses in PD-39. An admin's stop explains more than the user's own switch.
- **PD-46** Admin actions record the admin and the time (CTO F-11). Several admins must be able to tell who did what.
- **PD-47** Slack URL rules: the `https://hooks.slack.com/` prefix only, masked after saving, never in admin views or logs (CTO F-08, eng lead m-07). The URL is a credential, and an open URL field is an outbound-request tool.
- **PD-48** Send test is optional and its result is shown (eng lead m-03). Requiring it would block users whose Slack is briefly down.
- **PD-49** The operator removes an account by hand on request, as documented in the README (CTO F-12). This closes the personal-data gap without building a feature, and it frees a place (PD-55).
- **PD-54** Allowlisted admin emails are exempt from the 10-place cap (PD-53). Otherwise ten strangers could lock the admins out of the admin view. The user confirmed the exemption in PD-55.
- **PD-60** While a delivery is being retried, its channel keeps the status it had before (eng lead R2-m-01). A status that flickers during retries tells the user nothing they can act on.
- **PD-61** A fetch that succeeds with nothing above the bar counts as healthy (eng lead R2-m-02). With a high bar, an empty fetch is the normal case and must not read as failing.
- **PD-62** Test events appear in the user's last 20 notifications, marked as tests (eng lead R2-m-04). The history then matches what the user actually received.

## Change log

- 0.1 (2026-11-04): first draft from the stage 1 answers (P-043).
- 0.1 (2026-11-04): follow-up answers recorded (P-044): PD-23 to PD-26 added, OQ-02 to OQ-05 closed.
- 0.2 (2026-11-04): stage 1 review round 1 and answers (P-049). The MVP is now one On/Off subscription per user (PD-27, PD-28), with a Post-MVP section (PM-01 to PM-03). PD-03, PD-05, PD-18 and PD-19 are superseded, and PD-08 in part. PD-29 to PD-43 added, plus tier-two PD-44 to PD-49. Scope is marked Must/Should and S-18 to S-22 added. Added R-03, the Attempt term in the glossary, the "sent once" wording, the Slack URL rules, the known-effects list, OQ-01a/b and OQ-06 to OQ-11.
- 0.2 (2026-11-04): OQ-08 to OQ-11 answered (P-051). PD-50 to PD-53 added, plus tier-two PD-54. OQ-08 to OQ-11 closed. S-02, S-04, S-08, S-12 and S-16, PM-02, NG-15/16, the known effects and the glossary updated.
- 0.3 (2026-11-04): stage 1 review round 2 and answers (P-054).
  - Added PD-55 to PD-59 and tier-two PD-60 to PD-62.
  - Amended PD-37 and reworded PD-38. PD-32 narrowed.
  - PD-35 now cites Slack's docs, and the PD-53 quote is marked unverified.
  - PD-13, PD-36 and PD-39 reworded.
  - Updated S-04, S-06, S-09 to S-13, S-15 and S-21, OQ-07, the known effects and NG-14. Added NG-17.
  - Glossary: added Event time, Eligibility time and Place.
