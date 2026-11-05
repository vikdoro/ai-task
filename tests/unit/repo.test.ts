import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from '../helpers.ts';

function files(dir: string, exts = /\.(ts|vue|mjs|js)$/): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (exts.test(n)) out.push(p);
    }
  };
  walk(abs);
  return out;
}

describe('AC-23 no user secrets in M3 code (narrowed by M4 AC-18 and M5 AC-25)', () => {
  it('AC-23 M4 AC-18 M5 AC-25 DEMO_USER_EMAIL and SLACK_WEBHOOK_URL are named only in lib/alert.ts; RESEND_API_KEY only in the email sender', () => {
    const all = ['lib', 'server', 'app', 'scripts'].flatMap((d) => files(d));
    expect(all.length).toBeGreaterThan(0);
    const contacts = all.filter((f) => /DEMO_USER_EMAIL|SLACK_WEBHOOK_URL/.test(readFileSync(f, 'utf8')));
    expect(contacts.map((f) => relative(ROOT, f))).toEqual(['lib/alert.ts']);
    const resend = all.filter((f) => /RESEND_API_KEY/.test(readFileSync(f, 'utf8')));
    expect(resend.map((f) => relative(ROOT, f))).toEqual(['lib/delivery/email.ts']);
  });
});

describe('AC-24 dependencies (updated by M4 AC-20)', () => {
  it('AC-24 M4 AC-20 the M3 dependencies plus exactly @vue/test-utils and happy-dom as dev dependencies; type module', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.type).toBe('module');
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toEqual(['db0', 'nuxt', 'vue']);
    expect(Object.keys(pkg.devDependencies ?? {}).sort()).toEqual(['@nuxt/test-utils', '@vue/test-utils', 'happy-dom', 'husky', 'typescript', 'vitest']);
  });
});

describe('AC-25 plain modules', () => {
  const sources = [...files('lib'), ...files('scripts')];
  it('AC-25 lib and scripts import only relative .ts paths, node: modules or db0', () => {
    expect(sources.length).toBeGreaterThan(0);
    const bad: string[] = [];
    for (const f of sources) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|^import\s+['"]([^'"]+)['"]/gm)) {
        const spec = m[1] ?? m[2] ?? m[3];
        const okSpec = (spec.startsWith('./') || spec.startsWith('../')) ? spec.endsWith('.ts') : spec.startsWith('node:') || spec === 'db0' || spec.startsWith('db0/');
        if (!okSpec) bad.push(`${relative(ROOT, f)}: ${spec}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('AC-25 lib and scripts use no enum, namespace or parameter properties', () => {
    const bad = sources.filter((f) => /\benum\s+\w+|\bnamespace\s+\w+|constructor\s*\([^)]*\b(public|private|protected|readonly)\s/.test(readFileSync(f, 'utf8')));
    expect(bad.map((f) => relative(ROOT, f))).toEqual([]);
  });
});

describe('AC-26 network guard', () => {
  it('AC-26 fetch to any other host throws network blocked in tests', async () => {
    expect(() => fetch('https://www.gdacs.org/')).toThrow('network blocked in tests');
    expect(() => fetch('https://eventregistry.org/api/v1/event', { method: 'POST' })).toThrow('network blocked in tests');
    expect(() => fetch(new URL('https://api.twelvedata.com/quote'))).toThrow('network blocked in tests');
  });
});

describe('AC-18 start script and refresh', () => {
  it('AC-18 npm start builds, then runs the built server on 127.0.0.1:3000 with .env', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts.start).toBe('nuxt build && HOST=127.0.0.1 PORT=3000 node --env-file-if-exists=.env .output/server/index.mjs');
    const cfg = readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8');
    expect(cfg).toMatch(/devServer:\s*\{\s*host:\s*'127\.0\.0\.1',\s*port:\s*3000/);
  });

  it('AC-18 the page refetches /api/admin every 60 seconds without a reload', () => {
    const page = readFileSync(join(ROOT, 'app/pages/admin.vue'), 'utf8');
    expect(page).toMatch(/setInterval\([^]*60_000/);
    expect(page).toContain('/api/admin/');
    expect(page).not.toMatch(/location\.reload/);
  });
});

describe('AC-28 untouched paths', () => {
  it('AC-28 git lists nothing under spikes/ or data/, and no diff in spikes/', () => {
    const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
    expect(git('status', '--porcelain', '--', 'spikes', 'data')).toBe('');
    expect(git('diff', '--stat', '--', 'spikes')).toBe('');
    expect(git('check-ignore', 'data/app.db').trim()).toBe('data/app.db');
  });
});
