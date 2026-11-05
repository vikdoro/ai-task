import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FULL_SAMPLES, ROOT, cleanupTmp, tmpDir } from '../helpers.ts';

afterEach(cleanupTmp);

function run(env: Record<string, string>) {
  const clean = { ...process.env };
  for (const k of ['SOURCE_MODE', 'SAMPLES_DIR', 'DB_PATH', 'TWELVE_DATA_API_KEY', 'EVENT_REGISTRY_API_KEY']) delete clean[k];
  // Same command as the npm script, but without .env, and with fetch blocked in the child as well.
  return spawnSync('node', ['--import', join(ROOT, 'tests/setup/no-network-child.mjs'), 'scripts/poll-once.ts'], {
    cwd: ROOT,
    env: { ...clean, ...env },
    encoding: 'utf8',
  });
}

describe('AC-17 poll:once', () => {
  it('AC-17 the npm script runs the TS file directly with node and .env, no tsx', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['poll:once']).toBe('node --env-file-if-exists=.env scripts/poll-once.ts');
  });

  it('AC-17 polls each source once in samples mode, one line per source, exit 0', () => {
    const db = join(tmpDir(), 'p.db');
    const r = run({ SAMPLES_DIR: FULL_SAMPLES, DB_PATH: db });
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    const lines = r.stdout.trim().split('\n');
    expect(lines).toEqual([
      'gdacs ok 4 items, 2 made the cut',
      'twelvedata ok 5 items, 2 made the cut. USO: code 404: symbol not found',
      'eventregistry ok 2 items, 1 made the cut',
      // M5 AC-16: the alerts summary follows the source lines.
      'alerts: 0 sent, 5 not sent',
    ]);
    expect(existsSync(db)).toBe(true);
  });

  it('AC-17 exits 1 when a source failed, with the reason at the end of its line', () => {
    const empty = tmpDir();
    const r = run({ SAMPLES_DIR: empty, DB_PATH: join(tmpDir(), 'p.db') });
    expect(r.status).toBe(1);
    // M5 AC-16: the three source lines, then the alerts summary.
    const lines = r.stdout.trim().split('\n').slice(0, 3);
    expect(lines).toHaveLength(3);
    for (const l of lines) expect(l).toMatch(new RegExp(` failed no samples found in ${empty}$`));
  });

  it('AC-15 a bad SOURCE_MODE exits 2 with a message naming the allowed values', () => {
    const db = join(tmpDir(), 'p.db');
    const r = run({ SOURCE_MODE: 'foo', DB_PATH: db });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/SOURCE_MODE.*"samples".*"live"/);
    expect(existsSync(db)).toBe(false);
  });
});
