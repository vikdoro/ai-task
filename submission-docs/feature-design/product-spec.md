Status: approved
Version: 2
Updated: 2026-11-05

# Product spec: world event alerts (MVP)

## Problem

A professional wants to hear at once when something important happens in the world, such as major news, a big market move or a serious disaster, without watching the news. Generic news apps alert too often and too vaguely. They want few alerts, each worth reading, in email and Slack. The local demo proved the loop on real data and delivery (`submission-docs/feature-design/local-demo/product-spec.md`, "Phase 1: the local demo"). The MVP puts it online for private, non-commercial use by the product manager and one reviewer.

## Users

- **User:** up to 5 people with an address on `[redacted-domain]`. Wants to sign in fast, set up one alert, and trust every message. Never sees other users or admin information.
- **Admin:** an operator on a short list of addresses. Wants to see what came in, what fired, and whether each channel delivers. Changes nothing. Never sees a user's address, Slack link or message content.

## Goals

- **G-01 Quick setup:** from sign-in link to saved alert in under 2 minutes, with no help beyond the page.
- **G-02 Few alerts:** across all checking windows, on average no more than one alert per window, in line with the demo's 1.5 to 2.5 a day (DEC-27). Read from the admin view.
- **G-03 No repeats:** no story arrives twice on a channel, across all windows.
- **G-04 Delivery at a glance:** the admin sees on one screen whether each channel delivers.

## User journeys

**J-01 Sign in and set up the alert (main):**

1. "I enter my work email on the sign-in page."
2. "I'm told a link was sent and expires in 15 minutes."
3. "I click the link in my inbox and I'm in."
4. "I choose email, Slack or both. For Slack, I follow the steps on the page to make a link to my channel, and paste it."
5. "I save. My alert covers breaking news, market movements and natural disasters, and shows where it goes. I'm told alerts come only for the next 3 hours."
6. "Within those 3 hours, when something important happens, one message arrives on each channel: what happened, and where and when."

Others:

- **J-02 Change channels** on the existing alert.
- **J-03 Delete the alert** after confirming. Nothing more is sent; setting it up again resends nothing past.
- **J-04 Refused sign-in:** the address sees the approved refusal message.
- **J-05 Admin watches:** events in, alerts fired, daily delivery counts per channel, each source's status.

## This phase

- **Sign-in and seats** as in PD-01: an emailed link, one allowed domain, at most 5 accounts.
- **Checking windows:** a user's first alert setup starts 3 hours in which all three sources are checked. Outside a window, no source is checked and no alert is sent. Everyone with an alert set up gets a window's alerts (PD-19 to PD-23).
- **One alert per user**, always covering all three kinds. The user sets only channels: email to the login address, and Slack by a pasted link.
- **Importance:** the demo's bar per kind, unchanged (DEC-27, DEC-30; `submission-docs/feature-design/local-demo/findings/data-sources.md`, "Candidate bars per kind").
- **Delivery:** at once, at most one message per event per channel, ever. No cap, pause or retry.
- **News repeats:** items with the same headline, or an item the source says replaces another, are one event.
- **Messages:** what happened, and where and when if available and appropriate. Disaster messages credit their source. Times in the user's time zone, with UTC.
- **Admin view, read-only:** every event, newest first, marked with whether it made the cut; alerts fired; daily delivered and failed counts per channel; when each source was last checked.
- **Channels as separate parts:** email and Slack ship; a test-only channel, hidden from users, proves one can be added.
- **Look:** one fixed dark theme on all screens (PD-01).
- **Approved wording:** refused: "This email address isn't on the allowlist. Ask the operator for access." Accepted: "We've sent a sign-in link to {email}. It expires in 15 minutes."

**Shippable when:**

- J-01 to J-05 work online for both people.
- Refused addresses, used links and expired links all fail to sign in.
- No source is checked outside a window.
- The test-only channel was added without changing email or Slack.

## Chosen services

- **Data sources:** GDACS for disasters, Twelve Data for markets, Event Registry for news (`submission-docs/feature-design/local-demo/findings/data-sources.md`, "Recommended source per kind (for the user to confirm)").
- **Tech stack:** Nuxt 4 with TypeScript, and SQLite (`submission-docs/feature-design/local-demo/milestones/03-events-in-and-the-admin-view.md`, its Stack decision).
- **Delivery services:** Resend for email, Slack incoming webhooks (`submission-docs/feature-design/local-demo/findings/delivery.md`, "Email: Resend" and "Slack: webhooks").
- **Hosting:** provider chosen in the roadmap (PD-11).

## Later

- **PM-01** User picks kinds. Now: all three. From PD-02.
- **PM-02** User changes the alert email. Now: the login email. From PD-04.
- **PM-03** A "Connect Slack" button. Now: a pasted link. From PD-05.
- **PM-04** Merging differently worded items about one story. Now: same headline or replaced item. From PD-06.
- **PM-05** Retrying failed deliveries and telling the user. Now: no retry; failures counted for the admin. From PD-08.
- **PM-06** Admin removes a user. Now: the operator, by hand. From PD-01.
- **PM-07** Discord and Telegram. Now: email and Slack. From PD-01.
- **PM-08** User picks an importance level. Now: one bar per kind. From DEC-04.
- **PM-09** Location filter. Now: anywhere. From DEC-06.
- **PM-10** Cap or digest. Now: instant. From DEC-07.
- **PM-11** Admin tunes bars, as designed in DEC-32. Now: the team sets them. From DEC-08.
- **PM-12** Teams and shared Slack channels. Now: each person's own. From DEC-01.
- **PM-13** Pausing an alert. Now: change or delete. From DEC-18.
- **PM-14** Checking the sources all the time. Now: only in the 3-hour window after each user's first setup. From PD-19.

## Non-goals

Open sign-up; public or commercial use; user-set importance; a light mode or theme switch; admin actions that change anything; failure reasons for the admin; merging events across kinds.

## Open questions

- **OQ-01 Wording users see:** messages, in-app text, the delete confirmation, errors and the notice that alerts come only for 3 hours after setup, drafted when built and approved by the user (the demo's OQ-07).
- **OQ-02 Few disasters may alert:** the demo's OQ-11, still open.
- **OQ-03 News allowance.** Closed: the windows cap news checks at 450 tokens in total (PD-22).
- **OQ-04 Failure reasons.** Closed: counts only (PD-10).
- **OQ-05 Slack link kinds:** the demo's kind needs a paid Slack plan (`submission-docs/feature-design/local-demo/findings/delivery.md`, "The two webhook kinds"). Which kinds the help covers is open.

## Decisions

By the user, before the interview:

- **PD-01** Sign-in by an emailed link, built in, single-use, expiring in 15 minutes, sent from a separate domain the user verifies; login email is the alert address. One allowed domain and at most 5 accounts, set by the operator; a seat is taken at the first link click and freed by hand. Admins are a short list set by the operator, taking no seat. The two sign-in messages as worded. A basic modern look: one fixed dark theme, web-safe fonts. Each channel a separate part; email and Slack ship, with a test-only channel, because the brief asks for more channels later.

By the user, in the interview:

- **PD-02** All three kinds, always. **Override:** I recommended letting the user pick.
- **PD-03** Markets stay on the demo's source, with no new licence. **Override:** I recommended licensing market data. User: "This is private, non-commercial use with me and the reviewer."
- **PD-04** Alert email fixed to login email, as recommended. Reason: no extra setup.
- **PD-05** Slack by pasted link with step-by-step help, as recommended. Reason: proven in the demo.
- **PD-06** Simple news merge, as recommended. Reason: two identical alerts (`submission-docs/feature-design/local-demo/findings/delivery.md`, "M5 journey run").
- **PD-07** DEC-27 kept exactly. **Override:** I recommended dropping sport and entertainment news.
- **PD-08** No retry. **Override:** I recommended retrying and telling the user.
- **PD-09** Daily counts per channel replace per-delivery rows; read-only, no contact details or content (DEC-31, DEC-33), as recommended. Reason: the user's own design.
- **PD-10** Counts only, with no failure reasons. **Override:** I recommended showing the commonest reasons.
- **PD-11** One small always-on server with a persistent disk, a private address and low monthly cost; provider chosen in the roadmap.
- **PD-12** Carried from the demo: DEC-07, DEC-14 to DEC-17, DEC-19, DEC-21, DEC-28. Reason: they held.

By me, accepted by the user:

- **PD-13** IDs restart; demo DEC IDs are cited as sources.
- **PD-14** No glossary, for brevity.
- **PD-15** The seat limit is "set by the operator", so it changes without a revision.
- **PD-16** A refused address sees only the approved message, even when seats are full.

By me, accepted by the user at approval:

- **PD-17** The numbers in G-01, G-02 and G-03. Reason: makes the goals checkable. Revised in v2: G-02 and G-03 are checked across the windows, since the user dropped the 24-hour run (PD-19).
- **PD-18** The test-only channel is hidden from users. Reason: it only proves extensibility.

By the user, while drafting the roadmap:

- **PD-19** No 24-hour run. A user's first alert setup opens a 3-hour window in which all sources are checked; none is checked otherwise, so at most 15 hours in the MVP. **Override:** the main session recommended windowing only news and keeping the 24-hour run. User: "Drop the 24-hour run plan / requirement. Make it 3 hours after each new user's signup, but turn off all sources after. When they first set up and alert."
- **PD-23** Everyone with an alert set up at the time gets a window's alerts, not only the user who opened it, as recommended. Reason: sources are checked for all while a window is open.

By Claude, open to veto:

- **PD-20** Overlapping windows run until 3 hours after the latest first setup. Reason: one simple rule, and no gap.
- **PD-21** Deleting the alert and setting it up again opens no new window. Reason: keeps the 15-hour ceiling.
- **PD-22** News is checked every 10 minutes in a window: at most 90 tokens a window, 450 in total. Reason: the user asked for it, and it fits the allowance.

## Change log

- v1 (2026-11-05): first MVP draft, from the user's pre-interview decisions and interview answers. Revised before approval: closed OQ-04, added hosting and Chosen services, merged the pre-interview decisions into PD-01. Approved by the user, with PD-17 and PD-18 accepted and the length (about 1,450 words) kept.
- v2 (2026-11-05): checking windows replace the 24-hour run (PD-19 to PD-22). Updated G-02, G-03, J-01, This phase, Shippable when, PD-17, OQ-01 and OQ-03; added PM-14.
