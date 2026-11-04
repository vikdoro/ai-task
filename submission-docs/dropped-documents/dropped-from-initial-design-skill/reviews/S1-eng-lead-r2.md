# S1 review, round 2: eng-lead

Reviewer: eng-lead. Date: 2026-11-04.
Reviewed: `feature-design/product-spec.md` v0.2 and `feature-design/assumptions.md` v0.2, against `original-brief.md` and my round-1 findings (`reviews/S1-eng-lead-r1.md`).
Settled by the user and not reopened: every PD marked as decided by the user. Left open on purpose and not counted as blockers: OQ-01a, OQ-01b, OQ-06 and OQ-07.

## 1. Round-1 blockers and majors

| R1 | Status | Where it is resolved, or why not |
|----|--------|----------------------------------|
| B-01 delete | **Resolved** | PD-31 and A-25 settle it: a hard delete, delivery rows kept and labelled "deleted", unsent deliveries cancelled. The user chose the CTO's position over my soft delete, which is fine. One new gap it opens is R2-M-01. |
| B-02 eligibility | **Resolved, with a new ambiguity** | PD-32, PD-50 and S-04 add the rule. But the rule does not say which clock it uses, or what counts as an edit. See R2-M-02. |
| B-03 dedup keys | **Answered: deferred by the user** | PD-33 and OQ-06 hold it, so it is not a blocker. I can write S-05 as category-agnostic FRs (at most one notification per subscription and event, and one delivery per channel), and add the per-category keys in `event-model.md` once OQ-06 closes. PD-06 is now reconciled with PD-23. |
| M-01 delivery vs attempt | **Resolved** | The glossary entries for Delivery and Attempt. |
| M-02 Slack 404 lifecycle | **Resolved** | PD-34 and S-09 settle it. S-20 is a cuttable Should. |
| M-03 Slack 429 | **Resolved** | PD-35 and the glossary entry for Attempt. One small gap is R2-m-03. |
| M-04 disable and in-flight deliveries | **Resolved, with a new contradiction** | PD-38 settles it. Combined with PD-31, though, it opens R2-M-01, and it uses a different clock from PD-32 (R2-M-02). |
| M-05 test-event recipients | **Resolved** | PD-36 and PD-52 settle it. The wording gap is R2-m-04. |
| M-06 who can sign in | **Resolved, with a new ambiguity** | PD-30, PD-53 and PD-54 settle it. What counts against the 10-account cap is not defined: R2-M-03. |
| M-07 status set | **Resolved** | PD-39, PD-45 and A-28 settle it. One wording gap is R2-m-01. |
| M-08 news mechanism | **Resolved** | PD-40 and OQ-01b. |
| M-09 source failing | **Resolved** | PD-41 and S-13 settle it. One wording gap is R2-m-02. |
| M-10 "at most once" | **Resolved** | The S-05 wording and A-06. |

## 2. New findings in v0.2

None is a blocker. The four majors are tier one: each one is a contradiction or a reading that can go two ways, inside decisions the user has made, and I cannot pick an answer for them.

### R2-M-01 · major · tier one · data shape: deleting and recreating the subscription gets around an admin disable
- **Where:**
  - PD-25: "Only an admin re-enables the alert."
  - PD-38: "The owner can still edit or delete a disabled subscription. Only an admin re-enables it."
  - PD-31: "Delete is a hard delete: the subscription and its destinations ... are erased."
  - S-03: a subscription is "one per user".
- **Check failed:** two decisions contradict each other.
- **Why it matters:** the disabled flag lives on the subscription, and a hard delete erases the subscription. A user whose subscription is disabled can delete it and set it up again, and the new one is On. That breaks "only an admin re-enables". It also decides where the flag lives in `data-model.md`.
- **Recommended default:** store "disabled by an admin" on the user account, not the subscription. A recreated subscription then starts out "Disabled by an admin". The admin's audit row (S-22) points to the user.

### R2-M-02 · major · tier one · business rule: which clock eligibility uses, and what counts as an edit
- **Where:**
  - PD-32 and S-04: "an event whose time is before the subscription's creation or last edit is not sent."
  - PD-38: "Events that arrive while disabled are never sent."
  - PD-50: "Switching the subscription On counts as an edit."
- **Check failed:** can be read two ways, and two rules use different clocks.
- **Why it matters:**
  1. **Which time.** "Its time" could be when the event happened, such as a quake's origin time, or when we stored it. Sources publish late. USGS, for example, can post a quake some minutes after its origin time. If the rule uses origin time, any save in that gap drops the event.
  2. **Which clock for disable.** PD-38 uses arrival ("arrive while disabled"), while PD-32 uses the event's time. Example: a quake happens at 10:50 while the subscription is disabled, the admin re-enables at 11:00, and the quake is stored at 11:05. PD-38 sends it, because it arrived after the re-enable. PD-32 does not apply, because re-enable is not called an edit. An e2e test cannot have one expected result.
  3. **What counts as an edit.** The MVP subscription has no criteria to edit. Any save, such as fixing a broken Slack URL, would reset eligibility for every channel, and an event still in the source's publishing lag would be dropped silently on email too.
- **Recommended default:**
  - "Event time" means the source's own occurrence or publish time. For a test event it is the time of injection.
  - The eligibility time is set only by creating the subscription, switching it On, and an admin re-enable. Channel or URL edits do not reset it.
  - Reword PD-38 to "events whose time falls in the disabled period are never sent", so that both rules use one clock.

### R2-M-03 · major · tier one · business rule: what counts against the 10-account cap
- **Where:** PD-53: "at most 10 accounts, after which a new address gets the same neutral message and nothing is sent." PD-54: admins are exempt.
- **Check failed:** can be read two ways.
- **Why it matters:** the account could be created when a link is requested, or when the link is first used. If it is created at request, 10 typed-in addresses fill the cap for good, and none of them ever signs in. With PD-37, links to non-provider addresses go to the mail-catcher, so that is likely. It is also unclear whether admins count toward the 10, and whether removing an account by hand (PD-49) frees a slot. An FR test needs a single number to check.
- **Recommended default:**
  - An account exists only after its first magic link is used.
  - The cap is checked when a link is requested and again when it is used.
  - Allowlisted admins do not count toward the 10.
  - Removing an account frees a slot.

### R2-M-04 · major · tier one · business rule: is manual retry allowed while the owner has switched Off?
- **Where:** PD-38: "Manual retry is refused for a subscription that is deleted or disabled, or whose webhook is broken." PD-50 says Off means nothing from the Off period is sent.
- **Check failed:** can be read two ways, and the Off state is not covered.
- **Why it matters:** PD-38 does not mention Off. If an admin can retry a failed delivery while the user has switched Off, a message reaches a user who opted out, which goes against "Off should mean off" (A-27). The rule also does not say whether switching Off cancels pending retries, as an admin disable does.
- **Recommended default:** switching Off cancels unsent deliveries, as PD-38 does for a disable. Manual retry is refused while the subscription is Off.

### Minors

- **R2-m-01 · status list per channel.**
  - **Where:** PD-39 says "Statuses are per channel" and lists Disabled first, but Disabled and Off belong to the whole subscription. A-28 puts Off in the per-channel list, and the spec adds it only through PD-45.
  - **Fix:** write the two lists out. Email: Disabled, Off, Last delivery failed, Active. Slack: Disabled, Off, Slack webhook no longer works, Last delivery failed, Active.
  - **Also:** say what a channel shows while a delivery is being retried. My default is the status it had before.
- **R2-m-02 · empty fetches.**
  - **Where:** S-13 and PD-41 say "failing after 3 failed fetches".
  - **Fix:** add "a fetch that succeeds with nothing above the bar is healthy", so an empty source is not read as failing.
- **R2-m-03 · the 30-minute clock.**
  - **Where:** PD-35, "still unsent after 30 minutes".
  - **Fix:** say where the 30 minutes start. My default is when the delivery is created. I can fix this in my NFRs as a tier-two choice unless the designer wants it in the spec.
- **R2-m-04 · "every matching user".**
  - **Where:** PD-36, "every matching user". There are no criteria left to match against.
  - **Fix:** "every subscription that is On and not disabled".
  - **Also:** say whether test events appear in the user's last 20 notifications (S-11). My default is yes, marked as tests.
- **R2-m-05 · A-14 reads as if only email is retried.**
  - **Where:** A-14, "Email: 3 retries over about 10 minutes."
  - **Why:** PD-13 applies to every channel. Slack 5xx errors and timeouts are not covered by PD-34 or PD-35, so they fall under PD-13.
  - **Fix:** reword A-14 to "Any channel: 3 retries ...; Slack exceptions: ...".

## 3. Coverage and testability

- **Coverage:** every part of the brief is still covered. Alerts are S-03, important events are S-01, S-02, S-18 and S-19, email and Slack are S-06 and S-07, more channels later is S-17, and the admin view is S-13 to S-16, S-21 and S-22. The Post-MVP move (PM-01 to PM-03) narrows "set up alerts" to an opt-in. That is a scope decision the user made, recorded in A-05. It is not a gap.
- **Testability:** with the four majors answered, I can write every Must item as FRs with unit or e2e criteria, without guessing. OQ-01a, OQ-01b and OQ-06 can be tested as parameters: bar values from config, and a dedup key function per category.

## Verdict

**PASS**: no blockers. Before stage 2 freezes the FRs, the user should answer R2-M-01 to R2-M-04, since each one changes an acceptance criterion or the data model.
