#!/usr/bin/env python3
"""Claude Code hook: log prompts and replies to submission-docs/prompts/.

Registered for UserPromptSubmit and Stop. Appends one line per event to
submission-docs/prompts/raw/prompts.jsonl (source of truth), then regenerates
submission-docs/prompts/prompts.md from that file alone. Never blocks the session.

On UserPromptSubmit it also gives Claude the prompt's ID (P-001, P-002, ...)
and a reminder to log checks, corrections and decisions, plus any tool call
the user rejected or interrupt in the previous turn, read from the transcript.
The scan runs here, not on Stop, because Stop does not fire on an interrupt.

Run with --render to only regenerate the Markdown.
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or Path(__file__).resolve().parents[2])
DOCS = ROOT / "submission-docs" / "prompts"
RAW = DOCS / "raw" / "prompts.jsonl"
MD = DOCS / "prompts.md"

MODES = {
    "plan": "Plan mode",
    "default": "Default",
    "acceptEdits": "Accept edits",
    "auto": "Auto",
    "bypassPermissions": "Bypass permissions",
}

# Exact openings Claude Code writes into the transcript, checked against real
# transcripts on 2026-11-04.
REJECTED = "The user doesn't want to proceed with this tool use."
INTERRUPTED = "[Request interrupted by user"
REASON = "the user said:\n"

REMINDER = (
    "This prompt is {pid} (submission-docs/prompts/prompts.md#{anchor}). "
    "If it corrects, rejects or redirects earlier output, add an entry to "
    "submission-docs/interventions.md before acting on it. If it answers checks, "
    "log each in submission-docs/checks.md (a finding also gets an interventions.md entry). "
    "A tier-one or process decision made in this turn goes in submission-docs/decisions.md. "
    "Cite {pid} in the entry."
)


def last_reply_from_transcript(path):
    """Fallback: final assistant text of the turn, read from the transcript."""
    texts = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
            except ValueError:
                continue
            content = (entry.get("message") or {}).get("content")
            if entry.get("type") == "user" and isinstance(content, str):
                texts = []  # a new prompt starts a new turn
            elif entry.get("type") == "assistant" and isinstance(content, list):
                texts += [b["text"] for b in content if b.get("type") == "text" and b.get("text")]
    return "\n\n".join(texts)


def parse_time(iso):
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        return None


def block_text(content):
    if isinstance(content, list):
        return " ".join(b.get("text", "") for b in content if isinstance(b, dict))
    return content if isinstance(content, str) else ""


def signals_since(path, since):
    """Rejected tool calls and interrupts in the transcript after `since`."""
    tools, found = {}, []
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
            except ValueError:
                continue
            content = (entry.get("message") or {}).get("content")
            if not isinstance(content, list):
                continue
            if entry.get("type") == "assistant":
                for b in content:
                    if b.get("type") == "tool_use":
                        tools[b.get("id")] = b
                continue
            at = parse_time(entry.get("timestamp"))
            if entry.get("type") != "user" or at is None or at <= since:
                continue
            for b in content:
                if b.get("type") == "text" and b.get("text", "").startswith(INTERRUPTED):
                    found.append({"kind": "interrupted"})
                elif b.get("type") == "tool_result" and block_text(b.get("content")).startswith(REJECTED):
                    tool = tools.get(b.get("tool_use_id")) or {}
                    if tool.get("name") == "AskUserQuestion":
                        continue  # "clarify" on a question, not a rejection
                    inp = tool.get("input") or {}
                    text = block_text(b.get("content"))
                    found.append({
                        "kind": "rejected",
                        "tool": tool.get("name"),
                        "target": inp.get("file_path") or inp.get("command") or inp.get("description"),
                        "reason": text.split(REASON, 1)[1].strip() if REASON in text else None,
                    })
    return found


def describe(sig):
    if sig["kind"] == "interrupted":
        return "user interrupted Claude"
    if sig.get("tool") == "ExitPlanMode":
        out = "user rejected Claude's plan"
    else:
        out = f"user rejected a tool call ({sig.get('tool') or 'unknown'})"
    if sig.get("target"):
        out += f" on `{' '.join(str(sig['target']).split())[:120]}`"
    if sig.get("reason"):
        out += f', saying: "{" ".join(sig["reason"].split())[:300]}"'
    return out


def prompt_count():
    if not RAW.exists():
        return 0
    return sum(1 for e in iter_raw() if "prompt" in e)


def iter_raw():
    for line in RAW.read_text(encoding="utf-8").splitlines():
        try:
            yield json.loads(line)
        except ValueError:
            continue


def last_prompt_time(session_id):
    last = None
    if RAW.exists():
        for e in iter_raw():
            if "prompt" in e and e.get("session_id") == session_id:
                last = parse_time(e.get("logged_at"))
    return last


def context_for(pid, signals):
    """Text the UserPromptSubmit hook hands Claude for this turn."""
    text = REMINDER.format(pid=pid, anchor=pid.lower())
    if signals:
        text += (
            " In the previous turn: " + "; ".join(describe(s) for s in signals) + "."
            " If that was a course correction, log it in interventions.md as well."
        )
    return text


def record(payload):
    """Append the event to the raw log. Returns context for Claude, if any."""
    event = payload.get("hook_event_name")
    entry = {
        "logged_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "event": event,
        "session_id": payload.get("session_id"),
        "permission_mode": payload.get("permission_mode"),
    }
    context = None
    if event == "UserPromptSubmit":
        pid = f"P-{prompt_count() + 1:03}"
        since = last_prompt_time(entry["session_id"])
        signals = []
        if since and payload.get("transcript_path"):
            try:
                signals = signals_since(payload["transcript_path"], since)
            except OSError:
                pass
        entry["id"] = pid
        entry["prompt"] = payload.get("prompt", "")
        if signals:
            entry["prev_turn_signals"] = signals
        context = context_for(pid, signals)
    elif event == "Stop":
        reply = payload.get("last_assistant_message")
        if reply is None and payload.get("transcript_path"):
            reply = last_reply_from_transcript(payload["transcript_path"])
        entry["reply"] = reply or ""
    else:
        return None
    RAW.parent.mkdir(parents=True, exist_ok=True)
    with open(RAW, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return context


def load_turns():
    """Pair each reply with the latest unanswered prompt of its session."""
    turns, open_turn, last_turn, n = [], {}, {}, 0
    if not RAW.exists():
        return turns
    for e in iter_raw():
        sid = e.get("session_id")
        if "prompt" in e:
            n += 1  # IDs are positional, so entries logged before IDs existed get one too
            prev = last_turn.get(sid)
            if prev is not None and e.get("prev_turn_signals"):
                prev["signals"] = e["prev_turn_signals"]
            turn = {"id": e.get("id") or f"P-{n:03}", "at": e["logged_at"], "mode": e.get("permission_mode"),
                    "prompt": e["prompt"], "reply": None, "signals": []}
            turns.append(turn)
            open_turn[sid] = last_turn[sid] = turn
        elif "reply" in e:
            turn = open_turn.pop(sid, None)
            if turn is None:  # reply without a recorded prompt
                turn = {"id": None, "at": e["logged_at"], "mode": e.get("permission_mode"),
                        "prompt": None, "reply": None, "signals": []}
                turns.append(turn)
            turn["reply"] = e["reply"]
    return turns


def fmt_date(iso):
    try:
        return datetime.fromisoformat(iso).astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    except (TypeError, ValueError):
        return str(iso)


def render():
    out = ["# Claude Code Prompt Log", ""]
    turns = load_turns()
    for t in turns:
        # the heading is the bare ID so GitHub's anchor is #p-042
        out += [f"## {t['id'] or 'Unrecorded prompt'}", "", f"**User** · {fmt_date(t['at'])}", ""]
        if t["prompt"] is None:
            out.append("_Prompt not recorded_")
        else:
            # prompts are plain text: escape so GitHub doesn't eat <tags>
            prompt = t["prompt"].replace("&", "&amp;").replace("<", "&lt;")
            out += [f"> {line}" if line else ">" for line in prompt.splitlines() or [""]]
        out += ["", f"**Mode:** {MODES.get(t['mode'], t['mode'] or 'Unknown')}", "", "### Claude Code", ""]
        if t["reply"]:
            out.append(t["reply"].strip())
        elif t is turns[-1]:  # the newest prompt may still be in progress
            out.append("_Reply pending_")
        else:
            out.append("_No reply recorded (interrupted)_")
        if t["signals"]:
            out += [""] + [f"- **Signal:** {describe(s)}" for s in t["signals"]]
        out += ["", "---", ""]
    MD.parent.mkdir(parents=True, exist_ok=True)
    tmp = MD.with_suffix(".md.tmp")
    tmp.write_text("\n".join(out), encoding="utf-8")
    tmp.replace(MD)


def main():
    try:
        context = None
        if "--render" not in sys.argv:
            context = record(json.load(sys.stdin))
        render()
        if context:
            print(json.dumps({"hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit", "additionalContext": context}}))
    except Exception as exc:  # logging must never break the session
        print(f"prompt_log: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
