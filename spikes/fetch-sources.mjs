// Spike M1: fetch real samples from every source, print what came back, save the raw responses.
//   node --env-file-if-exists=.env spikes/fetch-sources.mjs           one round
//   node --env-file-if-exists=.env spikes/fetch-sources.mjs --watch   4 rounds, one minute apart
// Exit 0 when every source was ok or skipped, 1 when any source failed.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fetchGdacs, printEvents, diffEvents } from './sources/gdacs.mjs';
import { fetchTwelveData, printQuotes, diffQuotes } from './sources/twelvedata.mjs';
import { fetchEventRegistry, printEvents as printNewsEvents, diffEvents as diffNewsEvents } from './sources/eventregistry.mjs';

const WATCH = process.argv.includes('--watch');
const ROUNDS = WATCH ? 4 : 1;
const ROUND_MS = 60_000;
// Twelve Data allows 8 credits a minute; one round is 6. Keep at least this long between calls
// so no 60-second window ever holds two rounds' worth.
const TWELVE_DATA_SPACING_MS = 61_000;
const TIMEOUT_MS = 20_000;
const USER_AGENT = 'ai-task-spike/0.1 (local evaluation script)';

const KEY_NAMES = ['TWELVE_DATA_API_KEY', 'EVENT_REGISTRY_API_KEY'];
const env = Object.fromEntries(KEY_NAMES.map((k) => [k, process.env[k] || '']));

// Every string that is printed or saved goes through this.
function redact(s) {
  let out = String(s);
  for (const k of KEY_NAMES) if (env[k]) out = out.split(env[k]).join(`<${k}>`);
  return out;
}
const log = (...a) => console.log(redact(a.join(' ')));

const runStart = new Date();
const runDir = join(import.meta.dirname, 'samples', runStart.toISOString().replace(/[:.]/g, '-'));
mkdirSync(runDir, { recursive: true });

function saver(dir) {
  mkdirSync(dir, { recursive: true });
  return (file, content) => writeFileSync(join(dir, file), redact(content));
}

let lastTwelveData = 0;
async function twelveDataGate() {
  const wait = lastTwelveData + TWELVE_DATA_SPACING_MS - Date.now();
  if (lastTwelveData && wait > 0) await sleep(wait);
  lastTwelveData = Date.now();
}

// Event Registry: one search per round at most (spec budget).
let eventRegistryRequests = 0;
const countEventRegistryRequest = () => {
  eventRegistryRequests += 1;
};

function makeCtx(dir) {
  const save = saver(dir);
  async function get(name, url, opts = {}) {
    const { file, method = 'GET', headers = {}, body, requestFile, timeoutMs = TIMEOUT_MS } = opts;
    const reqHeaders = { 'user-agent': USER_AGENT, ...headers };
    const shownHeaders = Object.fromEntries(
      Object.entries(reqHeaders).map(([k, v]) => [k, /key|auth/i.test(k) ? '<redacted>' : v]),
    );
    const request = { method, url, headers: shownHeaders };
    if (requestFile) save(requestFile, JSON.stringify({ ...request, body: JSON.parse(body) }, null, 2));
    const fetchedAt = new Date().toISOString();
    let res;
    try {
      res = await fetch(url, { method, headers: reqHeaders, body, signal: AbortSignal.timeout(timeoutMs) });
    } catch (e) {
      const detail = `network error: ${e.cause?.code ?? e.name}: ${e.cause?.message ?? e.message}`;
      save(`${name}.meta.json`, JSON.stringify({ request, fetchedAt, error: detail }, null, 2));
      return { ok: false, detail };
    }
    const text = await res.text();
    const resHeaders = Object.fromEntries(res.headers);
    save(file, text);
    save(`${name}.meta.json`, JSON.stringify({ request, fetchedAt, status: res.status, statusText: res.statusText, headers: resHeaders }, null, 2));
    const ok = res.status >= 200 && res.status < 300;
    return { ok, status: res.status, text, headers: resHeaders, detail: ok ? null : `HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200).replace(/\s+/g, ' ')}` };
  }
  return { env, get, save, twelveDataGate, countEventRegistryRequest };
}

function age(newest, at) {
  if (!newest) return 'n/a';
  let s = Math.round((at - newest) / 1000);
  const future = s < 0;
  s = Math.abs(s);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  const txt = d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`;
  return future ? `${txt} in the future` : `${txt} ago`;
}

function statusLine(r, at) {
  const head = r.source.padEnd(16);
  if (r.state === 'skipped') return `${head} skipped: ${r.detail} | 0 items | newest n/a`;
  if (r.state === 'failed') return `${head} failed | 0 items | newest n/a | ${r.detail}`;
  return `${head} ok | ${r.count} items | newest ${age(r.newest, at)}${r.detail ? ` | ${r.detail}` : ''}`;
}

function printDiffs(prevReports, reports) {
  log('Changes since the previous round:');
  for (const r of reports) {
    const p = prevReports.find((x) => x.source === r.source);
    if (r.state !== 'ok' || p?.state !== 'ok') {
      log(`  ${r.source}: cannot compare (previous ${p?.state ?? 'absent'}, now ${r.state})`);
      continue;
    }
    const lines = r.source.startsWith('gdacs') ? diffEvents(p, r) : r.source === 'twelvedata' ? diffQuotes(p, r) : diffNewsEvents(p, r);
    if (!lines.length) log(`  ${r.source}: no change`);
    else for (const l of lines) log(`  ${r.source}: ${l}`);
  }
}

const rounds = [];
let failed = false;
let prev = null;

log(`Run ${runStart.toISOString()} | ${ROUNDS} round(s) | samples in ${runDir}`);
for (const k of KEY_NAMES) log(`${k}: ${env[k] ? 'set' : 'not set'}`);

for (let n = 1; n <= ROUNDS; n++) {
  const due = runStart.getTime() + (n - 1) * ROUND_MS;
  if (Date.now() < due) await sleep(due - Date.now());
  const started = new Date();
  const ctx = makeCtx(join(runDir, `round-${n}`));
  log('');
  log(`=== Round ${n} of ${ROUNDS}, started ${started.toISOString()} ===`);

  const [gdacs, td, news] = await Promise.all([fetchGdacs(ctx), fetchTwelveData(ctx), fetchEventRegistry(ctx)]);
  const reports = [...gdacs, td, news];
  const at = new Date();
  for (const r of reports) {
    log(statusLine(r, at));
    if (r.state === 'failed') failed = true;
  }
  rounds.push({ round: n, startedAt: started.toISOString(), finishedAt: at.toISOString(), twelveDataCallAt: lastTwelveData ? new Date(lastTwelveData).toISOString() : null, states: Object.fromEntries(reports.map((r) => [r.source, r.state])) });

  log('');
  if (n === 1) printEvents(gdacs, log);
  if (td.state === 'ok') printQuotes(td, log);
  if (news.state === 'ok') printNewsEvents(news, log);
  if (prev) {
    log('');
    printDiffs(prev, reports);
  }

  prev = reports;
}

log('');
log(`Event Registry requests this run: ${eventRegistryRequests} (budget: 1 per round, ${ROUNDS} in all).`);

const finished = new Date();
writeFileSync(
  join(runDir, 'run.json'),
  redact(JSON.stringify({ startedAt: runStart.toISOString(), finishedAt: finished.toISOString(), watch: WATCH, rounds, eventRegistryRequests }, null, 2)),
);
log('');
log(`Done in ${Math.round((finished - runStart) / 1000)}s. ${failed ? 'At least one source failed: exit 1.' : 'No source failed: exit 0.'}`);
process.exit(failed ? 1 : 0);
