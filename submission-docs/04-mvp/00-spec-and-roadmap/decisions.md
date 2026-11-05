# Decisions · MVP: spec and roadmap

Tier-one decisions and decisions about the process or tooling, newest last. Tier-two choices stay in the Decisions section of the artifact they shaped and are linked from here. Tiers and rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

`Decided by`: `user` or `claude`.

### D-102 · scope · MVP login is a magic link built in the app
- **Decided by:** user · [P-213](prompts/prompts.md#p-213), as recommended in reply to [P-212](prompts/prompts.md#p-212)
- **What:** email magic link with a hashed, single-use token that expires after 15 minutes, and a sealed-cookie session (`nuxt-auth-utils`). The token is stored in the app's own database. Sending needs a verified domain, and the login email is the default alert address. Admins are a short list of emails in config. Link requests are rate-limited.
- **Not chosen:** Better Auth; hosted auth (Clerk, Supabase Auth).

### D-103 · business rule · Only [redacted-domain] addresses, at most 3 users
- **Decided by:** user · [P-213](prompts/prompts.md#p-213); replaces Claude's invite allowlist
- **What:** a login link goes only to an `@[redacted-domain]` address, and no more than 3 user accounts may exist. Details still open: what counts as a seat, whether admins count, how a seat is freed, and the wording a refused user sees.

### D-104 · business rule · Access-rule details; the cap becomes 5
- **Decided by:** user · [P-214](prompts/prompts.md#p-214); revises D-103's cap and overrides Claude's plain refusal wording (I-53)
- **What:** at most 5 user accounts, set in config, as is the domain. A seat is taken when an account's first magic link is clicked. Admins don't take a seat. A seat is freed by hand by the operator, and admin removal of a user goes under Later. A refused address gets a message that doesn't reveal the domain rule; the exact wording is still to be confirmed.

### D-105 · business rule · Login messages approved
- **Decided by:** user · [P-215](prompts/prompts.md#p-215), as recommended
- **What:** a refused address, whatever the reason (domain or cap), sees "This email address isn't on the allowlist. Ask the operator for access." An accepted one sees "We've sent a sign-in link to {email}. It expires in 15 minutes."

### D-106 · process · The allowed email domain is a secret, kept out of the repo
- **Decided by:** user · [P-215](prompts/prompts.md#p-215)
- **What:** the domain is written as `[redacted-domain]` in every log, spec and prompt record, including those already written. Its value lives only in `.env`, which is gitignored; `.env.example` gets the key name alone. No agent writes the value into a tracked file.

### D-107 · scope · Email is sent from a separate domain the user verifies
- **Decided by:** user · [P-216](prompts/prompts.md#p-216)
- **What:** the sending domain is not the allowed login domain. The user verifies it with the email provider before real-user login can work.

### D-108 · scope · The MVP gets a basic design: fixed dark theme, web-safe fonts
- **Decided by:** user · [P-216](prompts/prompts.md#p-216)
- **What:** one dark theme with no light mode or theme switch, web-safe font stacks with no web-font downloads, and a basic yet modern look. Covers the user's screens and the admin view.

### D-109 · data model · Channels are modules in a registry, stored as rows
- **Decided by:** user · [P-217](prompts/prompts.md#p-217), as recommended
- **What:** each channel is one module behind a shared interface: name, contact input and its check, message formatting, send, failure classification, secret masking. A registry lists the channels, and matching, setup screen and admin counts loop over it. An alert's channels are rows (alert, channel, contact, on/off), and deliveries no longer hold a fixed list of channel names. Adding a channel is one module, one registry line and its tests.

### D-110 · scope · No third channel in the MVP; a test-only channel proves the registry
- **Decided by:** user · [P-217](prompts/prompts.md#p-217), as recommended
- **What:** the MVP ships email and Slack only. A test registers a fake channel and runs it end to end with no change to other code. Discord and Telegram go under Later.
- **Not chosen:** a Discord webhook; Telegram.

### D-111 · scope · An alert covers all three kinds; no per-user kind choice
- **Decided by:** user · [P-218](prompts/prompts.md#p-218); overrides the recommendation that users pick kinds (I-54)
- **What:** news, markets and disasters always go together, as in the demo. Picking kinds stays under Later (PM-14).

### D-112 · scope · Markets stay, on the demo's market source
- **Decided by:** user · [P-218](prompts/prompts.md#p-218); overrides the recommendation to license market data (I-55)
- **What:** the MVP is private, non-commercial use by the user and the reviewer, within the demo market source's terms. No new data licence.

### D-113 · scope · Alert email is fixed to the login email
- **Decided by:** user · [P-218](prompts/prompts.md#p-218), as recommended
- **What:** alerts go to the address the user logs in with. Changing it goes under Later.

### D-114 · scope · Slack is connected by pasting a webhook link
- **Decided by:** user · [P-218](prompts/prompts.md#p-218), as recommended
- **What:** the user pastes a Slack link that posts to one channel, with step-by-step help on the page. A "Connect Slack" button with direct messages goes under Later.

### D-115 · business rule · Simple merge of duplicate news items
- **Decided by:** user · [P-218](prompts/prompts.md#p-218), as recommended
- **What:** news items with the same headline, or an item the source says replaces another, count as one event and alert once. A broader merge of differently worded reports goes under Later.

### D-116 · business rule · Importance bars stay as DEC-27
- **Decided by:** user · [P-218](prompts/prompts.md#p-218); overrides the recommendation to drop sport and entertainment news (I-56)
- **What:** the per-kind bars are unchanged from the local demo.

### D-117 · business rule · Failed deliveries are not retried
- **Decided by:** user · [P-218](prompts/prompts.md#p-218); overrides the recommendation to retry and tell the user (I-57)
- **What:** as in the demo, a failed delivery is recorded and not retried. Retry and telling the user stay under Later (PM-13).

### D-118 · scope · Admin delivery view is counts only
- **Decided by:** user · [P-220](prompts/prompts.md#p-220); overrides the recommendation to show top failure reasons (I-58)
- **What:** daily delivered and failed counts per channel, with no failure reasons. Closes the spec's OQ-04.

### D-119 · scope · The MVP runs on one small always-on server; the provider is picked in the roadmap
- **Decided by:** user · [P-220](prompts/prompts.md#p-220), as recommended
- **What:** one always-on host with a persistent disk, a private URL and a low monthly cost, because the app keeps a local database file and polls on a schedule. The provider is chosen with the user when the roadmap is drafted.

### D-120 · process · MVP product spec v1 approved
- **Decided by:** user · [P-222](prompts/prompts.md#p-222), as recommended
- **What:** [`feature-design/product-spec.md`](../../../feature-design/product-spec.md) v1 is approved and locked, so any change is now a tier-one question. PD-17 (the goal numbers and the 24-hour run) and PD-18 (the test-only channel hidden from users) are accepted. Its length of about 1,450 words is kept, above the limit of about 1,200.

### D-121 · process · MVP milestone order
- **Decided by:** user · [P-223](prompts/prompts.md#p-223), as recommended
- **What:** M1 Sign-in, M2 Online, M3 Per-user alerts on the channel registry, M4 Signal and admin (news merge, daily counts), M5 Dark design, M6 Shippable run. Recorded in `feature-design/mvp/roadmap.md`.

### D-122 · scope · Hosting on Fly.io
- **Decided by:** user · [P-223](prompts/prompts.md#p-223), as recommended
- **What:** one small, always-on Fly.io machine with a volume for the database. This is the provider PD-11 leaves to the roadmap.
- **Not chosen:** Railway; a small VPS.

### D-123 · data model · The MVP starts a fresh database
- **Decided by:** user · [P-223](prompts/prompts.md#p-223), as recommended
- **What:** the MVP uses an empty database on the new schema. The demo's database file under `data/` is left untouched and not migrated.

### D-124 · business rule · All polling runs only in a 3-hour window after a user's first alert setup
- **Decided by:** user · [P-224](prompts/prompts.md#p-224); overrides Claude's news-only window and 24-hour switch (I-59)
- **What:** a user's first alert setup opens a 3-hour window. All three sources poll only while a window is open, and stop when none is. The 24-hour live run is dropped from the spec's "Shippable when", and PD-17's goals are revised to match. With at most 5 seats, the MVP polls for at most 15 hours in total. The spec is revised to v2.
- **Claude's tier-two choices within it:** windows that overlap run until 3 hours after the latest setup. Deleting and setting up the alert again does not open a new window, so that one account can't keep polling going.

### D-125 · business rule · News polls every 10 minutes inside a window
- **Decided by:** claude · [P-224](prompts/prompts.md#p-224), at the user's request ("make a call on how frequently")
- **What:** Event Registry is polled every 10 minutes while a window is open, up from hourly: 18 searches, or 90 tokens, per 3-hour window. Five windows come to 450 tokens at most, inside the 2,000 allowance even after the demo's use. Disasters stay at every 10 minutes and markets at every 15.

### D-126 · business rule · A window's alerts go to everyone with an alert set up
- **Decided by:** user · [P-225](prompts/prompts.md#p-225), as recommended
- **What:** while a window is open, every user with an alert set up at the time gets its alerts, not only the user whose setup opened it. Recorded in the spec as PD-23.

### D-127 · process · MVP spec v2 and roadmap v1 approved
- **Decided by:** user · [P-226](prompts/prompts.md#p-226)
- **What:** [`feature-design/product-spec.md`](../../../feature-design/product-spec.md) v2 (checking windows, PD-19 to PD-23) and [`feature-design/mvp/roadmap.md`](../../../feature-design/mvp/roadmap.md) v1 are approved and locked. The roadmap's tier-two choices are accepted with it: polling stays off on the server through M2 and M3, and the user runs every deploy and every host or domain change. M1 Sign-in is next.

### D-128 · process · A local-demo run guide and a record clean-up before the MVP milestones
- **Decided by:** user · [P-228](prompts/prompts.md#p-228); overrides Claude's separate `RUNNING.md` (I-60)
- **What:** the README's run section becomes a step-by-step guide that works from a fresh clone: the committed test samples, then real email, then Slack, then live sources. It is checked by following it in a fresh clone. The misplaced C-94 to C-96 rows go back to M5's `checks.md`, and every relative link in `submission-docs/` and `feature-design/` is checked.

### D-129 · process · Run guide in its own document; generic demo samples in `samples/` are the default
- **Decided by:** user · [P-229](prompts/prompts.md#p-229); reverses D-128's README placement (I-62)
- **What:** the guide is [`RUNNING.md`](../../../RUNNING.md), and the README keeps a four-command quick start that links to it. A committed root `samples/` folder holds three rounds of made-up events, each named by its category (for example "Natural disaster: Sample tropical cyclone"). `poll:once` and `npm start` replay it when `SAMPLES_DIR` is unset (`lib/config.ts`). The recorded spike samples now need `SAMPLES_DIR=spikes/samples`, and `CLAUDE.md` § Live data calls says so.

### D-130 · process · MVP spec-and-roadmap phase closes; a submission-polish phase opens
- **Decided by:** user · [P-231](prompts/prompts.md#p-231)
- **What:** this log phase closes at P-231. `05-submission-polish/` opens for polishing the submission deliverables: reflections, highlights, the plan of attack. MVP milestones open their own phases under `04-mvp/` when they start. Claude chose the folder name.
