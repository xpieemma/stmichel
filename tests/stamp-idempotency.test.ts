/**
 * tests/stamp-idempotency.test.ts
 *
 * Verifies the core idempotency contract of the passport sync system:
 * a network retry that lands twice MUST NOT record two stamps.
 *
 * This test directly drives the same SQL the production endpoint runs,
 * against an in-memory D1 with the actual production migrations
 * applied. If the migration is wrong (Round 4 bug #7), this test
 * fails — which is the whole point.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockD1, loadMigrations } from './helpers/d1-mock';
import { resolve } from 'node:path';

const MIGRATIONS = [
  resolve(__dirname, '../migrations/001_initial.sql'),
  resolve(__dirname, '../migrations/008_stamp_idempotency.sql')
];

async function postStamp(d1: any, payload: { nonce: string; eventId: number; userId?: string; clientTs?: number | null }) {
  // Mirrors the exact SQL of src/routes/api/passport/sync/+server.ts
  await d1
    .prepare(
      `INSERT OR IGNORE INTO stamp_analytics
         (nonce, event_id, user_id, client_ts, server_ts)
       VALUES (?, ?, ?, ?, unixepoch())`
    )
    .bind(payload.nonce, payload.eventId, payload.userId || 'anonymous', payload.clientTs ?? null)
    .run();
}

async function countStamps(d1: any, eventId?: number): Promise<number> {
  const sql = eventId !== undefined
    ? 'SELECT COUNT(*) as n FROM stamp_analytics WHERE event_id = ?'
    : 'SELECT COUNT(*) as n FROM stamp_analytics';
  const stmt = d1.prepare(sql);
  if (eventId !== undefined) stmt.bind(eventId);
  const row = await stmt.first<{ n: number }>();
  return row?.n ?? 0;
}

describe('Stamp idempotency (Round 4 fix #B)', () => {
  let d1: any;

  beforeEach(async () => {
    d1 = await createMockD1();
    loadMigrations(d1, MIGRATIONS);
  });

  it('migration 008 created the post-cure schema with `nonce` column', async () => {
    // If migration 008 was a no-op (the bug), `nonce` would not exist.
    const cols = await d1
      .prepare('PRAGMA table_info(stamp_analytics)')
      .all<{ name: string }>();
    const names = cols.results.map((c: any) => c.name);
    expect(names).toContain('nonce');
    expect(names).toContain('client_ts');
    expect(names).toContain('server_ts');
  });

  it('records a stamp on first call', async () => {
    await postStamp(d1, { nonce: 'a-1', eventId: 100, userId: 'dev-1' });
    expect(await countStamps(d1, 100)).toBe(1);
  });

  it('SAME nonce twice → only one row (the central idempotency contract)', async () => {
    await postStamp(d1, { nonce: 'retry-nonce', eventId: 100, userId: 'dev-1' });
    await postStamp(d1, { nonce: 'retry-nonce', eventId: 100, userId: 'dev-1' });
    await postStamp(d1, { nonce: 'retry-nonce', eventId: 100, userId: 'dev-1' });
    expect(await countStamps(d1, 100)).toBe(1);
  });

  it('different nonces, same event → multiple rows (different users CAN both stamp)', async () => {
    await postStamp(d1, { nonce: 'user1', eventId: 100, userId: 'dev-1' });
    await postStamp(d1, { nonce: 'user2', eventId: 100, userId: 'dev-2' });
    await postStamp(d1, { nonce: 'user3', eventId: 100, userId: 'dev-3' });
    expect(await countStamps(d1, 100)).toBe(3);
  });

  it('records server_ts authoritatively (client clock is informational)', async () => {
    const wrongClientTs = 0; // device clock thinks it's 1970
    await postStamp(d1, { nonce: 'clock-test', eventId: 100, clientTs: wrongClientTs });
    const row = await d1
      .prepare('SELECT client_ts, server_ts FROM stamp_analytics WHERE nonce = ?')
      .bind('clock-test')
      .first<{ client_ts: number; server_ts: number }>();
    expect(row).not.toBeNull();
    expect(row!.client_ts).toBe(0);
    expect(row!.server_ts).toBeGreaterThan(1_700_000_000); // sometime after 2023
  });

  it('event_id index exists (sync-engine query-shape sanity)', async () => {
    const idx = await d1
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='stamp_analytics'")
      .all<{ name: string }>();
    const names = idx.results.map((r: any) => r.name);
    expect(names).toContain('idx_stamp_analytics_event');
  });
});
