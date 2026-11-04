Status: draft
Version: 1
Updated: 2026-11-04

# Stage 1 review, round 2: CTO

Reviewed: `feature-design/product-spec.md` (v0.2), `feature-design/assumptions.md` (v0.2), against `original-brief.md` and my round 1 (`reviews/S1-cto-r1.md`).
User decisions are settled and not reopened. OQ-01a/b, OQ-06 and OQ-07 are left open on purpose and are not blockers here.

External fact checked in this round (2026-11-04):

- Slack rate limits: https://docs.slack.dev/apis/web-api/rate-limits/ . Incoming webhooks allow 1 message per second, with short bursts. A 429 carries a `Retry-After` header in seconds. This confirms PD-35.

## Round 1 findings

| Finding | Severity r1 | State | Where |
|---------|-------------|-------|-------|
| F-01 Who may sign in; magic-link spam | blocker | **Answered** by the user: open sign-up (PD-30) with a 10-account cap and request limits (PD-53), admins exempt (PD-54). This overrides my allowlist default, which is fine. One gap the cap leaves is new finding N-01. | S-12, A-17 |
| F-02 What delete leaves | major | **Resolved**: PD-31, A-25. | S-10 |
| F-03 Test-event reach | major | **Resolved**: PD-36, plus a known effect in section 4. | S-16, A-23 |
| F-04 Revised events | major | **Deferred by the user**: PD-33, OQ-06. Not a blocker. | S-05 |
| F-05 Permanent Slack failures | major | **Answered**: PD-34 (404 and 403 are broken; 400 is our bug; 429 waits). This covers the three status codes the Slack docs list. | S-09, A-14 |
| F-06 Catch-up after an outage | major | **Answered**: PD-32 overrides my age window; the burst is written down as a known effect. The flood on first start is handled, because nothing earlier than a subscription's creation is sent. | S-04, A-26 |
| F-07 Email domain and quota | major | **Resolved**: PD-37, S-06 states the quota; magic links carried as OQ-07. See N-02 for a constraint OQ-07 must respect. | S-06, A-13 |
| F-08 Slack URL as outbound tool and secret | major | **Resolved**: PD-47, S-07. | S-07, A-11 |
| F-09 No cut line | major | **Resolved**: PD-42, Must/Should column. The revision cuts scope overall (no categories, levels or per-alert lists), so the fit with 24 hours is better than in v0.1. | Section 4 |
| F-10 "At most once" wording | minor | **Resolved**: S-05, A-06. | |
| F-11 Admin actions not attributed | minor | **Resolved**: S-22, PD-46. | |
| F-12 No data removal | minor | **Resolved**: NG-11, PD-49. | |
| F-13 Operator role | minor | **Resolved**: R-03. | |

No blocker from round 1 is still open.

## New findings

### N-01 · major · tier one · When an account takes one of the 10 places
- **Where:** product-spec S-12, PD-53, section 4 "Abuse limits come from caps, not IPs"; assumptions A-17.
- **Quote:** "at most 10 accounts, after which a new address gets the same neutral message and nothing is sent"
- **Check failed:** abuse of an outbound channel; a reading that can go two ways.
- **Why it matters:** the spec does not say whether a place is taken when a magic link is *requested* or when it is *used*. The two readings fail in opposite ways:
  - Counted at request: one script with no per-IP limit fills all 10 places with made-up addresses in seconds, and no real person can sign up again. Admins are exempt (PD-54), so the admin view survives, but the demo for anyone else does not.
  - Counted at first use: there is no cap on outbound email at all. A script can send magic links to any number of addresses, 3 per address per hour. This is the spam relay from round 1 F-01, and it uses up the provider's quota (100/day on Resend's free plan, checked in round 1), which also blocks alerts.
  Under PD-37 the demo only sends real email to the provider account's own address, so the risk is dormant today. It becomes real the moment OQ-07 is answered with real sending.
- **Question for the user:** when does an address take one of the 10 places?
  **Recommended default:** at request. An address whose link expires unused (15 minutes, PD-30) gives its place back. Reason: outbound email stays bounded (at most 10 unverified addresses at a time), and the worst case, a script holding the places, stops when it stops. Even so the bound is about 10 × 3 links/hour, roughly 720 emails a day, above the 100/day free quota. Stage 3 will check the chosen provider's quota against this figure and come back to the user if it does not fit, as PD-53 already allows.

### N-02 · major · tier one · A deployed mail-catcher would hand out everyone's magic links
- **Where:** product-spec S-06, PD-37, section 4 "No verified email domain"; assumptions A-13, A-31.
- **Quote:** "With no verified domain, real email reaches only the provider account's own address, and everything else goes to the mail-catcher (PD-37)."
- **Check failed:** auth gap.
- **Why it matters:** read literally, magic links for every address except one go to the mail-catcher. A mail-catcher is a web inbox with no login. If it runs anywhere other than a developer's laptop, anyone who can open it can sign in as any user, admins included. OQ-07 is open on purpose, but this is a constraint any answer to it must keep, and it is cheaper to fix in the spec now than to find in the build. A related point: in a deployed demo, an admin can sign in only if their email is the provider account's own address.
- **Question for the user:** may the mail-catcher run anywhere except a local machine?
  **Recommended default:** no. The mail-catcher runs only in local development and is never reachable from the network. In a deployed demo, an address that is not the provider account's own gets nothing, and the admin allowlist starts with that address. Reason: this closes an account-takeover path and leaves OQ-07 free to choose the provider.

### N-03 · minor · Unchecked claim that the provider offers spam protection
- **Where:** product-spec PD-53, assumptions A-17.
- **Quote:** "Stage 3 may relax these if the email provider covers it (\"likely they offer spam protection\")."
- **Check failed:** a claim about an external service, not checked.
- **Why it matters:** transactional providers filter what they receive and suspend senders after bounces and complaints. As far as I know they do not stop an app from sending magic links to addresses that never asked for them, and a suspension would take sign-in down with it. The text already makes relaxing the limits conditional, so this is minor.
- **Fix:** mark the quote "unverified; checked in stage 3 (`tech-stack.md`)". I will check it there and do not expect it to justify relaxing the limits.

### N-04 · minor · PD-35 states Slack's limit without a source
- **Where:** product-spec PD-35, S-07.
- **Quote:** "send at most 1 message per second per webhook"
- **Check failed:** a claim about an external API with no citation. I have checked it and it is correct; only the citation is missing.
- **Fix:** cite https://docs.slack.dev/apis/web-api/rate-limits/ in PD-35.

## Verdict

- `product-spec.md`: **PASS** (no blockers; majors N-01 and N-02 need user answers).
- `assumptions.md`: **PASS** (A-17 and A-31 change with N-01 and N-02).

Overall: **PASS**.
