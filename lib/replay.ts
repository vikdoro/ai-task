// Sample replay (AC-16). Only reads the samples folder; never writes to it.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Source } from './config.ts';

export const SAMPLE_FILES: Record<Source, string> = {
  gdacs: 'gdacs-filtered.json',
  twelvedata: 'twelvedata-quote.json',
  eventregistry: 'eventregistry-events.json',
};

const isDir = (p: string) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};

/** The newest run folder whose round-1 holds all three sample files, or null. */
export function findRunFolder(samplesDir: string): string | null {
  if (!isDir(samplesDir)) return null;
  const runs = readdirSync(samplesDir)
    .filter((name) => isDir(join(samplesDir, name)))
    .sort()
    .reverse();
  for (const name of runs) {
    const round1 = join(samplesDir, name, 'round-1');
    if (Object.values(SAMPLE_FILES).every((f) => existsSync(join(round1, f)))) return join(samplesDir, name);
  }
  return null;
}

function roundCount(runDir: string): number {
  let n = 0;
  while (isDir(join(runDir, `round-${n + 1}`))) n++;
  return n;
}

export type ReplayRead = { ok: true; text: string; round: number; ratelimitRemaining: number | null } | { ok: false; reason: string };

/** Reads round `n` (1-based) for a source, or the last round once the rounds run out. */
export function readReplay(samplesDir: string, source: Source, n: number): ReplayRead {
  const run = findRunFolder(samplesDir);
  if (!run) return { ok: false, reason: `no samples found in ${samplesDir}` };
  const round = Math.max(1, Math.min(n, roundCount(run)));
  const dir = join(run, `round-${round}`);
  let text: string;
  try {
    text = readFileSync(join(dir, SAMPLE_FILES[source]), 'utf8');
  } catch {
    return { ok: false, reason: `no ${SAMPLE_FILES[source]} in ${dir}` };
  }
  let ratelimitRemaining: number | null = null;
  if (source === 'eventregistry') {
    try {
      const meta = JSON.parse(readFileSync(join(dir, 'eventregistry.meta.json'), 'utf8'));
      ratelimitRemaining = parseRatelimit(meta?.headers?.['x-ratelimit-remaining']);
    } catch {
      ratelimitRemaining = null;
    }
  }
  return { ok: true, text, round, ratelimitRemaining };
}

export function parseRatelimit(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
