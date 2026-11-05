# Interventions · Feature design (dropped)

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

### I-12 · CORRECT · [P-038](prompts/prompts.md#p-038)
- **Claude did:** recommended a new `/design` skill that leaves `/kickoff` untouched, "so the old path is still there as a record" ([P-037](prompts/prompts.md#p-037)).
- **Caught by:** user.
- **Why wrong:** not stated. The user kept the name: "Replace kickoff (but use 'design' I like the term better)."
- **Changed:** `/design` replaces `/kickoff`. See D-14.

### I-13 · CORRECT · [P-040](prompts/prompts.md#p-040)
- **Claude did:** kept `/brief` as an optional skill, with `/design` reading `brief.md` when it has content ([P-039](prompts/prompts.md#p-039)).
- **Caught by:** user.
- **Why wrong:** "no need to keep it if we know we will start in this repo with the design, it just adds noise."
- **Changed:** the `/brief` skill and `brief.md` are deleted. `/design` starts from `original-brief.md` alone. See D-17.

### I-14 · CORRECT · [P-043](prompts/prompts.md#p-043)
- **Claude did:** the product designer recommended threshold values (quakes M6.0/M5.0, markets 5%/3%, news by breaking feed and keyword), one optional keyword, region or asset filter per alert, a cap of 5 notifications per alert per hour with an overflow summary, and pause/resume with a pause link in every notification.
- **Caught by:** user, answering the stage 1 questions.
- **Why wrong:** thresholds: "Revisit this once we try the data source." The other three: not stated.
- **Changed:** threshold values stay open until a source is tried; alerts take category and level only; no rate cap; "Only edit per alert", with no pause. See D-18.

### I-15 · CORRECT · [P-044](prompts/prompts.md#p-044)
- **Claude did:** the product designer recommended storing events below "Notable", marked and never sent, so real data could settle the open threshold values.
- **Caught by:** user, answering the follow-up questions.
- **Why wrong:** not stated.
- **Changed:** events below "Notable" are dropped at fetch. Threshold values have to be settled from what the source returns when it is fetched. See D-19.

### I-16 · CORRECT · [P-049](prompts/prompts.md#p-049)
- **Claude did:** recommended:
  - an allowlist for sign-in (the CTO's position)
  - a 60-minute age window on top of the created/edited rule for which events are sent
  - dedup keys for each category
  - a sign-in route through the mail-catcher when there is no domain
  - two system levels per category, chosen per alert, as agreed in D-18
- **Caught by:** user, answering the review questions.
- **Why wrong:** for the age window, the user gave a rule instead: "If event is older than alert creation / edit, don't send." For dedup: "get back to this once we inspect the sources". For magic links: "discuss later when selecting third-party service". For levels: "we shouldn't set up levels for the MVP, just an on-off". For sign-in: not stated.
- **Changed:** open sign-up; the created/edited rule only, with no age window; dedup keys and magic-link delivery left open; the MVP becomes one on/off subscription, with categories, levels and filters moved to post-MVP. See D-21 to D-23.

### I-17 · CORRECT · [P-051](prompts/prompts.md#p-051)
- **Claude did:** the product designer recommended limits for open sign-up of 3 magic links per address and 10 per IP per hour.
- **Caught by:** user.
- **Why wrong:** the user asked whether these were easy to build and suggested "a max number of sign-ups + limit on magic link + send".
- **Changed:** at most 10 accounts, 3 links per address per hour, 5 send tests per user per minute, and no per-IP limit. See D-24.

### I-18 · CORRECT · [P-045](prompts/prompts.md#p-045) – [P-054](prompts/prompts.md#p-054)
- **Claude did:** the product designer's stage 1 draft (v0.1) of `product-spec.md` and `assumptions.md`.
- **Caught by:** the CTO, round 1 FAIL: F-01, magic-link sign-in open to anyone is a spam relay. The eng lead, round 1 FAIL: B-01, delete contradicts itself; B-02, no rule for which events are sent; B-03, the dedup rules contradict each other.
- **Why wrong:** in the reviewers' words, "I could not write functional requirements without inventing a business rule" (eng lead).
- **Changed:**
  - v0.2: open sign-up capped at 10 accounts; hard delete; the created/edited eligibility rule; dedup keys left open as OQ-06; the MVP cut to one subscription (D-21 to D-24).
  - v0.3: round 2 majors (D-25, D-26).
  - Both reviewers passed round 2.

