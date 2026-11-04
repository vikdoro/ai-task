// Spike M2: send one plain-text test message by email (Resend) and to Slack (incoming webhook).
//   node --env-file-if-exists=.env spikes/send-test.mjs                    both channels
//   node --env-file-if-exists=.env spikes/send-test.mjs --channel=email    one channel (email|slack)
//   node --env-file-if-exists=.env spikes/send-test.mjs --dry-run          print the requests, send nothing
// Agents run it only with --import ./spikes/no-network.mjs.
// Exit 0 when every channel was delivered or skipped, 1 when any failed, 2 on bad usage.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as email from './channels/email-resend.mjs';
import * as slack from './channels/slack-webhook.mjs';

const CHANNELS = [email, slack];
const TIMEOUT_S = 10;
const USER_AGENT = 'ai-task-spike/0.1 (local evaluation script)';
const USAGE = 'usage: node --env-file-if-exists=.env spikes/send-test.mjs [--channel=email|slack] [--dry-run]';

// ---- arguments
let only = null;
let dryRun = false;
for (const a of process.argv.slice(2)) {
  if (a === '--dry-run') dryRun = true;
  else if (a.startsWith('--channel=') && CHANNELS.some((c) => c.NAME === a.slice('--channel='.length))) only = a.slice('--channel='.length);
  else {
    console.log(USAGE);
    process.exit(2);
  }
}

// ---- keys and redaction
const KEY_NAMES = ['RESEND_API_KEY', 'DEMO_USER_EMAIL', 'SLACK_WEBHOOK_URL'];
const env = Object.fromEntries(KEY_NAMES.map((k) => [k, process.env[k] || '']));
// Longest value first, so a value that contains another is replaced whole.
const secrets = KEY_NAMES.filter((k) => env[k]).sort((a, b) => env[b].length - env[a].length);
// Every string that is printed or saved goes through this.
function redact(s) {
  let out = String(s);
  for (const k of secrets) out = out.split(env[k]).join(`<${k}>`);
  return out;
}
const log = (...a) => console.log(redact(a.join(' ')));

// ---- the approved test message (spec 02, AC-2)
const runStart = new Date();
const utc = runStart.toISOString().replace(/\.\d{3}Z$/, 'Z');
const msg = {
  subject: 'World event alerts: test message',
  text: `This is a test message from the world event alerts local demo, sent ${utc}. No action needed.`,
};

// ---- samples: created on the first save, never in a dry run
const runDir = join(import.meta.dirname, 'samples', `delivery-${runStart.toISOString().replace(/[:.]/g, '-')}`);
let runDirMade = false;
function save(file, content) {
  if (!runDirMade) {
    mkdirSync(runDir, { recursive: true });
    runDirMade = true;
  }
  writeFileSync(join(runDir, file), redact(content));
}

// One request, 10-second timeout, no retry. Saves the raw response and a .meta.json.
async function request(name, req, ext) {
  const headers = { 'user-agent': USER_AGENT, ...req.headers };
  let body = req.body ?? null;
  try {
    body = JSON.parse(body);
  } catch {}
  const shown = { method: req.method, url: req.url, headers, body };
  const sentAt = new Date().toISOString();
  let res, text;
  try {
    res = await fetch(req.url, { method: req.method, headers, body: req.body, signal: AbortSignal.timeout(TIMEOUT_S * 1000) });
    text = await res.text();
  } catch (e) {
    const error =
      e.name === 'TimeoutError' || e.cause?.name === 'TimeoutError'
        ? `timeout after ${TIMEOUT_S}s`
        : `network error: ${e.cause?.code ?? e.code ?? e.name}: ${e.cause?.message ?? e.message}`;
    save(`${name}.meta.json`, JSON.stringify({ request: shown, sentAt, error }, null, 2));
    return { error: redact(error) };
  }
  const resHeaders = Object.fromEntries(res.headers);
  save(`${name}.${ext}`, text);
  save(`${name}.meta.json`, JSON.stringify({ request: shown, sentAt, status: res.status, statusText: res.statusText, headers: resHeaders }, null, 2));
  return { ok: res.status >= 200 && res.status < 300, status: res.status, text };
}

const ctx = { request };

// ---- run
const selected = CHANNELS.filter((c) => !only || c.NAME === only);
const missing = (c) => c.KEYS.filter((k) => !env[k]);
const skippedLine = (c) => `${c.NAME} skipped: ${missing(c).join(', ')} not set`;

if (dryRun) {
  for (const c of selected) {
    if (missing(c).length) {
      log(skippedLine(c));
      continue;
    }
    const r = c.buildRequest(env, msg);
    log(`${c.NAME} would send:`);
    log(`  ${r.method} ${r.url}`);
    for (const [k, v] of Object.entries({ 'user-agent': USER_AGENT, ...r.headers })) log(`  ${k}: ${v}`);
    log(`  body: ${r.body}`);
  }
  log('dry run: nothing sent');
  process.exit(0);
}

const results = await Promise.all(
  selected.map(async (c) => {
    if (missing(c).length) return skippedLine(c);
    let r;
    try {
      r = await c.send(ctx, env, msg);
    } catch (e) {
      r = { state: 'failed', detail: `unexpected error: ${e.message}` };
    }
    const sep = r.state === 'failed' ? ': ' : ' ';
    return { line: `${c.NAME} ${r.state}${sep}${r.detail}`, failed: r.state === 'failed' };
  }),
);

let failed = false;
for (const r of results) {
  if (typeof r === 'string') log(r);
  else {
    log(r.line);
    failed ||= r.failed;
  }
}
if (runDirMade) log(`samples in ${runDir}`);
process.exit(failed ? 1 : 0);
