# CLAUDE.md

Rules for the main session only. Subagents never read this folder.

## Process logs

The brief evaluates how the AI was directed, not only what it built. Four logs in `submission-docs/` record that. They are written as the work happens, so the user never has to tag a prompt.

- **`prompts/prompts.md`** is written by the hook. Each prompt has an ID (`P-042`), and the hook gives Claude that ID at the start of every turn. It also reports any tool call the user rejected or any interrupt in the previous turn.
- **`decisions.md`** (`D-NN`) holds every tier-one decision and every decision about the process or tooling, whoever made it. A tier-two decision stays in the Decisions section of its artifact (a document in `feature-design/`, or `feature-design/local-demo/milestones/NN-*.md`). `decisions.md` links to that section and does not copy it. Tier three is not logged.
- **`interventions.md`** (`I-NN`, chronological) holds two kinds of entry. `REJECT`: output thrown away. `CORRECT`: output kept but changed in direction or substance.
- **`checks.md`** (`C-NN`, one table row each) holds every check the user answered, whether it passed or found something. See [Checks for the user](#checks-for-the-user).

Rules:

- When the user's prompt corrects, rejects or redirects earlier output, write the `interventions.md` entry before acting on it. Do the same when the hook reports a rejected tool call or interrupt that was a correction. A rejection that only meant "not now" is not one.
- Cite the prompt ID in every entry, and quote the user's own words briefly rather than paraphrasing them into a stronger claim. If the user gave no reason, write "not stated"; do not invent one.
- `Caught by` says who found it: the user, a test, the reviewer, or Claude checking its own claim. Checks Claude runs on itself count, but are labelled as such.
- For a decision, `Decided by` is `user` or `claude`. When the user overrides Claude's recommendation, record the recommendation too; that override is also a `CORRECT` entry.
- When the user says a phase of the work is done, close its row in `submission-docs/phases.md` with the last ID of each log, and open the next one.
- Only the main session writes these logs. Subagents return their decisions and findings, and the orchestrating skill logs them.
- Keep entries short: a heading line and three or four labelled list items (`- **What:** ...`), so GitHub does not merge them into one paragraph.

### Checks for the user

End a reply with a numbered **Checks for you:** list only when the reply:

- produced something the user is about to accept (a spec, code, a migration, a log entry), or
- states a fact from outside the repo that could be wrong (an API's behaviour, a library flag, a limit).

There is no fixed number of items. Every check must be worth the user's time, and an important one is never dropped to keep the list short. Checks still open from earlier replies go into the same list, never into a separate numbered one, so each number means one thing. Each item is concrete: a command to run, a `file:line` to read, or a claim to check and where. Otherwise leave the section out. A choice the user has to make is not a check: ask it outside the list.

The user answers by number, for example "Check 1, 2 done" or "Check 3: the threshold is wrong for crypto". Log each answered check as a row in `checks.md`:

- Restate what the check was, since "check 2" alone means nothing in the log. Link to the prompt whose reply listed it and to the prompt that answered it.
- A plain "done" is `OK`. That row is the whole record; nothing goes in `interventions.md`.
- A finding gets the result `Finding: <the user's words, short> → I-NN`, plus an `interventions.md` entry that holds the details and cites the `C-NN`. A finding that needs discussion is answered first, and both are logged once it is resolved.
- A check the user has not mentioned yet is not logged as passed.
