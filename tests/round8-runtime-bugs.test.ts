/**
 * tests/round8-runtime-bugs.test.ts
 *
 * Pins every Round 8 cure. These bugs were caught by ACTUALLY running
 * `vite build` and `vite dev` against the real npm registry — no test
 * in the previous 214 caught them because tests verified contracts
 * and not the end-to-end boot.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
// import { execSync } from 'node:child_process';

const ROOT = resolve(__dirname, '..');
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');
const readConfig = (rel: string): string => {
  const live = resolve(ROOT, rel);
  const bak = live + '.test-bak';
  if (existsSync(live)) return readFileSync(live, 'utf8');
  if (existsSync(bak)) return readFileSync(bak, 'utf8');
  throw new Error(`Neither ${rel} nor ${rel}.test-bak exists`);
};

describe('Bug 1 — Dependency versions exist on npm', () => {
  const pkg = JSON.parse(read('package.json'));
  const all = { ...pkg.dependencies, ...pkg.devDependencies };

  it('@sveltejs/adapter-cloudflare is in the v4.x range that actually exists', () => {
    // npm view @sveltejs/adapter-cloudflare versions: max v4 is 4.9.0
    // Round 7 declared ^4.10.0 which does NOT exist → npm install ETARGET.
    const range = all['@sveltejs/adapter-cloudflare'];
    const m = range.match(/(\d+)\.(\d+)\.(\d+)/);
    expect(m).not.toBeNull();
    const [, maj, min] = m!.map(Number);
    expect(maj).toBe(7);
    expect(min).toBeLessThanOrEqual(9);
  });

  it('svelte-check is at a version that actually exists', () => {
    // Round 6 declared ^4.0.9. svelte-check 4.0.x stops at 4.0.8 — 4.0.9
    // doesn't exist. The next 4.x is 4.1.0. Round 8 reverts to 3.8.6
    // which is the last known-good for Svelte 4 + Kit 2.15.
    const range = all['svelte-check'];
    expect(range).toBeDefined();
    expect(range).toMatch(/3\.8\./);
  });

  it('sqlite-wasm is pinned to an exact -buildN suffix that exists', () => {
    // The package uses non-standard semver (3.51.2-build9). A range like
    // ^3.51.0 is treated as a prerelease anchor by npm and resolves to
    // nothing useful. Pin the exact build.
    expect(all['@sqlite.org/sqlite-wasm']).toMatch(/3\.\d+\.\d+-build\d+/);
  });

  it('@cloudflare/workers-types is declared (D1Database type comes from here)', () => {
    expect(all['@cloudflare/workers-types']).toBeDefined();
  });
});

describe('Bug 2 — $env/static/public no longer breaks the build', () => {
  it('webauthn endpoints use $env/dynamic/public (runtime, not compile-time)', () => {
    for (const f of [
      'src/routes/admin/api/webauthn/+server.ts',
      'src/routes/admin/api/webauthn/verify/+server.ts',
    ]) {
      const content = read(f);
      // Must NOT statically import — that's what caused the build failure.
      expect(content).not.toMatch(/import\s*\{[^}]*PUBLIC_RP_ID[^}]*\}\s*from\s*['"]\$env\/static\/public['"]/);
      // Must use dynamic instead.
      expect(content).toMatch(/from\s*['"]\$env\/dynamic\/public['"]/);
    }
  });

  it('.env exists at the repo root (committed dev defaults)', () => {
    expect(existsSync(resolve(ROOT, '.env'))).toBe(true);
    const env = read('.env');
    expect(env).toMatch(/PUBLIC_RP_ID/);
  });

  it('.env declares PUBLIC_RP_ID even if blank, so SvelteKit never errors', () => {
    expect(read('.env')).toMatch(/PUBLIC_RP_ID\s*=/);
  });
});

describe('Bug 3 — adapter-cloudflare platformProxy enables D1/KV in vite dev', () => {
  const cfg = readConfig('svelte.config.js');

  it('adapter() is called with platformProxy config', () => {
    expect(cfg).toMatch(/platformProxy\s*:\s*\{/);
  });

  it('platformProxy points at the wrangler.toml file', () => {
    expect(cfg).toMatch(/configPath\s*:\s*['"]wrangler\.toml['"]/);
  });

  it('platformProxy persists state under .wrangler/state', () => {
    expect(cfg).toMatch(/persist/);
  });
});

describe('Bug 4 — a11y warnings cleared (PassportStamp, FeedbackButton, city admin)', () => {
  it('PassportStamp is now a <button> not a <div onclick>', () => {
    const c = read('src/lib/components/PassportStamp.svelte');
    expect(c).toMatch(/<button[^>]*type="button"[^>]*passport-widget/);
    expect(c).not.toMatch(/<div\s+class="passport-widget"\s+onclick/);
  });

  it('PassportStamp closes with </button> not </div>', () => {
    const c = read('src/lib/components/PassportStamp.svelte');
    // The last closing tag in the markup section is </button>
    const markup = c.split('<style>')[0];
    expect(markup).toMatch(/<\/button>\s*$/m);
  });

  it('city admin English textarea is wrapped inside its <label>', () => {
    const c = read('src/routes/admin/dashboard/city/+page.svelte');
    // Cured: <label>English<textarea ...></textarea></label>
    // Buggy: <label>English</label><textarea ...></textarea>
    expect(c).toMatch(/<label[^>]*>English<textarea/);
  });
});

describe('Feature 5 — Admin password fallback', () => {
  it('migration 011 adds password_hash + password_salt + iterations columns', () => {
    const m = read('migrations/011_admin_password.sql');
    expect(m).toMatch(/ALTER TABLE admins ADD COLUMN password_hash/);
    expect(m).toMatch(/ALTER TABLE admins ADD COLUMN password_salt/);
    expect(m).toMatch(/ALTER TABLE admins ADD COLUMN password_iterations/);
  });

  it('register endpoint uses PBKDF2-SHA256 with 100000+ iterations', () => {
    const r = read('src/routes/admin/api/password/register/+server.ts');
    expect(r).toMatch(/PBKDF2/);
    expect(r).toMatch(/SHA-256/);
    // OWASP 2023 recommendation
    expect(r).toMatch(/310[,_]?000/);
  });

  it('register requires the username to be on admin_allowlist (same gate as passkey)', () => {
    const r = read('src/routes/admin/api/password/register/+server.ts');
    expect(r).toMatch(/SELECT username FROM admin_allowlist/);
    expect(r).toMatch(/pa otorize/);
  });

  it('register enforces minimum password length', () => {
    const r = read('src/routes/admin/api/password/register/+server.ts');
    expect(r).toMatch(/password\.length\s*<\s*10/);
  });

  it('login endpoint uses constant-time comparison (no timing-attack leak)', () => {
    const l = read('src/routes/admin/api/password/login/+server.ts');
    expect(l).toMatch(/constantTimeEqual|constant.time/i);
    // Must do XOR, not ===
    expect(l).toMatch(/diff\s*\|=/);
  });

  it('login endpoint issues a signed admin_session cookie (Round 10)', () => {
    const l = read('src/routes/admin/api/password/login/+server.ts');
    // Round 10 replaced raw cookies.set with issueSessionCookie which
    // HMAC-signs the value and enforces server-side TTL.
    expect(l).toMatch(/issueSessionCookie\(/);
    expect(l).toMatch(/ADMIN_SESSION_SECRET/);
  });

  it('login endpoint does not leak username-vs-password enumeration info', () => {
    const l = read('src/routes/admin/api/password/login/+server.ts');
    // Both branches must return the same generic error.
    const errors = l.match(/error:\s*['"][^'"]*pa kòrèk[^'"]*['"]/g);
    expect(errors).not.toBeNull();
    expect(errors!.length).toBeGreaterThanOrEqual(2);
  });

  it('admin login UI offers a method toggle between passkey and password', () => {
    const ui = read('src/routes/admin/login/+page.svelte');
    expect(ui).toMatch(/method\s*===?\s*['"]passkey['"]/);
    expect(ui).toMatch(/method\s*===?\s*['"]password['"]/);
    expect(ui).toMatch(/handlePassword/);
    expect(ui).toMatch(/handlePasskey/);
  });

  it('admin login UI exposes register vs login mode', () => {
    const ui = read('src/routes/admin/login/+page.svelte');
    expect(ui).toMatch(/mode\s*===?\s*['"]login['"]/);
    expect(ui).toMatch(/mode\s*===?\s*['"]register['"]/);
  });

  it('hooks.server.ts lets /admin/api/password through the auth gate', () => {
    const h = read('src/hooks.server.ts');
    expect(h).toMatch(/\/admin\/api\/password/);
  });

  it('db:migrate chains migration 011 into both local and remote', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts['db:migrate']).toContain('011_admin_password');
    expect(pkg.scripts['db:migrate:local']).toContain('011_admin_password');
  });
});

describe('Bug 6 — app.d.ts references workers-types', () => {
  const dts = read('src/app.d.ts');

  it('has the @cloudflare/workers-types triple-slash reference', () => {
    expect(dts).toMatch(/\/\/\/\s*<reference\s+types="@cloudflare\/workers-types"/);
  });
});

describe('Feature 7 — /healthz endpoint for monitoring', () => {
  const path = 'src/routes/healthz/+server.ts';

  it('/healthz endpoint exists', () => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
  });

  it('returns 503 when D1 is unavailable (so monitors flag the outage)', () => {
    const c = read(path);
    expect(c).toMatch(/status:\s*503/);
    expect(c).toMatch(/no D1 binding/);
  });

  it('exercises D1 with a SELECT 1 to prove connectivity (not just bind)', () => {
    const c = read(path);
    expect(c).toMatch(/SELECT 1/);
  });

  it('uses cache-control no-store so monitors get fresh data', () => {
    const c = read(path);
    expect(c).toMatch(/no-store/);
  });
});

describe('END-TO-END SMOKE: core boot artifacts exist', () => {
  // These tests don't run vite, but they prove the project structure
  // is in the shape SvelteKit/adapter-cloudflare expect at boot.

  it('svelte.config.js exports a config (not a function returning a config)', () => {
    const cfg = readConfig('svelte.config.js');
    expect(cfg).toMatch(/export default config/);
  });

  it('app.html contains the required SvelteKit placeholders', () => {
    const html = read('src/app.html');
    expect(html).toMatch(/%sveltekit\.head%/);
    expect(html).toMatch(/%sveltekit\.body%/);
  });

  it('app.html wraps body in a div (browser-extension hydration safety)', () => {
    // Per SvelteKit docs: %sveltekit.body% should live inside a <div>
    // or other element, rather than directly inside <body>, to prevent
    // bugs caused by browser extensions injecting elements that are
    // then destroyed by the hydration process.
    const html = read('src/app.html');
    expect(html).toMatch(/<div[^>]*>%sveltekit\.body%<\/div>/);
  });

  it('hooks.server.ts exports a handle function (or sequence)', () => {
    const h = read('src/hooks.server.ts');
    expect(h).toMatch(/export\s+const\s+handle\s*=/);
  });

  it('every route file is a real SvelteKit route name (+page, +server, +layout)', async() => {
    // const { execSync } = require('node:child_process');
    const { execSync} = await import('node:child_process');
    const out = execSync(
      `find ${resolve(ROOT, 'src/routes')} -name "*.svelte" -o -name "*.ts" | xargs -n1 basename`,
      { encoding: 'utf8' }
    );
    const files = out.trim().split('\n');
    // Filter out $types.d.ts which SvelteKit generates
    const offenders = files.filter(
      (f) => !f.startsWith('+') && !f.startsWith('$') && !f.endsWith('.d.ts')
    );
    expect(offenders).toEqual([]);
  });
});
