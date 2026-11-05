import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from '../helpers.ts';

const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });

function files(dir: string): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(abs);
  return out;
}

describe('M4 AC-19 the admin is untouched', () => {
  it('AC-19 git shows no change to the admin, sources, polling, tasks or plugins', () => {
    const paths = [
      'app/pages/admin.vue',
      'app/components/admin',
      'server/api/admin',
      'lib/admin.ts',
      'lib/sources',
      'lib/poll.ts',
      'lib/bars.ts',
      'lib/replay.ts',
      'server/tasks',
      'server/plugins',
    ];
    expect(git('diff', 'HEAD', '--stat', '--', ...paths)).toBe('');
    expect(git('status', '--porcelain', '--', ...paths)).toBe('');
  });
});

describe('M4 AC-21 lib/alert.ts is a plain module', () => {
  const src = readFileSync(join(ROOT, 'lib/alert.ts'), 'utf8');
  it('AC-21 imports only relative .ts paths, node: modules or db0', () => {
    const specs = [...src.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|^import\s+['"]([^'"]+)['"]/gm)].map((m) => m[1] ?? m[2] ?? m[3]);
    expect(specs.length).toBeGreaterThan(0);
    const bad = specs.filter((s) => !((s.startsWith('./') || s.startsWith('../')) ? s.endsWith('.ts') : s.startsWith('node:') || s === 'db0' || s.startsWith('db0/')));
    expect(bad).toEqual([]);
  });
  it('AC-21 uses no enum, namespace or parameter properties', () => {
    expect(src).not.toMatch(/\benum\s+\w+|\bnamespace\s+\w+|constructor\s*\([^)]*\b(public|private|protected|readonly)\s/);
  });
});

describe('M4 AC-22 nothing is sent', () => {
  it('AC-22 no file in lib, server, app or scripts contains api.resend.com or hooks.slack.com', () => {
    const all = ['lib', 'server', 'app', 'scripts'].flatMap(files);
    expect(all.length).toBeGreaterThan(0);
    const hits = all.filter((f) => /api\.resend\.com|hooks\.slack\.com/.test(readFileSync(f, 'utf8')));
    expect(hits.map((f) => relative(ROOT, f))).toEqual([]);
  });
  it('AC-22 the network guard is in place for the suite', () => {
    expect(() => fetch('https://api.resend.com/emails', { method: 'POST' })).toThrow('network blocked in tests');
    expect(() => fetch('https://hooks.slack.com/services/x')).toThrow('network blocked in tests');
  });
});

describe('M4 AC-23 untouched paths', () => {
  it('AC-23 git lists nothing under spikes/ or data/, and no diff to the spec, roadmap, .env.example or spikes/', () => {
    expect(git('status', '--porcelain', '--', 'spikes', 'data')).toBe('');
    const locked = ['feature-design/product-spec.md', 'feature-design/local-demo/roadmap.md', '.env.example', 'spikes'];
    expect(git('diff', 'HEAD', '--stat', '--', ...locked)).toBe('');
  });
});
