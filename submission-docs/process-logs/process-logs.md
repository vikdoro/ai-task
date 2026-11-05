# Process logs

The assessment weighs how the AI was directed and how its output was checked, not only what was built. Four logs record that as the work happens, so nothing is reconstructed afterwards and the user never tags a prompt by hand. The rules for writing them are in [`CLAUDE.md`](CLAUDE.md#process-logs); this page explains what each one holds and how to read them together.

| Log | IDs | Holds | Written by |
|---|---|---|---|
| `prompts/prompts.md` | `P-NNN` | Every prompt and Claude's reply, with date and permission mode | The prompt hook, automatically |
| `decisions.md` | `D-NN` | Tier-one decisions, and decisions about the process or tooling | Claude, in the main session |
| `interventions.md` | `I-NN` | `REJECT`: output thrown away. `CORRECT`: output kept but changed in direction or substance | Claude, in the main session |
| `checks.md` | `C-NN` | Every check the user answered, passed or not | Claude, in the main session |

Each phase of the work (setup, feature design, then the local demo's spec and roadmap and each roadmap milestone) has its own folder holding the four logs. [`phases.md`](phases.md) lists the folders and the ID range each covers. IDs run on across phases, so an ID is unique repo-wide. The raw prompt log stays one file, [`prompts/raw/prompts.jsonl`](prompts/raw/prompts.jsonl); the hook renders it into each folder's `prompts/prompts.md`.

## How they are written

- **Prompts.** `UserPromptSubmit` and `Stop` hooks run [`.claude/hooks/prompt_log.py`](../../.claude/hooks/prompt_log.py). Details are in [`prompts/README.md`](prompts/README.md). On every prompt the hook hands Claude the prompt's ID and a reminder to log, and reports any tool call the user rejected or interrupt in the previous turn. The other three logs cite prompts by that ID, so every entry links to the exchange it came from.
- **Decisions, interventions, checks.** Only the main session writes them. Subagents return their findings, and the main session and the `/build` skill log reviewer FAILs, walkthrough rejections and tier-one answers. A correction is logged before Claude acts on it.
- **What is not logged here.** Tier-two choices stay in the Decisions section of the document they shaped (a document in `submission-docs/feature-design/`, or `submission-docs/feature-design/local-demo/milestones/NN-*.md`). Tier three is left to the diff. Tiers are defined in [`CLAUDE.md`](../../CLAUDE.md#reviewing-decisions-tier-by-reversibility).

## How replies feed them

- **Checks for you.** A reply that produces something the user is about to accept or states an outside fact that could be wrong ends with a numbered list of checks. The user answers by number ("Check 1, 2 done"). Each answer becomes a `checks.md` row; a finding also gets an `interventions.md` entry.
- **Logged.** A reply that adds to `decisions.md` or `interventions.md` names the new entries on a **Logged:** line, so the user sees every addition without opening the files.

## Reading them

- **`Caught by`** in `interventions.md` says who found the problem: the user, a test, the reviewer, or Claude checking its own claim. Claude's self-checks count but are labelled as such.
- **`Decided by`** in `decisions.md` is `user` or `claude`. When the user overrode Claude, the entry records Claude's recommendation, and the override also appears in `interventions.md`.
- User quotes are the user's own words. "Not stated" means no reason was given; none is invented.
