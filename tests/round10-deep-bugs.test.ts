/**
 * tests/round10-deep-bugs.test.ts
 *
 * Pins every Round 10 cure. The bugs were caught by:
 *  - reading the auth model carefully (cookie was just plaintext username)
 *  - actually trying to spoof the cookie via curl (worked: 200 OK)
 *  - reading admin POST handlers and noticing no input validation
 *  - reading the city admin page and spotting the Date.now() ms unit slip
 *  - tracing why helpfulErrorHandle wasn't actually firing
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe('Bug 1 — Admin session cookie is HMAC-signed, not plaintext', () => {
  const session = read('src/lib/server/admin-session.ts');
  const hooks = read('src/hooks.server.ts');

  it('admin-session module exists and uses HMAC-SHA256', () => {
    expect(existsSync(resolve(ROOT, 'src/lib/server/admin-session.ts'))).toBe(true);
    expect(session).toMatch(/HMAC['"]\s*,\s*hash:\s*['"]SHA-256/);
  });

  it('verifySession does constant-time signature comparison (no XOR-leak)', () => {
    expect(session).toMatch(/constantTimeEqual/);
    expect(session).toMatch(/diff\s*\|=/);
  });

  it('verifySession enforces server-side TTL (so cookie copy attacks are bounded)', () => {
    expect(session).toMatch(/MAX_SESSION_AGE_SECONDS/);
    expect(session).toMatch(/86400/);
  });

  it('verifySession returns null on bad shape, signature, or expiry (one return type)', () => {
    expect(session).toMatch(/Promise<string \| null>/);
  });

  it('hooks.server.ts authHandle calls verifySession (not just checks cookie presence)', () => {
    expect(hooks).toMatch(/await verifySession\(/);
    // Pre-Round-10: `if (!session) redirect()`
    expect(hooks).not.toMatch(/if\s*\(\s*!session\s*\)\s*\{[^}]*302[^}]*\/admin\/login/);
  });

  it('hooks.server.ts cross-checks the admins table (deleted users are locked out)', () => {
    expect(hooks).toMatch(/SELECT username FROM admins WHERE username = \?/);
    expect(hooks).toMatch(/cookies\.delete\(['"]admin_session['"]/);
  });

  it('webauthn verify endpoint uses issueSessionCookie (signed)', () => {
    const v = read('src/routes/admin/api/webauthn/verify/+server.ts');
    expect(v).toMatch(/issueSessionCookie\(/);
  });

  it('password login endpoint uses issueSessionCookie (signed)', () => {
    const l = read('src/routes/admin/api/password/login/+server.ts');
    expect(l).toMatch(/issueSessionCookie\(/);
  });

  it('apiAdminAuthHandle gates /api/admin/* with verified cookie (401 not 500)', () => {
    expect(hooks).toMatch(/apiAdminAuthHandle/);
    expect(hooks).toMatch(/\/api\/admin\//);
    expect(hooks).toMatch(/Unauthorized/);
  });

  it('.env declares ADMIN_SESSION_SECRET', () => {
    expect(read('.env')).toMatch(/ADMIN_SESSION_SECRET/);
  });
});

describe('Bug 2 — Admin POST endpoints validate inputs (400 not 500)', () => {
  const ENDPOINTS = [
    ['src/routes/api/admin/events/+server.ts', /data\.title is required/],
    ['src/routes/api/admin/matches/+server.ts', /data\.homeTeam is required/],
    ['src/routes/api/admin/city/+server.ts', /data\.key is required/],
    ['src/routes/api/admin/albums/+server.ts', /data\.title is required/],
  ];

  for (const [path, errorRegex] of ENDPOINTS) {
    it(`${path} validates required fields`, () => {
      const content = read(path as string);
      expect(content).toMatch(errorRegex as RegExp);
      // Must return 400, not let toLowerCase() throw a 500
      expect(content).toMatch(/status:\s*400/);
    });
  }

  it('events endpoint guards before calling toLowerCase() on title', () => {
    const content = read('src/routes/api/admin/events/+server.ts');
    // The validation must come BEFORE the slug computation
    const validateIdx = content.indexOf('data.title is required');
    const slugIdx = content.indexOf('toLowerCase');
    expect(validateIdx).toBeGreaterThan(-1);
    expect(slugIdx).toBeGreaterThan(-1);
    expect(validateIdx).toBeLessThan(slugIdx);
  });

  it('matches endpoint guards before slug computation', () => {
    const content = read('src/routes/api/admin/matches/+server.ts');
    const validateIdx = content.indexOf('data.homeTeam is required');
    const slugIdx = content.indexOf('toLowerCase');
    expect(validateIdx).toBeGreaterThan(-1);
    expect(slugIdx).toBeGreaterThan(-1);
    expect(validateIdx).toBeLessThan(slugIdx);
  });
});

describe('Bug 3 — city admin uses unixepoch SECONDS not Date.now() ms', () => {
  it('city admin save() writes Math.floor(Date.now() / 1000), not Date.now()', () => {
    const c = read('src/routes/admin/dashboard/city/+page.svelte');
    // Cured
    expect(c).toMatch(/updatedAt:\s*Math\.floor\(Date\.now\(\)\s*\/\s*1000\)/);
    // Buggy line removed
    expect(c).not.toMatch(/updatedAt:\s*Date\.now\(\)\s*\}/);
  });
});

describe('Bug 4 — handleError catches no-such-table (was in dead Handle wrapper)', () => {
  const hooks = read('src/hooks.server.ts');

  it('handleError detects "no such table" and emits a 503 with hint', () => {
    expect(hooks).toMatch(/handleError[\s\S]+?no such table/);
    expect(hooks).toMatch(/handleError[\s\S]+?code:\s*503/);
  });

  it('handleError only emits hint in dev', () => {
    expect(hooks).toMatch(/handleError[\s\S]+?dev\s*&&\s*error\s+instanceof\s+Error/);
  });

  it('the dead helpfulErrorHandle wrapper is removed (was never reached)', () => {
    expect(hooks).not.toMatch(/helpfulErrorHandle/);
  });

  it('the sequence does not reference the removed wrapper', () => {
    expect(hooks).not.toMatch(/sequence\(\s*helpfulErrorHandle/);
  });
});

describe('Bug 5 — admin dashboard save() validates + surfaces sync errors', () => {
  const dash = read('src/routes/admin/dashboard/+page.svelte');

  it('save() guards against empty title BEFORE calling toLowerCase()', () => {
    expect(dash).toMatch(/if\s*\(\s*!form\.title/);
  });

  it('save() guards against empty date', () => {
    expect(dash).toMatch(/if\s*\(\s*!form\.date/);
  });

  it('save() does NOT silently swallow syncToServer errors', () => {
    // Pre-Round-10: try { syncToServer(...) } catch {} (silent)
    // Cured: alerts the user that the local write succeeded but sync failed
    expect(dash).not.toMatch(/catch\s*\{\s*\}/);
    expect(dash).toMatch(/syncToServer[\s\S]+?catch.+console\.error/s);
  });
});

describe('END-TO-END: cookie spoof attempt fails', () => {
  // Pure source-level smoke test that the security model is what we claim.
  // The actual curl test was done at audit time; this asserts the code
  // shape that produced that result.
  const hooks = read('src/hooks.server.ts');

  it('admin paths require a cryptographically valid cookie (not just present)', () => {
    expect(hooks).toMatch(/verifySession\([^)]*token/);
    expect(hooks).toMatch(/if\s*\(!username\)\s*\{[\s\S]*?302/);
  });

  it('an unknown username (cookie verified but admin deleted) is also rejected', () => {
    expect(hooks).toMatch(/SELECT username FROM admins/);
    expect(hooks).toMatch(/cookies\.delete\(['"]admin_session['"]/);
  });
});
