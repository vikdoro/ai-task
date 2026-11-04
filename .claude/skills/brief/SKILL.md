---
name: brief
description: First interview about the product as a whole - turns a vague idea into brief.md, including the tech stack. Run once per app, after /setup and before /kickoff. Not for milestone-level work. Invoke as /brief.
---

You interview the user and write `brief.md`. This is the first conversation
about the product as a whole: what it is, who uses it, what it records, the
rules already known, the tech stack, and what is out of scope. It is not a
spec and not a plan; `/kickoff` does those from your output. You write no
code and no file other than `brief.md`.

Never commit or push.

## Preflight

If `brief.md` exists and has content beyond the setup stub, show the user what
is there and ask whether to extend it or start over. Never overwrite it
unasked. A missing file is fine; create it.

## Interview

Start from the assessment material: read `submission-docs/first-notes.md` and
`original-brief.md` first. The PM request quoted there is the product owner's
words; the user plays the engineer turning it into a brief. Do not ask what
those files already answer. Ask
in short rounds of two to four questions with AskUserQuestion, giving a
recommended default for each, and build on the answers. Do not ask what the
user already told you. Stop when every heading below can be written without
guessing.

Cover, in this order:

1. **What it is.** One paragraph in the owner's words.
2. **Who uses it.** Roles, and how many people.
3. **What it records.** The things it holds and the fields that matter. Ask
   about what must never be lost or wiped.
4. **Rules and thresholds you already know.** For example what counts as important enough to alert on, severity and market thresholds, dedup and rate-limit windows, retry and failure handling per channel, who is an admin, wording users see. Do not invent any.
5. **Tech stack and constraints.** Sort each point into:
   - **Fixed:** decided by the user; the architect will not reopen it.
   - **Open:** the user does not care; the architect picks and logs it.
   - **Preferences or avoid:** soft inputs, such as "prefer boring tech".
   Cover language, runtime, where it runs, storage, and whether a server or
   any dependency is acceptable. Offer a recommended default for each, and
   keep it simple: fewer moving parts wins unless the user says otherwise.
6. **Out of scope.** What it deliberately does not do.

Anything that deletes or migrates data, adds scope, adds a dependency or a
server, or can be read two ways is asked, never assumed.

## Write

Write `brief.md` with the headings "What it is", "Who uses it", "What it
records", "Rules and thresholds you already know", "Tech stack and
constraints" (with Fixed, Open and Preferences or avoid beneath it), and "Out
of scope". Put only what the user said or confirmed. Mark anything left unanswered as "Open question:" instead of filling it in,
and note whether it needs the PM or the user can decide it.

## Finish

End with the path, the open questions if any, and the next step: review
`brief.md`, then run `/kickoff`.
