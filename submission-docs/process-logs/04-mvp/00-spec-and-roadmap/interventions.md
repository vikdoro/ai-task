# Interventions · MVP: spec and roadmap

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

### I-52 · CORRECT · [P-212](prompts/prompts.md#p-212)
- **Claude did:** started putting the product designer's eight tier-one questions to the user in batches (Q1 users and admins, Q2 kinds, Q3 markets, Q4 Slack first).
- **Caught by:** user, who interrupted the question batch: "I see three gaps we should see if we can tackle".
- **Why wrong:** not stated. The questions missed three gaps the user names: real login with a magic link, a basic design, and code open to more communication channels than email and Slack.
- **Changed:** the interview pauses; login is discussed first, then the other two gaps, before the spec questions resume.

### I-53 · CORRECT · [P-214](prompts/prompts.md#p-214)
- **Claude did:** recommended telling a refused person the rule plainly ("Only [redacted-domain] addresses can sign in", "All places are taken").
- **Caught by:** user: "Can we make the @[redacted-domain] rule a secret and just return "not on the allowlist" or similar?"
- **Why wrong:** not stated beyond keeping the domain rule secret.
- **Changed:** the refusal names no rule. See D-104.

### I-54 · CORRECT · [P-218](prompts/prompts.md#p-218)
- **Claude did:** the product designer recommended that users pick which kinds of event to follow (PM-14).
- **Caught by:** user, in the MVP spec interview, who picked "No, all three".
- **Why wrong:** not stated.
- **Changed:** an alert covers all three kinds, as in the demo. See D-111.

### I-55 · CORRECT · [P-218](prompts/prompts.md#p-218)
- **Claude did:** the product designer said the demo's market data licence (private, non-commercial use only) blocks the MVP, and recommended paying for licensed data.
- **Caught by:** user: "This is private, non-commercial use with me and the reviewer."
- **Why wrong:** it read the MVP as a public product. It is used privately by the user and the reviewer.
- **Changed:** markets stay, on the demo's source, with no new licence. See D-112.

### I-56 · CORRECT · [P-218](prompts/prompts.md#p-218)
- **Claude did:** the product designer recommended keeping DEC-27's bars but dropping sport and entertainment stories from news.
- **Caught by:** user, in the MVP spec interview, who picked "Keep DEC-27 as is".
- **Why wrong:** not stated.
- **Changed:** the bars stay as in the demo. See D-116.

### I-57 · CORRECT · [P-218](prompts/prompts.md#p-218)
- **Claude did:** the product designer recommended retrying temporary failures and showing the user a channel that keeps failing.
- **Caught by:** user, in the MVP spec interview, who picked "No retry".
- **Why wrong:** not stated.
- **Changed:** no retry, as in the demo, and failures show in the admin's daily counts. See D-117.

### I-58 · CORRECT · [P-220](prompts/prompts.md#p-220)
- **Claude did:** the product designer recommended showing the most common failure reasons next to each day's failed count (OQ-04).
- **Caught by:** user, who picked "Counts only".
- **Why wrong:** not stated.
- **Changed:** the admin view shows delivered and failed counts per channel per day, with no reasons. See D-118.

### I-59 · CORRECT · [P-224](prompts/prompts.md#p-224)
- **Claude did:** recommended windowing only news polling, with disasters and markets polled whenever an alert exists, plus an operator-only 24-hour switch to keep the spec's 24-hour live run (PD-17).
- **Caught by:** user: "Drop the 24-hour run plan / requirement. Make it 3 hours after each new user's signup, but turn off all sources after. When they first set up and alert."
- **Why wrong:** not stated beyond the rule itself, which limits all polling in the MVP.
- **Changed:** every source polls only inside a 3-hour window that opens when a user first sets up an alert. The 24-hour run is dropped from the spec. See D-124; the spec goes to v2.

### I-60 · CORRECT · [P-228](prompts/prompts.md#p-228)
- **Claude did:** recommended putting the local-demo run guide in a separate `RUNNING.md`, linked from the README.
- **Caught by:** user: "Make the running instructions part of the README."
- **Why wrong:** not stated.
- **Changed:** the guide replaces the README's run section. See D-128.

### I-61 · CORRECT · [P-228](prompts/prompts.md#p-228)
- **Claude did:** while testing the run guide in a fresh clone, sent `PUT /api/alert {"email":true,"slack":false}` to `127.0.0.1:3000`, taking it for the clone's server. The user's own demo server (from the repo folder) was on that port, and the clone's server had failed with `EADDRINUSE`, so the user's alert lost its Slack tick.
- **Caught by:** Claude checking its own output: the reply showed the user's real address, and the clone has no `.env`.
- **Why wrong:** Claude didn't check that the port was free, or which process answered, before writing.
- **Changed:** restored straight away with `PUT {"email":true,"slack":true}`, which brought back the earlier state (only `updated_at` changed). The clone test moved to port 3100. The guide now says `npm start` needs port 3000 free.

### I-62 · CORRECT · [P-229](prompts/prompts.md#p-229)
- **Claude did:** put the run guide into the README (D-128), and pointed the no-keys step at the test fixtures in `tests/fixtures/samples/full/`, whose events are partly made up.
- **Caught by:** user: "Do the running instructions as a separate document. Create a new samples folder on root for the offline demo. Use generic text, but include category in the message etc."
- **Why wrong:** not stated. This reverses I-60 and returns to Claude's first suggestion of a separate guide. The test fixtures also weren't written to be shown.
- **Changed:** the guide moves to its own document. A root `samples/` folder holds generic demo samples that name their category, and the demo reads them. See D-129.
