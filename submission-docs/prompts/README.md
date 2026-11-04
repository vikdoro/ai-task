# Prompt log

- `<phase folder>/prompts/prompts.md`: readable log of that phase's Claude Code prompts, with ID, date, permission mode and Claude Code's reply. The phase folders are listed in [`../phases.md`](../phases.md).
- [`raw/prompts.jsonl`](raw/prompts.jsonl): the raw log, one JSON event per line. This file is the source of truth.

Both files are written by the `UserPromptSubmit` and `Stop` hooks in [`.claude/settings.json`](../../.claude/settings.json), which run [`.claude/hooks/prompt_log.py`](../../.claude/hooks/prompt_log.py). Every phase's `prompts.md` is regenerated from the raw file on every event, split by the first prompt ID of each row in `phases.md`. To rebuild it by hand, run `python3 .claude/hooks/prompt_log.py --render`. Entries marked `"event": "Backfill"` were added by hand for prompts sent before the hooks existed.

Each prompt has an ID (`P-001`, ...) that is also its heading, so each phase's `decisions.md`, `interventions.md` and `checks.md` can link to `prompts/prompts.md#p-042`. IDs follow the order of the raw log, so prompts logged before IDs existed get one too. On every prompt the hook also gives Claude that ID and a reminder to log. It reports any tool call the user rejected, or interrupt, from the previous turn's transcript. Those show under that turn as **Signal** lines.

[`01-setup/prompts/prompts-elsewhere/`](../01-setup/prompts/prompts-elsewhere/) has the same two files for Claude Code sessions run outside this repo, such as the session in `~/dev/flow` (the workflow plugin) that copied the workflow in here. They were backfilled from that session's transcript.
