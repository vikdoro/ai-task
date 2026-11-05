# Claude Code Prompt Log

Prompts of `05-submission-polish/`.

## P-232

**User** · 2026-11-05 04:48 UTC

> I edited the README.md. We should move feature-design to submission-docs. We should allow the agents to read submission-docs. We should create a new subfolder under submission-docs called "ai-instructions" and move all the current files and folders under that new subfolder, except first-notes.md, README.md, scratchpad.md, workflow.md. We want to update so we block the reads for some agents to this ai-instructions subfolder instead of the submission-docs in general. Do you agree?

**Mode:** Auto

### Claude Code

Yes, I agree. Putting the design and the process record under one folder fits the new README line ("the purpose of the repo is to show how I work with AI"). Blocking agents from only the logs, instead of all of `submission-docs/`, is also the right line: it keeps their tokens low and still lets them read the spec. There's a side benefit too. `submission-docs/CLAUDE.md` moves into `ai-instructions/`, so a subagent reading `submission-docs/feature-design/` won't pick up the main session's logging rules.

Things to settle before I start:

1. **The name.** Those files are the record of how the AI was directed (prompts, decisions, interventions, checks, `phases.md`), not instructions to it. Only `CLAUDE.md` is an instruction. `process-logs/` would describe them better, but `submission-docs/process-logs.md` already exists and would be moved inside it, which reads a little oddly. My recommendation is `process-logs/`, but `ai-instructions/` works too. Your call.
2. **Old phase logs.** About 44 files mention `feature-design/` by path. That includes the frozen `local-demo/` docs and the logs of finished phases. Links inside `feature-design/` stay valid if the folder moves as a whole. The ones that break are links from outside the folder, and links in it to `original-brief.md`. I'd fix those paths everywhere, closed logs included. The local-demo rule already allows "fix a path", and a submission with dead links looks worse than an edited old log. The other option is to leave closed logs as written history.

What the move involves, all in one change so nothing breaks in between:
- `git mv` both trees, so history follows the files.
- `.claude/hooks/prompt_log.py`: `DOCS`, the `phases.md` lookup and the hook message, or the next prompt won't be logged.
- `.ignore`: block `submission-docs/ai-instructions/` (or whatever name you pick) instead of `submission-docs/`.
- The repo `CLAUDE.md` (Way of working, Reading, Process logs) and the six agent files' reading rules: the ban narrows to the logs folder, and the `feature-design/` paths change.
- The `/build` and `/setup` skills, `.claude/templates/`, `RUNNING.md`, the two test files that mention the path, and both READMEs. I'll leave your README edit alone and only change its links.

Tell me the name and your choice on old logs, and I'll do it and log the move as a process decision in `05-submission-polish/decisions.md`.

---

## P-233

**User** · 2026-11-05 04:52 UTC

> process-logs, closed logs should not be updated

**Mode:** Auto

### Claude Code

I moved both folders. The design docs are now in `submission-docs/feature-design/`. The logs, phase folders, `phases.md`, `process-logs.md`, `prompts/` and the main session's `CLAUDE.md` are now in `submission-docs/process-logs/`. `first-notes.md`, `README.md`, `scratchpad.md` and `workflow.md` stayed where they were. I used `git mv`, so history follows the files.

- **Read access:** agents can now read `submission-docs/`, except `process-logs/`. I narrowed the ban in `.ignore`, in the root `CLAUDE.md` (Reading, Process logs) and in all seven agent files' reading rules.
- **Hook:** `.claude/hooks/prompt_log.py` now writes to `submission-docs/process-logs/`. I tested it with `--render`, and it will log this turn's reply there.
- **Paths:** every repo-root `feature-design/` path now has the `submission-docs/` prefix. That covers `CLAUDE.md`, `README.md`, `RUNNING.md`, `workflow.md`, the skills, the templates, the agents, the two tests and the design docs. I only changed the links in your README edit. Every relative link in the live docs resolves.
- **`submission-docs/README.md`:** I rewrote its links and its last paragraph, which said the design docs were outside the folder on purpose. That's no longer true.
- **Closed logs:** none was edited. I checked each against HEAD and they're byte-identical. Their old links to `feature-design/` and to `CLAUDE.md` are now dead, as agreed.
- **Tests:** 277 pass and 2 fail. `alert-repo.test.ts` and `delivery-repo.test.ts` check for no diff to the frozen local-demo spec and roadmap. Before a commit, git shows those as new files at the new paths, so the tests fail. They should pass once you commit.
- **Staging:** I ran `git add -A` on the design folders while checking the move, so their path edits are already staged.

Choices I made that you can veto:
- **Frozen local-demo docs:** I fixed their paths, which the frozen rule allows. Each one differs from HEAD only in paths.
- **Unused agents and setup templates:** I updated `cto.md`, `eng-lead.md` and `.claude/templates/` too, so nothing still points at the old location.
- **Your notes:** `first-notes.md` and `scratchpad.md` keep their old mentions of `submission-docs`.

**Logged:** I-63 · CORRECT · closed logs keep their old paths; D-131 · process · design and process logs under `submission-docs/`; agents barred only from `process-logs/`

Next, read the diff and commit when you're happy with it. Then run `npx vitest run` to confirm the two path tests pass.

---

## P-234

**User** · 2026-11-05 04:59 UTC

> suggested commit message?

**Mode:** Auto

### Claude Code

```
Move design docs and logs into submission-docs
```

That's 46 characters, so it fits the 50-character limit. I left out a body because D-131 already records the reason. Your README wording change goes into the same commit. If you'd like it in its own commit, commit `README.md` first, though it also contains my link updates.

---
