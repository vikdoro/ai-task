import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { openDb, type Db } from '../lib/storage/db.ts';
import type { PollContext } from '../lib/poll.ts';

export const ROOT = resolve(import.meta.dirname, '..');
export const FIXTURES = join(ROOT, 'tests/fixtures/samples');
export const FULL_SAMPLES = join(FIXTURES, 'full');
export const EMPTY_SAMPLES = join(FIXTURES, 'empty');

const dirs: string[] = [];

export function tmpDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'm3-test-'));
  dirs.push(d);
  return d;
}

export function cleanupTmp() {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
}

export async function tmpDb(): Promise<{ db: Db; path: string }> {
  const path = join(tmpDir(), 'test.db');
  return { db: await openDb(path), path };
}

export function throwingFetch(): typeof fetch {
  return (() => {
    throw new Error('fetch must not be called');
  }) as unknown as typeof fetch;
}

export function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
}

export async function liveCtx(over: Partial<PollContext> & { fetch: typeof fetch }): Promise<PollContext> {
  const { db } = await tmpDb();
  return {
    db,
    mode: 'live',
    samplesDir: FULL_SAMPLES,
    env: { TWELVE_DATA_API_KEY: 'td-fake-key', EVENT_REGISTRY_API_KEY: 'er-fake-key' },
    now: () => new Date('2026-11-04T12:00:00.000Z'),
    ...over,
  };
}

export async function samplesCtx(samplesDir = FULL_SAMPLES, over: Partial<PollContext> = {}): Promise<PollContext> {
  const { db } = await tmpDb();
  return { db, mode: 'samples', samplesDir, env: {}, fetch: throwingFetch(), now: () => new Date('2026-11-04T12:00:00.000Z'), ...over };
}
