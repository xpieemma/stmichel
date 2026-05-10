/**
 * tests/migrations-end-to-end.test.ts
 *
 * Runs ALL migrations in order against an in-memory database and
 * verifies the resulting schema matches what the production code
 * expects. This catches:
 *
 *   - Migration syntax errors (would crash `wrangler d1 execute`)
 *   - Migration ordering issues
 *   - Tables/columns referenced by code but missing from migrations
 *
 * Crucially: this verifies that running migrations 001 → 008 in
 * order produces a database with the post-cure stamp_analytics
 * schema. If migration 008 reverts to its no-op form, this fails.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { createMockD1, loadMigrations } from './helpers/d1-mock';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const MIG_DIR = resolve(__dirname, '../migrations');

describe('Migrations end-to-end', () => {
  let d1: any;

  beforeAll(async () => {
    d1 = await createMockD1();
    // Run them in lexicographic order — the same order package.json runs them.
    const files = readdirSync(MIG_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map((f) => resolve(MIG_DIR, f));
    loadMigrations(d1, files);
  });

  it('all 8 migrations run cleanly without throwing', async () => {
    // Just having `beforeAll` succeed is the assertion. If any
    // migration syntax is wrong, this test file won't even load.
    const tables = await d1
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all<{ name: string }>();
    const names = tables.results.map((r: any) => r.name);
    expect(names.length).toBeGreaterThan(0);
  });

  it('creates all tables the code references', async () => {
    const tables = await d1
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all<{ name: string }>();
    const names = tables.results.map((r: any) => r.name);

    // Every table the API endpoints query
    expect(names).toContain('events');
    expect(names).toContain('matches');
    expect(names).toContain('match_photos');
    expect(names).toContain('albums');
    expect(names).toContain('album_photos');
    expect(names).toContain('city_info');
    expect(names).toContain('admins');
    expect(names).toContain('feedback');
    expect(names).toContain('stamp_analytics');
  });

  it('stamp_analytics has the POST-cure schema (the central Round 4 #7 verification)', async () => {
    const cols = await d1
      .prepare('PRAGMA table_info(stamp_analytics)')
      .all<{ name: string }>();
    const colNames = cols.results.map((c: any) => c.name);

    // These columns ONLY exist if migration 008's copy-and-swap actually ran.
    // If migration 008 reverts to `CREATE TABLE IF NOT EXISTS` (the bug),
    // the table keeps its old schema and these assertions fail.
    expect(colNames).toContain('nonce');
    expect(colNames).toContain('client_ts');
    expect(colNames).toContain('server_ts');
  });

  it('stamp_analytics nonce column is UNIQUE', async () => {
    // The unique constraint is what makes INSERT OR IGNORE safe.
    await d1
      .prepare(
        `INSERT INTO stamp_analytics (nonce, event_id, user_id, client_ts, server_ts)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind('uniq-test', 1, 'u', null, 1700000000)
      .run();

    let secondInsertThrew = false;
    try {
      await d1
        .prepare(
          `INSERT INTO stamp_analytics (nonce, event_id, user_id, client_ts, server_ts)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind('uniq-test', 2, 'u2', null, 1700000001)
        .run();
    } catch {
      secondInsertThrew = true;
    }
    expect(secondInsertThrew).toBe(true);

    // But INSERT OR IGNORE should silently succeed
    await d1
      .prepare(
        `INSERT OR IGNORE INTO stamp_analytics (nonce, event_id, user_id, client_ts, server_ts)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind('uniq-test', 3, 'u3', null, 1700000002)
      .run();

    const count = await d1
      .prepare("SELECT COUNT(*) as n FROM stamp_analytics WHERE nonce = 'uniq-test'")
      .first<{ n: number }>();
    expect(count!.n).toBe(1);
  });

  it('all sync-target tables have updated_at indexes (incremental sync performance)', async () => {
    const indexes = await d1
      .prepare("SELECT name, tbl_name FROM sqlite_master WHERE type='index'")
      .all<{ name: string; tbl_name: string }>();
    const idxByTable = new Map<string, string[]>();
    for (const i of indexes.results) {
      const arr = idxByTable.get(i.tbl_name) || [];
      arr.push(i.name);
      idxByTable.set(i.tbl_name, arr);
    }

    expect((idxByTable.get('events') || []).some((n) => n.includes('updated_at'))).toBe(true);
    expect((idxByTable.get('matches') || []).some((n) => n.includes('updated_at'))).toBe(true);
    expect((idxByTable.get('albums') || []).some((n) => n.includes('updated_at'))).toBe(true);
    expect((idxByTable.get('city_info') || []).some((n) => n.includes('updated_at'))).toBe(true);
  });

  it('city_info has the festival_start and festival_end keys after migrations', async () => {
    const start = await d1
      .prepare("SELECT * FROM city_info WHERE key = 'festival_start'")
      .first<any>();
    const end = await d1
      .prepare("SELECT * FROM city_info WHERE key = 'festival_end'")
      .first<any>();
    expect(start).not.toBeNull();
    expect(end).not.toBeNull();
  });
});
