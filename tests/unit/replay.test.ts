import { afterEach, describe, expect, it } from 'vitest';
import { cpSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { resolveConfig } from '../../lib/config.ts';
import { findRunFolder } from '../../lib/replay.ts';
import { pollSource } from '../../lib/poll.ts';
import { latestCheck, listEvents } from '../../lib/storage/store.ts';
import { EMPTY_SAMPLES, FULL_SAMPLES, cleanupTmp, samplesCtx, tmpDir } from '../helpers.ts';

afterEach(cleanupTmp);

function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else out[p] = `${st.size}:${st.mtimeMs}:${readFileSync(p, 'utf8')}`;
    }
  };
  walk(dir);
  return out;
}

describe('AC-15 SOURCE_MODE', () => {
  it('AC-15 unset or samples is samples mode, with the demo samples/ by default (D-129) and data/samples.db', () => {
    const cwd = '/repo';
    for (const env of [{}, { SOURCE_MODE: 'samples' }]) {
      expect(resolveConfig(env, cwd)).toEqual({ mode: 'samples', samplesDir: resolve(cwd, 'samples'), dbPath: resolve(cwd, 'data/samples.db') });
    }
  });

  it('AC-15 live mode uses data/app.db; SAMPLES_DIR and DB_PATH override', () => {
    expect(resolveConfig({ SOURCE_MODE: 'live' }, '/repo')).toMatchObject({ mode: 'live', dbPath: resolve('/repo', 'data/app.db') });
    expect(resolveConfig({ SAMPLES_DIR: '/x/s', DB_PATH: '/x/d.db' }, '/repo')).toEqual({ mode: 'samples', samplesDir: '/x/s', dbPath: '/x/d.db' });
  });

  it('AC-15 any other value is refused with a message naming the allowed values', () => {
    expect(() => resolveConfig({ SOURCE_MODE: 'foo' }, '/repo')).toThrow(/"samples".*"live"/);
  });

  it('AC-15 every source in samples mode runs with a fetch that throws', async () => {
    const ctx = await samplesCtx();
    for (const s of ['gdacs', 'twelvedata', 'eventregistry'] as const) {
      const r = await pollSource(s, ctx);
      expect(r.outcome, `${s}: ${r.detail}`).toBe('ok');
    }
    expect((await listEvents(ctx.db, 200)).length).toBeGreaterThan(0);
  });

  it('AC-15 samples mode needs no API keys', async () => {
    const ctx = await samplesCtx(FULL_SAMPLES, { env: {} });
    expect((await pollSource('twelvedata', ctx)).outcome).toBe('ok');
    expect((await pollSource('eventregistry', ctx)).outcome).toBe('ok');
  });
});

describe('AC-16 replay', () => {
  it('AC-16 takes the newest run folder whose round-1 holds all three files', () => {
    expect(findRunFolder(FULL_SAMPLES)).toBe(join(FULL_SAMPLES, '2026-11-02T00-00-00-000Z'));
    expect(findRunFolder(join(FULL_SAMPLES, 'nope'))).toBeNull();
  });

  it('AC-16 the n-th successful poll reads round n, then stays on the last round', async () => {
    const ctx = await samplesCtx();
    await pollSource('eventregistry', ctx);
    let rows = await listEvents(ctx.db, 200);
    const count = (uri: string) => rows.find((r) => r.source_id === uri)?.measure;
    expect(count('eng-1')).toBe('1,234 articles');
    expect((await latestCheck(ctx.db, 'eventregistry'))?.ratelimit_remaining).toBe(1995);
    await pollSource('eventregistry', ctx);
    rows = await listEvents(ctx.db, 200);
    expect(count('eng-1')).toBe('900 articles');
    expect(count('eng-2')).toBe('1,000 articles');
    expect((await latestCheck(ctx.db, 'eventregistry'))?.ratelimit_remaining).toBe(1990);
    const third = await pollSource('eventregistry', ctx);
    expect(third.outcome).toBe('ok');
    expect((await latestCheck(ctx.db, 'eventregistry'))?.ratelimit_remaining).toBe(1990);
  });

  it('AC-16 replay rounds are counted per source', async () => {
    const ctx = await samplesCtx();
    await pollSource('gdacs', ctx);
    await pollSource('gdacs', ctx);
    await pollSource('twelvedata', ctx);
    const spy = (await listEvents(ctx.db, 200)).find((r) => r.source_id === 'SPY 2026-11-02');
    expect(spy?.measure).toBe('+3.50%');
  });

  it('AC-16 no matching folder is a failed check naming the folder', async () => {
    const dir = tmpDir();
    const ctx = await samplesCtx(dir);
    const r = await pollSource('gdacs', ctx);
    expect(r).toMatchObject({ outcome: 'failed', detail: `no samples found in ${dir}` });
  });

  it('AC-16 replay only reads: nothing under the samples folder changes', async () => {
    const dir = join(tmpDir(), 'samples');
    cpSync(FULL_SAMPLES, dir, { recursive: true });
    cpSync(EMPTY_SAMPLES, join(dir, '..', 'unused'), { recursive: true });
    const before = snapshot(dir);
    const ctx = await samplesCtx(dir);
    for (let i = 0; i < 3; i++) for (const s of ['gdacs', 'twelvedata', 'eventregistry'] as const) await pollSource(s, ctx);
    expect(snapshot(dir)).toEqual(before);
  });
});
