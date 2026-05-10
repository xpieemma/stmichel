/**
 * tests/round9-walkthrough-bugs.test.ts
 *
 * Pins every Round 9 cure. These bugs were found by ACTUALLY starting
 * `vite dev` and curl-ing every public route — not by string-matching
 * against the source. None of the previous 248 tests caught them.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe('Bug 1 — Every page has a <title>', () => {
  // Walking `vite dev` showed only 2 of 15 pages had a <title>. Most
  // browser tabs were blank, share previews broken, screen readers
  // had nothing to announce.
  const PAGES = [
    'src/routes/+page.svelte',
    'src/routes/gallery/+page.svelte',
    'src/routes/map/+page.svelte',
    'src/routes/matches/+page.svelte',
    'src/routes/offline.html/+page.svelte',
    'src/routes/admin/login/+page.svelte',
    'src/routes/admin/dashboard/+page.svelte',
    'src/routes/admin/dashboard/albums/+page.svelte',
    'src/routes/admin/dashboard/albums/[id]/+page.svelte',
    'src/routes/admin/dashboard/analytics/+page.svelte',
    'src/routes/admin/dashboard/city/+page.svelte',
    'src/routes/admin/dashboard/matches/+page.svelte',
    'src/routes/admin/dashboard/matches/[id]/+page.svelte',
  ];

  for (const page of PAGES) {
    it(`${page} has a <svelte:head><title>`, () => {
      const content = read(page);
      // Must have BOTH the head wrapper AND a non-empty title
      expect(content).toMatch(/<svelte:head>[\s\S]*<title>[^<]+<\/title>[\s\S]*<\/svelte:head>/);
    });
  }
});

describe('Bug 2 — Homepage card uses native <a> not <article role=button>', () => {
  const home = read('src/routes/+page.svelte');

  it('does NOT use <article role="button"> (invalid a11y)', () => {
    expect(home).not.toMatch(/<article[^>]*role="button"/);
  });

  it('uses <a href={`/event/${slug}`}> for native nav', () => {
    expect(home).toMatch(/<a[\s\S]*?href=\{`\/event\/\$\{event\.slug\}`\}/);
  });

  it('does not need on:keydown handlers (native anchor is keyboard-accessible)', () => {
    // <a> elements get Enter activation and tab focus for free.
    // Removing on:keydown removes a maintenance burden.
    const aTag = home.match(/<a[\s\S]*?href=\{`\/event[\s\S]*?>/)?.[0] ?? '';
    expect(aTag).not.toMatch(/on:keydown/);
  });
});

describe('Bug 3 — Static assets exist on disk', () => {
  it('static/icon-192.png exists (manifest.json points here)', () => {
    const path = resolve(ROOT, 'static/icon-192.png');
    expect(existsSync(path)).toBe(true);
    // Must be a real PNG file with non-trivial size
    expect(statSync(path).size).toBeGreaterThan(50);
  });

  it('static/icon-192.png starts with the PNG file signature', () => {
    const buf = readFileSync(resolve(ROOT, 'static/icon-192.png'));
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4e);
    expect(buf[3]).toBe(0x47);
  });

  it('static/icon-512.png exists', () => {
    const path = resolve(ROOT, 'static/icon-512.png');
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(50);
  });

  it('static/og-default.png exists (Round 13: was .jpg with PNG bytes)', () => {
    // Round 13 renamed og-default.jpg → og-default.png because the
    // file was always real PNG bytes; some social-card unfurlers
    // reject extension-MIME mismatches. Updated all references too.
    const path = resolve(ROOT, 'static/og-default.png');
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(50);
  });

  it('manifest.json declares the icons that exist', () => {
    const manifest = JSON.parse(read('static/manifest.json'));
    const icons = manifest.icons.map((i: unknown) => (i as { src: string }).src);
    expect(icons).toContain('/icon-192.png');
    expect(icons).toContain('/icon-512.png');
  });
});

describe('Bug 4 — +error.svelte exists for branded error display', () => {
  const path = 'src/routes/+error.svelte';

  it('file exists', () => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
  });

  it('reads $page.status and $page.error.message', () => {
    const content = read(path);
    expect(content).toMatch(/\$page\.status/);
    expect(content).toMatch(/\$page\.error\?\.message/);
  });

  it('offers a route back home (so users are never stranded)', () => {
    const content = read(path);
    expect(content).toMatch(/href="\/"/);
  });

  it('has its own <title> tag', () => {
    expect(read(path)).toMatch(/<title>[^<]+<\/title>/);
  });
});

describe('Bug 5 — src/error.html (last-ditch fallback)', () => {
  const path = 'src/error.html';

  it('file exists at src/error.html', () => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
  });

  it('uses %sveltekit.status% and %sveltekit.error.message% placeholders', () => {
    const content = read(path);
    expect(content).toMatch(/%sveltekit\.status%/);
    expect(content).toMatch(/%sveltekit\.error\.message%/);
  });

  it('inlines all CSS (no external requests when SvelteKit itself is broken)', () => {
    const content = read(path);
    expect(content).toMatch(/<style>/);
    expect(content).not.toMatch(/<link[^>]+rel="stylesheet"/);
  });
});

describe('Bug 6 — dev:wrangler script is real (no proxy timing race)', () => {
  const pkg = JSON.parse(read('package.json'));

  it('dev:wrangler builds first then runs wrangler against the build output', () => {
    // Pre-Round-9: wrangler pages dev .svelte-kit/cloudflare with
    // --proxy=5173. The build directory doesn\'t exist on a fresh
    // clone, so wrangler dies before vite is even ready.
    expect(pkg.scripts['dev:wrangler']).toMatch(/build/);
    expect(pkg.scripts['dev:wrangler']).toMatch(/wrangler pages dev/);
  });

  it('dev:wrangler binds D1 + KV explicitly (no --proxy hack)', () => {
    expect(pkg.scripts['dev:wrangler']).toMatch(/--d1/);
    expect(pkg.scripts['dev:wrangler']).toMatch(/--kv/);
    expect(pkg.scripts['dev:wrangler']).not.toMatch(/--proxy/);
  });
});

describe('Bug 7 — Helpful dev error when D1 has no tables (Round 10: now in handleError)', () => {
  const hooks = read('src/hooks.server.ts');

  it('handleError catches "no such table" errors and emits a 503 with a hint (Round 10)', () => {
    // Round 9 put this in a Handle wrapper. That was wrong: SvelteKit
    // catches throws inside its own resolve() before they reach a
    // wrapper. Round 10 moved the logic into handleError, the proper
    // hook for error transformation.
    expect(hooks).toMatch(/no such table/i);
    expect(hooks).toMatch(/db:push|db:migrate/);
    expect(hooks).toMatch(/code:\s*503/);
  });

  it('only emits the helpful error in dev (production keeps generic 500)', () => {
    expect(hooks).toMatch(/import\s*\{\s*dev\s*\}\s*from\s*['"]\$app\/environment['"]/);
    expect(hooks).toMatch(/dev\s*&&\s*error\s+instanceof\s+Error/);
  });

  it('helpfulErrorHandle is no longer a separate handle (was redundant)', () => {
    // Defensive: the dead helper should be removed, not just unused.
    expect(hooks).not.toMatch(/helpfulErrorHandle/);
  });
});

describe('Bug 8 — README has a loud first-run section', () => {
  const readme = read('README.md');

  it('starts with a Quick Start that demands migration', () => {
    expect(readme).toMatch(/Quick start|first run|read me first/i);
  });

  it('mentions pnpm setup OR equivalent migrate-then-dev script', () => {
    expect(readme).toMatch(/pnpm setup\b|db:push|db:migrate/);
  });

  it('warns about the consequence of skipping setup (503/500 errors)', () => {
    expect(readme).toMatch(/503|500|dev_d1_not_migrated|no such table/i);
  });

  it('explains the password fallback for new admins', () => {
    expect(readme).toMatch(/password|modpas/i);
    expect(readme).toMatch(/festival-lakay-dev|bootstrap/i);
  });
});

describe('Convenience scripts (Round 9 added these)', () => {
  const pkg = JSON.parse(read('package.json'));

  it('pnpm setup runs migrations (one-shot for new clones)', () => {
    expect(pkg.scripts.setup).toBeDefined();
    expect(pkg.scripts.setup).toMatch(/db:push|db:migrate/);
  });

  it('pnpm dev:full migrates AND starts dev (the script most devs want)', () => {
    expect(pkg.scripts['dev:full']).toBeDefined();
    expect(pkg.scripts['dev:full']).toMatch(/db:push|db:migrate/);
    expect(pkg.scripts['dev:full']).toMatch(/\bdev\b/);
  });
});
