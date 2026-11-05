# Highlights

The catches worth reading first, picked from 65 interventions and 120 checks. Each line links to the log that holds the details. All of it is in [`phases.md`](process-logs/phases.md).

## Claims the AI made without checking

- **A licence claim that was never checked, and data already sent.** Claude said publisher RSS terms are "typically personal, non-commercial use, with attribution" without reading any of them. The executor read the terms while building M1, after public headlines had already gone to Gemini twice. The news path was rebuilt on a source with its own licence. [I-29](process-logs/03-local-demo/m1/interventions.md), D-44
- **"The type check is clean", twice.** Claude said `tsc` covered `tests/`. No tsconfig included them. After the fix, Claude said the error was gone, though its own TypeScript 7 run had already shown it wasn't. I caught both from the IDE. [I-64, I-65](process-logs/05-submission-polish/interventions.md)
- **Transcript markers named from memory.** Claude proposed a hook that detects interrupts by markers it had not looked at. It checked real transcripts before building, found it was wrong, and moved the scan. [I-01](process-logs/01-setup/interventions.md)
- **A search exclusion that only half worked.** `.ignore` kept folders out of the agents' search tools but not out of shell `grep`. A check I ran showed the gap. [I-39](process-logs/03-local-demo/m2/interventions.md)
- **A licence read too strictly.** The product designer said the market data licence blocked the MVP. The use is private and non-commercial, between me and the reviewer, so it doesn't. [I-55](process-logs/04-mvp/00-spec-and-roadmap/interventions.md)

## Side effects caught after the fact

- **A test that hit my real server.** Testing the run guide in a fresh clone, Claude sent a request to port 3000, where my own demo was running, and took away my alert's Slack channel. Claude spotted my real address in the response and restored the alert. The clone test moved to another port. [I-61](process-logs/04-mvp/00-spec-and-roadmap/interventions.md)
- **A commit missing most of its files.** A `cd` left the shell in a subfolder, so `git add .` staged only that folder. Claude found it by checking the commit stat, and the commit was redone. [I-11](process-logs/01-setup/interventions.md)

## Found by running the thing

- **The same story twice.** In the end-to-end run, two news events with one headline sent two identical alerts: "Why Alaska news appear twice?" That became a merge rule in the MVP spec. [I-51](process-logs/03-local-demo/m5/interventions.md), D-95
- **`localhost` went to a 404.** The hand check passed on `127.0.0.1`, but `localhost:3000` redirected to `/hu/`. [I-49](process-logs/03-local-demo/m4/interventions.md)
- **The reviewer failed a build.** The M1 build was missing evidence for a licence clause and had a news window that didn't match the spec. [I-32](process-logs/03-local-demo/m1/interventions.md)
- **Agents reviewing agents.** In the dropped design phase, the CTO found that open magic-link sign-in is a spam relay. The eng lead found contradictions in the delete and dedup rules. [I-18](process-logs/02-feature-design-dropped/interventions.md)

## Course corrections on scope and framing

- **The three-role design was thrown away.** It produced a 62-decision spec still built on guesses. The work restarted as a local demo, to learn the sources' limits first. [I-19](process-logs/03-local-demo/00-spec-and-roadmap/interventions.md), D-27
- **The spec had quietly dropped two thirds of the brief.** It covered earthquakes only, with news and markets deferred. All three kinds were put back. [I-25](process-logs/03-local-demo/00-spec-and-roadmap/interventions.md), D-32
- **Thresholds before data.** The AI proposed magnitude and percent bars, and caps, before any source had been fetched. I kept the bar open until M1's real responses settled it. [I-14](process-logs/02-feature-design-dropped/interventions.md), [I-21](process-logs/03-local-demo/00-spec-and-roadmap/interventions.md)
- **Wording the AI shouldn't own.** The spec drafted every message users would see before the data was known. The spec now says what each message must carry and leaves the wording to me. [I-24](process-logs/03-local-demo/00-spec-and-roadmap/interventions.md)
- **Live calls and live sends kept with me.** Agents send no live messages and call no live sources. I run those and paste the output. [I-36](process-logs/03-local-demo/m2/interventions.md), [I-33](process-logs/03-local-demo/m1/interventions.md)
- **Polling only when someone is listening.** The MVP polls every source only for 3 hours after a user's first alert setup, rather than all the time. [I-59](process-logs/04-mvp/00-spec-and-roadmap/interventions.md), D-124

## How the brief's open points were settled

| The brief leaves open | Settled as | Where |
|---|---|---|
| What "something important" means | One fixed bar per kind, set from real responses and aimed at 1.5 to 2.5 alerts a day. Disasters: GDACS Red, or Orange for earthquakes and cyclones. Markets: a daily move over a set percentage per instrument, such as 3% for SPY. News: 1,000 or more articles on one event. | [`lib/bars.ts`](../lib/bars.ts); [findings, "Candidate bars per kind"](feature-design/local-demo/findings/data-sources.md); DEC-27 in the [local-demo spec](feature-design/local-demo/product-spec.md) |
| Where the data comes from | GDACS for disasters, Twelve Data for markets, Event Registry for news, each chosen after a trial | [findings, "Recommended source per kind"](feature-design/local-demo/findings/data-sources.md) |
| How events are detected | Polling on a schedule (disasters every 10 minutes, markets every 15, news hourly), filtered by the bar, stored once per source event | [`nuxt.config.ts`](../nuxt.config.ts), [`server/tasks/poll/`](../server/tasks/poll/) |
| Who the users are, and who is an admin | Demo: one user. MVP: up to 5 people on one email domain, and admins listed in config | [MVP spec, "Users"](feature-design/product-spec.md) |
| Email and Slack | Resend for email, Slack webhooks. One message per event per channel, sent at once, with no retry | [delivery findings](feature-design/local-demo/findings/delivery.md) |
| "Add more channels later" | Each channel is its own sender. The MVP adds a channel registry and a test-only channel, to show one can be added without touching email or Slack | [`lib/delivery/`](../lib/delivery/); [MVP roadmap, M3](feature-design/mvp/roadmap.md) |
| The admin view | Read-only: events with whether each made the cut, alerts fired, daily delivery counts per channel, and when each source was last checked | [`app/pages/admin.vue`](../app/pages/admin.vue); [MVP spec, "This phase"](feature-design/product-spec.md) |
