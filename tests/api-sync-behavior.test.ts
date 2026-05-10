/**
 * tests/api-sync-behavior.test.ts
 *
 * Exercises the actual production SQL queries from the sync
 * endpoints (/api/events/sync, /api/feedback, /api/passport/sync)
 * against an in-memory database with the real migrations applied.
 *
 * This is a behavioral test: we simulate what a phone would send,
 * we run exactly what the production endpoint runs, and we verify
 * the response shape matches what the client-side sync code expects
 * to consume.
 *
 * If the API contract drifts from the client expectations, these
 * tests fail — which is the only way to catch the silent
 * snake_case/camelCase aliasing bug class.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockD1, loadMigrations } from './helpers/d1-mock';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const MIG_DIR = resolve(__dirname, '../migrations');

async function freshDb() {
  const d1 = await createMockD1();
  const files = readdirSync(MIG_DIR)
    .filter((f) => f.endsWith('.sql'))
    // Exclude the demo-content seed migration (013). These tests assert
    // behavior on an empty schema; they own their own fixtures and the
    // demo seeds would pollute the row counts.
    .filter((f) => !f.includes('demo_content'))
    .sort()
    .map((f) => resolve(MIG_DIR, f));
  loadMigrations(d1, files);
  return d1;
}

// ─── /api/events/sync simulator (verbatim SQL from production) ──
async function eventsSync(d1: any, since: string) {
  const result = await d1
    .prepare(
      `SELECT id, slug, title, description, date, time, location, lat, lng,
              image_url as imageUrl, blur_hash as blurHash, type,
              created_at as createdAt, updated_at as updatedAt, published
       FROM events
       WHERE updated_at > ? AND published = 1`
    )
    .bind(since)
    .all();
  return result.results;
}

// ─── /api/passport/sync simulator (verbatim) ────────────────────
async function passportSync(
  d1: any,
  payload: { nonce: string; eventId: number; userId?: string; clientTs?: number | null }
) {
  await d1
    .prepare(
      `INSERT OR IGNORE INTO stamp_analytics
         (nonce, event_id, user_id, client_ts, server_ts)
       VALUES (?, ?, ?, ?, unixepoch())`
    )
    .bind(payload.nonce, payload.eventId, payload.userId || 'anonymous', payload.clientTs ?? null)
    .run();
  return { success: true };
}

// ─── /api/feedback simulator (verbatim) ─────────────────────────
async function feedbackPost(
  d1: any,
  payload: { eventId: number; eventTitle: string; rating: number; comment?: string }
) {
  await d1
    .prepare(
      `INSERT INTO feedback (event_id, event_title, rating, comment, created_at)
       VALUES (?, ?, ?, ?, unixepoch())`
    )
    .bind(payload.eventId, payload.eventTitle, payload.rating, payload.comment || '')
    .run();
  return { success: true };
}

async function seedEvent(d1: any, ev: any) {
  const cols = ['slug', 'title', 'description', 'date', 'time', 'location', 'lat', 'lng', 'image_url', 'type', 'created_at', 'updated_at', 'published'];
  const placeholders = cols.map(() => '?').join(', ');
  await d1
    .prepare(`INSERT INTO events (${cols.join(', ')}) VALUES (${placeholders})`)
    .bind(
      ev.slug,
      ev.title,
      ev.description ?? '',
      ev.date,
      ev.time ?? null,
      ev.location ?? null,
      ev.lat ?? null,
      ev.lng ?? null,
      ev.imageUrl ?? null,
      ev.type ?? 'event',
      ev.createdAt ?? 1_700_000_000,
      ev.updatedAt ?? 1_700_000_000,
      ev.published ?? 1
    )
    .run();
}

describe('/api/events/sync — incremental sync contract', () => {
  let d1: any;
  beforeEach(async () => {
    d1 = await freshDb();
  });

  it('aliases snake_case columns to camelCase the client expects', async () => {
    await seedEvent(d1, {
      slug: 'test-event',
      title: 'Test',
      description: 'A test event',
      date: '2026-05-03',
      imageUrl: 'https://cdn.example.com/cover.jpg',
      updatedAt: 1_700_001_000
    });

    const rows = await eventsSync(d1, '0');
    expect(rows.length).toBe(1);
    const evt = rows[0];

    // The columns the Drizzle schema expects (camelCase keys).
    expect(evt).toHaveProperty('id');
    expect(evt).toHaveProperty('imageUrl');
    expect(evt).toHaveProperty('blurHash');
    expect(evt).toHaveProperty('createdAt');
    expect(evt).toHaveProperty('updatedAt');
    // Must NOT have the snake_case column names — that would mean the
    // alias was dropped, the sync reducer's stripId/onConflict path
    // would fail, and the OPFS database would carry mismatched columns.
    expect(evt).not.toHaveProperty('image_url');
    expect(evt).not.toHaveProperty('updated_at');
  });

  it('returns ONLY events updated after `since` (the watermark contract)', async () => {
    await seedEvent(d1, { slug: 'old', title: 'Old', date: '2026-05-01', updatedAt: 100 });
    await seedEvent(d1, { slug: 'mid', title: 'Mid', date: '2026-05-02', updatedAt: 500 });
    await seedEvent(d1, { slug: 'new', title: 'New', date: '2026-05-03', updatedAt: 900 });

    const rows = await eventsSync(d1, '400');
    const slugs = rows.map((r: any) => r.slug).sort();
    expect(slugs).toEqual(['mid', 'new']);
  });

  it('excludes unpublished events even when they meet the timestamp filter', async () => {
    await seedEvent(d1, { slug: 'draft', title: 'Draft', date: '2026-05-01', updatedAt: 1000, published: 0 });
    await seedEvent(d1, { slug: 'live', title: 'Live', date: '2026-05-02', updatedAt: 1000, published: 1 });

    const rows = await eventsSync(d1, '0');
    expect(rows.map((r: any) => r.slug)).toEqual(['live']);
  });

  it('returns empty array (not null) when nothing has changed', async () => {
    await seedEvent(d1, { slug: 'x', title: 'X', date: '2026-05-01', updatedAt: 100 });
    const rows = await eventsSync(d1, '999999');
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(0);
  });
});

describe('/api/passport/sync — full lifecycle', () => {
  let d1: any;
  beforeEach(async () => {
    d1 = await freshDb();
  });

  it('one phone retrying twice records ONE stamp', async () => {
    const payload = { nonce: 'phone-A-stamp-1', eventId: 7, userId: 'phone-A' };
    await passportSync(d1, payload);
    await passportSync(d1, payload); // network retry
    const row = await d1
      .prepare('SELECT COUNT(*) as n FROM stamp_analytics WHERE event_id = 7')
      .first<{ n: number }>();
    expect(row!.n).toBe(1);
  });

  it('100 different phones at the same event records 100 stamps', async () => {
    for (let i = 0; i < 100; i++) {
      await passportSync(d1, {
        nonce: `phone-${i}-stamp-1`,
        eventId: 42,
        userId: `phone-${i}`
      });
    }
    const row = await d1
      .prepare('SELECT COUNT(*) as n FROM stamp_analytics WHERE event_id = 42')
      .first<{ n: number }>();
    expect(row!.n).toBe(100);
  });

  it('one phone stamping multiple events records one row per event', async () => {
    await passportSync(d1, { nonce: 'p1-e1', eventId: 1, userId: 'phone-1' });
    await passportSync(d1, { nonce: 'p1-e2', eventId: 2, userId: 'phone-1' });
    await passportSync(d1, { nonce: 'p1-e3', eventId: 3, userId: 'phone-1' });
    const row = await d1
      .prepare("SELECT COUNT(*) as n FROM stamp_analytics WHERE user_id = 'phone-1'")
      .first<{ n: number }>();
    expect(row!.n).toBe(3);
  });

  it('userId defaults to "anonymous" when not provided', async () => {
    await passportSync(d1, { nonce: 'anon-1', eventId: 5 });
    const row = await d1
      .prepare("SELECT user_id FROM stamp_analytics WHERE nonce = 'anon-1'")
      .first<{ user_id: string }>();
    expect(row!.user_id).toBe('anonymous');
  });
});

describe('/api/feedback — submission persistence', () => {
  let d1: any;
  beforeEach(async () => {
    d1 = await freshDb();
  });

  it('persists a complete feedback row', async () => {
    await feedbackPost(d1, {
      eventId: 12,
      eventTitle: 'Konkou Dans',
      rating: 5,
      comment: 'Bèl evènman!'
    });
    const row = await d1
      .prepare('SELECT * FROM feedback WHERE event_id = 12')
      .first<any>();
    expect(row).not.toBeNull();
    expect(row.event_title).toBe('Konkou Dans');
    expect(row.rating).toBe(5);
    expect(row.comment).toBe('Bèl evènman!');
    expect(row.created_at).toBeGreaterThan(1_700_000_000);
  });

  it('accepts feedback without a comment (comment is optional)', async () => {
    await feedbackPost(d1, { eventId: 12, eventTitle: 'X', rating: 4 });
    const row = await d1
      .prepare('SELECT comment FROM feedback WHERE event_id = 12')
      .first<{ comment: string }>();
    expect(row!.comment).toBe('');
  });

  it('multiple feedback rows for the same event are all stored (no dedup)', async () => {
    for (let i = 0; i < 5; i++) {
      await feedbackPost(d1, { eventId: 12, eventTitle: 'X', rating: i + 1 });
    }
    const row = await d1
      .prepare('SELECT COUNT(*) as n FROM feedback WHERE event_id = 12')
      .first<{ n: number }>();
    expect(row!.n).toBe(5);
  });
});
