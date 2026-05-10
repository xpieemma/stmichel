/**
 * tests/config-consistency.test.ts
 *
 * Verifies that configuration files agree with what the code expects.
 * These are the "silent bugs" that ship as misalignment between
 * config and code:
 *
 *   - wrangler.toml uses `PUBLIC_RP_ID` (not VITE_PUBLIC_RP_ID), since
 *     the code reads `$env/static/public.PUBLIC_RP_ID`. (Bugs 1, 5)
 *
 *   - wrangler.toml has NO `main = ...` field (Workers-only directive
 *     that doesn't apply to Pages with adapter-cloudflare). (Bug 2)
 *
 *   - compatibility_date is recent enough to get bugfix Workers
 *     features. (Bug 3)
 *
 *   - CSP includes 'wasm-unsafe-eval' so SQLite WASM can compile.
 *     This is the silent killer; without it OPFS is dead. (Bug 6)
 *
 *   - static/_headers exists and sets COOP/COEP for production. (Bug 7)
 *
 *   - migrations/008 uses copy-and-swap, not CREATE IF NOT EXISTS,
 *     so the schema actually evolves on existing databases. (Bug 7)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe('wrangler.toml (Round 4 bugs #1-4)', () => {
  const toml = read('wrangler.toml');

  it('uses PUBLIC_RP_ID (NOT the VITE_ prefix)', () => {
    expect(toml).toMatch(/PUBLIC_RP_ID\s*=/);
    expect(toml).not.toMatch(/^[^#\n]*VITE_PUBLIC_RP_ID\s*=/m);
  });

  it('does NOT have a `main = ...` directive (Workers-only)', () => {
    // Allow `main` inside comments/explanations
    const lines = toml.split('\n').filter(l => !l.trim().startsWith('#'));
    expect(lines.join('\n')).not.toMatch(/^\s*main\s*=/m);
  });

  it('has pages_build_output_dir for adapter-cloudflare', () => {
    expect(toml).toMatch(/pages_build_output_dir\s*=\s*"\.svelte-kit\/cloudflare"/);
  });

  it('has a recent compatibility_date (>= 2024-09-01)', () => {
    const m = toml.match(/compatibility_date\s*=\s*"(\d{4})-(\d{2})-(\d{2})"/);
    expect(m).not.toBeNull();
    const [, y, mo] = m!;
    const date = parseInt(y) * 100 + parseInt(mo);
    expect(date).toBeGreaterThanOrEqual(2024 * 100 + 9);
  });

  it('declares D1 + KV bindings the code uses', () => {
    expect(toml).toMatch(/binding\s*=\s*"DB"/);
    expect(toml).toMatch(/binding\s*=\s*"KV"/);
  });
});

describe('.env.example (Round 4 bug #5)', () => {
  const env = read('.env.example');

  it('uses PUBLIC_RP_ID (NOT the VITE_ prefix)', () => {
    expect(env).toMatch(/^PUBLIC_RP_ID=/m);
    expect(env).not.toMatch(/^VITE_PUBLIC_RP_ID=/m);
  });

  it('lists private vars the WhatsApp endpoint reads', () => {
    expect(env).toMatch(/WHATSAPP_VERIFY_TOKEN=/);
    expect(env).toMatch(/WHATSAPP_PHONE_ID=/);
    expect(env).toMatch(/WHATSAPP_TOKEN=/);
  });
});

describe('CSP headers (Round 4 bug #6 — the silent killer)', () => {
  const hooks = read('src/hooks.server.ts');

  it("includes 'wasm-unsafe-eval' in script-src (without this, SQLite WASM is dead)", () => {
    expect(hooks).toMatch(/script-src[^,]*'wasm-unsafe-eval'/);
  });

  it('sets Cross-Origin-Opener-Policy: same-origin (required for SharedArrayBuffer)', () => {
    expect(hooks).toMatch(/'Cross-Origin-Opener-Policy',\s*'same-origin'/);
  });

  it('sets Cross-Origin-Embedder-Policy: require-corp', () => {
    expect(hooks).toMatch(/'Cross-Origin-Embedder-Policy',\s*'require-corp'/);
  });
});

describe('static/_headers (production CDN headers)', () => {
  it('exists', () => {
    expect(existsSync(resolve(ROOT, 'static/_headers'))).toBe(true);
  });

  it('sets COOP and COEP for static assets (hooks alone is not enough)', () => {
    const headers = read('static/_headers');
    expect(headers).toMatch(/Cross-Origin-Opener-Policy:\s*same-origin/);
    expect(headers).toMatch(/Cross-Origin-Embedder-Policy:\s*require-corp/);
  });
});

describe('migrations/008 (Round 4 bug #7 — the no-op migration)', () => {
  const m008 = read('migrations/008_stamp_idempotency.sql');

  it('uses copy-and-swap (not CREATE TABLE IF NOT EXISTS on the original name)', () => {
    // The bug: original was just `CREATE TABLE IF NOT EXISTS stamp_analytics`
    // which is a no-op when the table already exists from migration 001.
    expect(m008).toMatch(/CREATE TABLE IF NOT EXISTS stamp_analytics_new/);
    expect(m008).toMatch(/DROP TABLE stamp_analytics/);
    expect(m008).toMatch(/ALTER TABLE stamp_analytics_new RENAME TO stamp_analytics/);
  });

  it('preserves legacy rows by synthesizing a nonce', () => {
    expect(m008).toMatch(/INSERT INTO stamp_analytics_new[\s\S]*FROM stamp_analytics/);
    expect(m008).toMatch(/printf\('legacy-%d',\s*id\)/);
  });

  it('runs in a transaction', () => {
    expect(m008).toMatch(/BEGIN TRANSACTION/);
    expect(m008).toMatch(/COMMIT/);
  });

  it('creates the analytics indexes', () => {
    expect(m008).toMatch(/CREATE INDEX IF NOT EXISTS idx_stamp_analytics_event/);
    expect(m008).toMatch(/CREATE INDEX IF NOT EXISTS idx_stamp_analytics_user/);
  });
});

describe('migrations/006 (Round 4 bug #17)', () => {
  it('includes the city_info index', () => {
    expect(read('migrations/006_indexes.sql')).toMatch(/idx_city_info_updated_at/);
  });
});
