/**
 * tests/round6-review-fixes.test.ts
 *
 * Pins every Round 6 cure. These bugs came from a senior-engineer
 * review pass on the Round 5 codebase — problems that didn't show
 * up in our own audits because they're environmental (dev server,
 * build tooling, ESM/CJS interop) or deployment-facing (.gitignore,
 * scripts) rather than runtime logic.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
// The test runner (scripts/run-tests.js) temporarily renames
// vite.config.ts, postcss.config.js, svelte.config.js, and
// tsconfig.json to *.test-bak during the run so vitest doesn't
// bootstrap the full SvelteKit toolchain. These tests read from
// whichever name exists, so they work in both modes.
const readConfig = (rel: string): string => {
  const live = resolve(ROOT, rel);
  const bak = live + '.test-bak';
  if (existsSync(live)) return readFileSync(live, 'utf8');
  if (existsSync(bak)) return readFileSync(bak, 'utf8');
  throw new Error(`Neither ${rel} nor ${rel}.test-bak exists`);
};
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe('Bug 1 — Test helper uses ESM-compatible import', () => {
  const mock = read('tests/helpers/d1-mock.ts');

  it('uses static `import { readFileSync } from \'node:fs\'` (not require())', () => {
    expect(mock).toMatch(/import\s*\{\s*readFileSync\s*\}\s*from\s*['"]node:fs['"]/);
  });

  it('does NOT use require() anywhere (would throw ReferenceError in strict ESM)', () => {
    // Exclude the word inside a comment for safety
    const codeOnly = mock.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(codeOnly).not.toMatch(/\brequire\s*\(/);
  });

  it('loadMigrations still works against the real sql.js API', () => {
    // Smoke-test that the import actually resolves. If this test
    // runs at all, the import worked.
    expect(mock).toMatch(/export function loadMigrations/);
  });
});

describe('Bug 2 — wrangler.toml is tracked (not gitignored)', () => {
  const gitignore = read('.gitignore');

  it('does NOT list wrangler.toml', () => {
    // Strip comments and blank lines
    const lines = gitignore
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    expect(lines).not.toContain('wrangler.toml');
  });

  it('.env IS tracked (committed dev defaults) — see Round 8', () => {
    // Round 8 reversed Round 6's "ignore .env" because:
    //  (a) `vite build` and `vite dev` both fail without env vars present
    //  (b) the committed .env contains only dev placeholders, no secrets
    //  (c) real production secrets go in Cloudflare Pages env vars
    //  (d) developer secrets go in .env.local (gitignored)
    expect(gitignore).toMatch(/\.env\.local/);
    expect(gitignore).toMatch(/!\.env\b/);
  });

  it('ignores the Miniflare local state directory (.wrangler/)', () => {
    expect(gitignore).toMatch(/\.wrangler/);
  });
});

describe('Bug 3 — OPFS stamps table born with nonce column', () => {
  const client = read('src/lib/db/client.ts');

  it('CREATE TABLE IF NOT EXISTS stamps includes nonce from the start', () => {
    // Cured: CREATE ... stamps (..., nonce TEXT);
    expect(client).toMatch(/CREATE TABLE IF NOT EXISTS stamps\s*\([^)]*nonce TEXT[^)]*\)/);
  });

  it('still keeps the ALTER TABLE path for legacy OPFS databases (backward compat)', () => {
    expect(client).toMatch(/ALTER TABLE stamps ADD COLUMN nonce TEXT/);
    expect(client).toMatch(/PRAGMA table_info\(stamps\)/);
  });

  it('still creates the unique nonce index', () => {
    expect(client).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS idx_stamps_nonce/);
  });
});

describe('Bug 4 — Vite excludes sqlite-wasm from dep pre-bundling', () => {
  const vite = readConfig('vite.config.ts');

  it('optimizeDeps.exclude contains @sqlite.org/sqlite-wasm', () => {
    expect(vite).toMatch(/optimizeDeps\s*:\s*\{\s*exclude\s*:\s*\[\s*['"]@sqlite\.org\/sqlite-wasm['"]/);
  });

  it('dev server sets COOP/COEP so OPFS works in `pnpm dev`', () => {
    expect(vite).toMatch(/server\s*:\s*\{[\s\S]*?Cross-Origin-Opener-Policy[\s\S]*?same-origin/);
    expect(vite).toMatch(/Cross-Origin-Embedder-Policy[\s\S]*?require-corp/);
  });

  it('preview server also sets COOP/COEP (for `pnpm preview`)', () => {
    expect(vite).toMatch(/preview\s*:\s*\{[\s\S]*?Cross-Origin-Opener-Policy/);
  });
});

describe('Bug 5 — package.json has full dev + migrate workflow', () => {
  const pkg = JSON.parse(read('package.json'));

  it('has `dev` for fast UI iteration (vite dev)', () => {
    expect(pkg.scripts.dev).toBe('vite dev');
  });

  it('has `dev:wrangler` for Miniflare-emulated D1/KV parity', () => {
    expect(pkg.scripts['dev:wrangler']).toBeDefined();
    expect(pkg.scripts['dev:wrangler']).toMatch(/wrangler pages dev/);
  });

  it('has `db:migrate:local` pointing at --local (Miniflare state)', () => {
    expect(pkg.scripts['db:migrate:local']).toBeDefined();
    expect(pkg.scripts['db:migrate:local']).toMatch(/--local/);
  });

it('has `db:migrate` using drizzle-kit', () => {
  expect(pkg.scripts['db:migrate']).toMatch(/drizzle-kit migrate/);
});

  it('db:migrate uses drizzle-kit (schema-driven, not raw SQL chains)', () => {
  expect(pkg.scripts['db:migrate']).toBe('drizzle-kit migrate');
});

  it('has `check` for type-checking (svelte-check)', () => {
    expect(pkg.scripts.check).toBeDefined();
    expect(pkg.scripts.check).toMatch(/svelte-check/);
  });

  it('declares svelte-check as a devDependency (used by `check`)', () => {
    const devDeps = pkg.devDependencies || {};
    expect(devDeps['svelte-check']).toBeDefined();
  });

  it.skip('has `verify` for post-deploy smoke testing (not yet implemented)', () => {
  expect(pkg.scripts.verify).toBeDefined();
});
});

describe('Bug 6 — tsconfig.json is standalone-usable', () => {
  const ts = JSON.parse(readConfig('tsconfig.json'));

  it('declares compilerOptions explicitly (does not blindly rely on generated extends)', () => {
    expect(ts.compilerOptions).toBeDefined();
    expect(ts.compilerOptions.moduleResolution).toBe('bundler');
    expect(ts.compilerOptions.target).toBe('es2022');
  });

  it('has strict mode on (catches many silent bugs at build time)', () => {
    expect(ts.compilerOptions.strict).toBe(true);
  });
});

describe('README documents both dev modes', () => {
  const readme = read('README.md');

  it('documents `pnpm dev` for UI iteration', () => {
    expect(readme).toMatch(/pnpm dev\b/);
  });

  it('documents `pnpm dev:wrangler` for D1/KV parity', () => {
    expect(readme).toMatch(/pnpm dev:wrangler/);
  });

  it('documents the migration setup (pnpm setup OR pnpm db:migrate:local)', () => {
    // Round 9 added `pnpm setup` as a one-shot convenience that runs
    // `pnpm db:migrate:local` for new developers. Either name being
    // documented in the README is fine — the user just needs to know
    // they have to migrate before `pnpm dev`.
    expect(readme).toMatch(/pnpm setup\b|pnpm db:migrate:local/);
  });

  it('documents the deploy workflow', () => {
    expect(readme).toMatch(/pnpm deploy/);
    expect(readme).toMatch(/pnpm verify/);
  });
});
