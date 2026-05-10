/**
 * tests/round13-hidden-bugs.test.ts
 *
 * Pins each of the six hidden bugs caught in Round 13.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe("Bug 1 — verifySession handles usernames with '.'", () => {
  const session = read('src/lib/server/admin-session.ts');

  it('parses tokens by rsplit (lastIndexOf), not split-on-every-dot', () => {
    // Pre-Round-13: token.split('.') failed for usernames with dots
    // (e.g. 'john.smith' → 4 parts, rejected). Round 13 uses
    // lastIndexOf to find the rightmost two boundaries.
    expect(session).toMatch(/lastIndexOf\(['"].['"]\)/);
    expect(session).not.toMatch(/parts\.length\s*!==?\s*3/);
  });

  it('reconstructs the username from the prefix before the last 2 dots', () => {
    expect(session).toMatch(/beforeSig\.slice\(0,\s*secondLastDot\)/);
  });
});

describe('Bug 2 — grant-admin.js escapes SQL single quotes', () => {
  const grant = read('scripts/grant-admin.js');

  it('has a sqlQuote helper that doubles single quotes', () => {
    expect(grant).toMatch(/function sqlQuote/);
    expect(grant).toMatch(/replace\(\/'\/g,\s*"''"\)/);
  });

  it('rejects NUL bytes (defense against null-byte SQL truncation)', () => {
    expect(grant).toMatch(/Refusing to embed NUL byte/);
  });

  it('all email/password references in SQL go through sqlQuote', () => {
    // No bare '${email}' in any SQL line — it must be ${sqlQuote(email)}
    const sqlLines = grant.match(/run\(`[\s\S]*?`\);?/g) || [];
    for (const line of sqlLines) {
      expect(line).not.toMatch(/'\$\{email\}'/);
      expect(line).not.toMatch(/'\$\{username\}'/);
      expect(line).not.toMatch(/'\$\{hashB64\}'/);
      expect(line).not.toMatch(/'\$\{saltB64\}'/);
    }
  });

  it('uses sqlQuote in actual interpolations', () => {
    expect(grant).toMatch(/sqlQuote\(email\)/);
    expect(grant).toMatch(/sqlQuote\(username\)/);
    expect(grant).toMatch(/sqlQuote\(hashB64\)/);
    expect(grant).toMatch(/sqlQuote\(saltB64\)/);
  });
});

describe('Bug 3 — request-access disambiguates colliding usernames', () => {
  const ra = read('src/routes/admin/api/request-access/+server.ts');

  it('checks for an existing row with the bare username', () => {
    expect(ra).toMatch(/SELECT email FROM admin_allowlist WHERE username = \?/);
  });

  it('falls back to a hash suffix when the email is different', () => {
    // Cured: if collision.email !== email, append a SHA-256 prefix
    expect(ra).toMatch(/collision.*email\s*!==?\s*email/);
    expect(ra).toMatch(/crypto\.subtle\.digest\(['"]SHA-256['"]/);
    expect(ra).toMatch(/`\$\{baseUsername\}-\$\{hex\}`/);
  });

  it('uses the original local-part when no collision exists', () => {
    // The variable is `let username = baseUsername`, only overwritten
    // on collision. Default path is unchanged behavior.
    expect(ra).toMatch(/let username = baseUsername/);
  });
});

describe('Bug 4 — authHandle fails closed when DB binding missing', () => {
  const hooks = read('src/hooks.server.ts');

  it('production with no DB returns 503 (not let through)', () => {
    expect(hooks).toMatch(/D1 binding missing in production/);
    expect(hooks).toMatch(/status:\s*503/);
  });

  it('apiAdminAuthHandle also has the fail-closed branch', () => {
    expect(hooks).toMatch(/auth-api/);
    // 503 JSON for API endpoints
    expect(hooks).toMatch(/Service unavailable/);
  });

  it('apiAdminAuthHandle ALSO does the cross-check (delete propagation)', () => {
    // Pre-Round-13: only the page authHandle did the cross-check.
    // API endpoints could be hit with a deleted-admin's signed cookie.
    expect(hooks).toMatch(/apiAdminAuthHandle[\s\S]+?SELECT username FROM admins WHERE username = \?/);
  });

  it('dev mode still tolerates missing DB (so handleError fires the hint)', () => {
    expect(hooks).toMatch(/else if \(!dev\)/);
  });
});

describe('Bug 5 — login accepts email or username', () => {
  const login = read('src/routes/admin/api/password/login/+server.ts');

  it('detects email by presence of @ and dispatches accordingly', () => {
    expect(login).toMatch(/identifier.+includes\(['"]@['"]\)/);
  });

  it('SQL queries by EITHER email OR username', () => {
    expect(login).toMatch(/WHERE email = \? OR username = \?/);
  });

  it('issues the cookie under the canonical username from the DB', () => {
    // The cookie carries `admin.username` (DB value) — not the input
    // identifier. So if a user logs in with email, their cookie still
    // identifies them by username for the cross-check.
    expect(login).toMatch(/issueSessionCookie\(cookies,\s*admin\.username/);
  });

  it('login UI label updated to mention both email and username', () => {
    const ui = read('src/routes/admin/login/+page.svelte');
    expect(ui).toMatch(/Email oswa non itilizatè/);
  });
});

describe('Bug 6 — og-default is .png (matches the actual bytes)', () => {
  it('static/og-default.png exists; old .jpg is gone', () => {
    expect(existsSync(resolve(ROOT, 'static/og-default.png'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'static/og-default.jpg'))).toBe(false);
  });

  it('all references in source updated to .png', () => {
    const refs = [
      'src/routes/event/[slug]/+page.server.ts',
      'src/routes/event/[slug]/+page.svelte',
      'src/routes/history/[slug]/+page.svelte',
      'src/routes/match/[slug]/+page.svelte',
    ];
    for (const r of refs) {
      const text = read(r);
      expect(text).not.toMatch(/og-default\.jpg/);
    }
  });

  it('demo content seed updated to .png', () => {
    expect(read('migrations/013_demo_content.sql')).not.toMatch(/og-default\.jpg/);
    expect(read('migrations/013_demo_content.sql')).toMatch(/og-default\.png/);
  });
});
