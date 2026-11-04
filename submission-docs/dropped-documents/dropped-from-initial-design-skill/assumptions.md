Status: draft
Version: 0.3
Updated: 2026-11-04

# Assumptions

Every ambiguity in `original-brief.md`, the reading chosen and why. Each row points to the decision that settles it (`PD-NN`, `OQ-NN` or `PM-NN` in `product-spec.md`) instead of repeating it. Assumptions from other roles are added here as the orchestrator passes them on.

Status values:

- **settled**: the user decided it.
- **open**: still a question.
- **assumed**: a tier-two choice the user can veto.
- **superseded**: replaced by a later decision. Kept so the history stays visible.

| ID | Brief says | Ambiguity | Reading chosen | Why | Status |
|----|-----------|-----------|----------------|-----|--------|
| A-01 | "breaking news, market movements, natural disasters, that kind of thing" | Is this a closed list or examples? How many sources? | The three named categories, one source each, one common event shape. News and markets are cuttable (PD-42). | It shows the design spans categories without the cost of many sources. | settled, PD-01 |
| A-02 | (silent) "where the data comes from" | Live data or simulated? | Live public feeds plus an admin "inject test event". | Real data builds trust, and injection keeps the demo working on a quiet day. | settled, PD-02 |
| A-03 | "something important" | Who decides what is important, and how finely? | MVP: the system decides, with one fixed high bar per category. User-chosen levels are post-MVP. | The user chose the smallest MVP. | settled, PD-27, PD-28, PM-02 (was PD-03) |
| A-04 | "something important" | What are the actual bar values? | Not decided. The numbers come from live fetch output in `/build`; the news mechanism is settled in stage 3. | User: "Revisit this once we try the data source." | open, OQ-01a, OQ-01b |
| A-05 | "set up alerts" | How much does a user specify? | MVP: On/Off and channels only. There are no alerts per category. | User: "we just offer the user to opt in to the whole alert service or out." | settled, PD-27 (was PD-05), PM-01, PM-03 |
| A-06 | "get notified when something ... happens" | Can the same event arrive twice? | The system sends each event to a subscription once. A retry after a timed-out send may, rarely, deliver twice. | No HTTP channel guarantees exactly-once delivery. Repeats are what destroy trust. | settled, PD-06, S-05 |
| A-07 | "same real-world event" (from A-06) | How far does merging reach? | Within a category only. The keys per category, and what a revision does, are still open. | User: "Let's get back to this once we inspect the sources." | settled in part, PD-23; open, OQ-06 |
| A-08 | (silent) volume | Is there a cap on notifications? | No cap. Slack sending is paced (PD-35), but that does not limit what the user receives. | User decision. | settled, PD-07 |
| A-09 | (silent) control after setup | Can the user mute? | Yes, through the subscription's On/Off switch. Switching Off cancels unsent deliveries. There is no pause link in notifications and no quiet hours. | PD-27 added the switch on top of PD-08's "only edit". | settled, PD-08, PD-27, PD-59 |
| A-10 | "when something important happens" | Immediate or digest? | Immediate, with each source checked at least every 5 minutes. | "Breaking" implies speed. | settled, PD-09 |
| A-11 | "email and Slack" | Where does each channel deliver? | The account email address, and a pasted Slack webhook limited to `hooks.slack.com` and masked after saving. Send test for both. | This is the simplest real delivery. The URL is a credential. | settled, PD-10; assumed, PD-47 |
| A-12 | "email and Slack" | One channel or both? | Email, Slack or both, on the subscription. | Matches "both" in the brief. | settled, PD-11 |
| A-13 | "Should work for email" | Really sent, or only captured? | Really sent through one provider. In local development, everything except mail to the provider account's own address goes to a mail-catcher, which is never deployed. A deployed demo needs real sending to everyone, decided in stage 3. | There is no domain, and a reachable mail-catcher would expose every magic link. | settled, PD-12, PD-37, PD-56 |
| A-14 | (silent) failures | How are failures handled per channel? | Any channel: 3 retries over about 10 minutes, then failed. Slack exceptions: a 404 or 403 means broken, with no retry; a 400 is our bug, shown to the admin only; a 429 means wait, not retry. Slack 5xx errors and timeouts follow the general rule. | Every failure is visible to someone who can act on it. | settled, PD-13, PD-34, PD-35 |
| A-15 | "user told at once" (from A-14) | How is the user told that Slack is broken? | A status on the subscription, plus one email each time the channel goes from working to broken. | A broken Slack cannot carry the warning about itself. | settled, PD-24, PD-34 |
| A-16 | "flexible enough that we can add more channels later" | Code-level, or configurable in the product? | A code-level channel interface. | It meets the brief without building a plugin system. | settled, PD-14 |
| A-17 | "users" / "admin view" | Who can sign in, and who is an admin? | Open sign-up by magic link (single use, 15 minutes). There are 10 places, each taken when a link is requested for a new address and freed when the link expires unused or the account is removed by hand. Other limits: 3 links per address per hour, 5 send tests per user per minute, no per-IP limit. Admins come from a config allowlist and are exempt. | The user chose open sign-up with caps over the CTO's allowlist, and taking a place at request over the eng lead's "at first use". The provider's spam protection is unverified (stage 3). | settled, PD-15, PD-30, PD-53, PD-55; assumed, PD-54 |
| A-18 | "an admin view" | What does the admin do? | Operate the system: source health, logs, retry, inject, and disable a user. Every action is recorded with the admin's name. | This keeps the admin's job apart from the user's. | settled, PD-16; assumed, PD-46 |
| A-19 | "disable a misbehaving alert" (from A-18) | What does an admin disable do? | The flag is kept on the user account, so a recreated subscription starts out disabled. The owner sees "Disabled by an admin". Unsent deliveries are cancelled, and events whose time falls in the disabled period are never sent. Only an admin re-enables. The owner can still edit or delete. | The admin's stop cannot be undone by accident, not even by delete-and-recreate. | settled, PD-25, PD-38, PD-57 |
| A-20 | (silent) wording | Who writes the copy users see? | The product designer drafts it in stage 4, and the user approves it. | Copy is tier one. | settled, PD-17 |
| A-21 | (silent) platform | Web or mobile? | Web only. | Nothing in the brief points to mobile, and 24 hours rules it out. | assumed, accepted P-043 |
| A-22 | (silent) language | Which languages? | English only. | The brief is in English. | assumed, accepted P-043 |
| A-23 | (silent) test events | Could a test event alarm a real user? | It is marked as a test everywhere and reaches every subscription that is On and not disabled, strangers included (at most 10 places). It appears in the user's history. The admin picks a category and a title; there is no level in the MVP. | Open sign-up plus fan-out. This is a known effect. | assumed, PD-21, PD-62; settled, PD-36, PD-52 |
| A-24 | "something important" | Are events below the bar kept? | Everything below the MVP bar is dropped at fetch. PM-02 later starts with no history below the bar. | User: "Below the bar and user-chosen levels should not be part of the MVP." | settled, PD-26, PD-51 |
| A-25 | (silent) delete | What does deleting erase? | The subscription and its destinations, the webhook URL included. Delivery rows stay, labelled "deleted", and unsent deliveries are cancelled. An admin disable on the user survives. | This keeps the operations record without keeping a credential. | settled, PD-31, PD-57 |
| A-26 | "when something important happens" | Which events does a subscription get? | Only events whose event time (the source's own occurrence or publish time; for a test event, the time of injection) is not earlier than the eligibility time. There is no age window, so a catch-up after an outage can send late alerts. | User: "If event is older than alert creation / edit, don't send", narrowed in PD-58. | settled, PD-32, PD-58 |
| A-27 | (from A-26) "edit" | What resets the eligibility time? | Only creating the subscription, switching it On, and an admin re-enable. Changing a channel or the URL does not. | Off should mean off, and fixing a broken URL must not drop events in flight on the other channel. | settled, PD-50, PD-58 |
| A-28 | (silent) status | What can the user see about their subscription's health? | Disabled by an admin and Off apply to the whole subscription; the per-channel lists are in PD-39. A channel keeps its previous status while a delivery is being retried. | This gives a defined precedence that tests can check. | settled, PD-39; assumed, PD-45, PD-60 |
| A-29 | (silent) source outage | Who learns that a source is down? | Admins only. A source is "failing" after 3 failed fetches in a row; an empty fetch counts as healthy. | This keeps scope down. The gap against UN-06 is accepted. | settled, PD-41; assumed, PD-61 |
| A-30 | (silent) 24 hours | What is cut if time runs short? | News source, then market source, then manual retry, then the Slack-broken email. | This keeps a full demo on USGS plus inject. | settled, PD-42; order confirmed at roadmap gate |
| A-31 | (silent) magic links | How does a deployed demo send real email to every address? | Not decided. There will be no deployed mail-catcher. Options for stage 3: a verified domain, Gmail SMTP, or another provider. | To be discussed with the provider choice. | open, OQ-07; constrained by PD-56 |
| A-32 | (silent) manual retry and Off | Can an admin retry a delivery while the user has switched Off? | No. Switching Off also cancels unsent deliveries. | A user who opted out must not get messages. | settled, PD-59 |

## Decisions

- One table rather than a section per entry. It scans faster, and each row points to its decision.
- An assumption that follows from another one quotes the earlier decision in "Brief says", so the chain stays visible.
- Superseded readings are rewritten in place, with their old decision named in brackets. The table then always shows the current reading, and the change log shows the history.

## Change log

- 0.1 (2026-11-04): first draft from the stage 1 answers (P-043).
- 0.1 (2026-11-04): A-04, A-07, A-15, A-19 and A-24 updated with the follow-up answers (P-044).
- 0.2 (2026-11-04): stage 1 review round 1 and answers (P-049). A-03, A-05 and A-09 rewritten for the one-subscription MVP. A-04, A-06, A-07, A-11, A-13, A-14, A-15, A-17, A-18, A-19, A-23 and A-24 updated. A-25 to A-31 added. "Superseded" added as a status value.
- 0.2 (2026-11-04): A-17, A-23, A-24 and A-27 updated with the P-051 answers.
- 0.3 (2026-11-04): stage 1 review round 2 and answers (P-054). A-09, A-13, A-14, A-17, A-18, A-19, A-23 and A-25 to A-31 updated, and A-32 added.
