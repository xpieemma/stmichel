/**
 * tests/whatsapp-bot.test.ts
 *
 * Verifies the WhatsApp bot's reply-generation logic against a real
 * in-memory database. The bot is the only zero-data path users have,
 * so its query shapes and reply formatting need to actually work
 * end-to-end.
 *
 * We re-implement the reply selector in a testable form (matching
 * the production endpoint exactly) and exercise it against seeded
 * data.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockD1, loadMigrations } from './helpers/d1-mock';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const MIG_DIR = resolve(__dirname, '../migrations');

const DEFAULT_REPLY =
  'Bonjou! Byenvini nan ST MICHEL. Voye "evènman" pou lis aktivite, "match" pou match foutbòl, oswa "vil" pou enfòmasyon sou St Michel.';

const CITY_REPLY =
  "St Michel de l'Attalaye – Kapital kleren an. Li te fonde an 1768. Festival 888 chak ane 8 me. Majistra: Dr. Gueillant Dorcinvil. Radyo lokal: RFP 95.1 FM.";

// Re-implements the reply selector from
// src/routes/api/whatsapp/+server.ts. Same SQL, same branching.
async function whatsappReply(d1: any, body: any): Promise<string> {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  if (!value?.messages?.length) return ''; // ghost-webhook guard: no reply

  const message = value.messages[0];
  const text = (message.text?.body || '').toLowerCase();

  let reply = DEFAULT_REPLY;

  try {
    if (text.includes('evènman') || text.includes('event')) {
      const events = await d1
        .prepare(
          `SELECT title, date, time, location FROM events
           WHERE type='event' AND published=1 AND date >= date('now')
           ORDER BY date LIMIT 5`
        )
        .all();
      if (events.results.length) {
        reply =
          'Evènman kap vini:\n' +
          events.results
            .map((e: any) => `• ${e.title} – ${e.date} ${e.time || ''} @ ${e.location || 'St Michel'}`)
            .join('\n');
      } else {
        reply = 'Pa gen evènman pwograme kounye a.';
      }
    } else if (text.includes('match')) {
      const matches = await d1
        .prepare(
          `SELECT home_team, away_team, match_date, match_time, location FROM matches
           WHERE status='upcoming' AND published=1 ORDER BY match_date LIMIT 5`
        )
        .all();
      if (matches.results.length) {
        reply =
          'Match kap vini:\n' +
          matches.results
            .map(
              (m: any) =>
                `• ${m.home_team} vs ${m.away_team} – ${m.match_date} ${m.match_time || ''} @ ${m.location || 'St Michel'}`
            )
            .join('\n');
      } else {
        reply = 'Pa gen match pwograme.';
      }
    } else if (text.includes('vil') || text.includes('city')) {
      reply = CITY_REPLY;
    }
  } catch (err) {
    // Falls through with default reply on any DB error.
  }
  return reply;
}

async function freshDb() {
  const d1 = await createMockD1();
  // Exclude demo content seeds (013) — these tests own their fixtures
  // and would otherwise count demo rows in their assertions.
  const files = readdirSync(MIG_DIR)
    .filter((f) => f.endsWith('.sql') && !f.includes('demo_content'))
    .sort()
    .map((f) => resolve(MIG_DIR, f));
  loadMigrations(d1, files);
  return d1;
}

function userMessage(text: string) {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              messages: [{ from: '15551234567', text: { body: text } }]
            }
          }
        ]
      }
    ]
  };
}

describe('WhatsApp bot — query-and-reply behavior', () => {
  let d1: any;
  beforeEach(async () => {
    d1 = await freshDb();
  });

  it('returns the welcome menu for unrecognized text', async () => {
    const reply = await whatsappReply(d1, userMessage('hello'));
    expect(reply).toBe(DEFAULT_REPLY);
  });

  it('"vil" returns the city info reply', async () => {
    const reply = await whatsappReply(d1, userMessage('vil'));
    expect(reply).toBe(CITY_REPLY);
  });

  it('"city" (English alias) also returns city info', async () => {
    const reply = await whatsappReply(d1, userMessage('city'));
    expect(reply).toBe(CITY_REPLY);
  });

  it('"evènman" with NO upcoming events returns the polite empty state', async () => {
    const reply = await whatsappReply(d1, userMessage('evènman'));
    expect(reply).toBe('Pa gen evènman pwograme kounye a.');
  });

  it('"evènman" with upcoming events lists them', async () => {
    const future = '2099-05-03';
    await d1
      .prepare(
        `INSERT INTO events (slug, title, description, date, time, location, type, created_at, updated_at, published)
         VALUES (?, ?, ?, ?, ?, ?, 'event', unixepoch(), unixepoch(), 1)`
      )
      .bind('konkou-dans', 'Konkou Dans', '', future, '20:00', 'Plas Piblik')
      .run();

    const reply = await whatsappReply(d1, userMessage('evènman'));
    expect(reply).toMatch(/Evènman kap vini:/);
    expect(reply).toContain('Konkou Dans');
    expect(reply).toContain(future);
    expect(reply).toContain('Plas Piblik');
  });

  it('"evènman" excludes PAST events (date >= today filter)', async () => {
    await d1
      .prepare(
        `INSERT INTO events (slug, title, description, date, type, created_at, updated_at, published)
         VALUES ('past', 'Past', '', '2020-01-01', 'event', unixepoch(), unixepoch(), 1)`
      )
      .run();

    const reply = await whatsappReply(d1, userMessage('evènman'));
    expect(reply).not.toContain('Past');
    expect(reply).toBe('Pa gen evènman pwograme kounye a.');
  });

  it('"evènman" excludes UNPUBLISHED events even if their date is future', async () => {
    await d1
      .prepare(
        `INSERT INTO events (slug, title, description, date, type, created_at, updated_at, published)
         VALUES ('draft', 'Draft', '', '2099-05-03', 'event', unixepoch(), unixepoch(), 0)`
      )
      .run();

    const reply = await whatsappReply(d1, userMessage('evènman'));
    expect(reply).not.toContain('Draft');
  });

  it('"evènman" caps results at 5 to keep the WhatsApp message short', async () => {
    for (let i = 0; i < 8; i++) {
      await d1
        .prepare(
          `INSERT INTO events (slug, title, description, date, type, created_at, updated_at, published)
           VALUES (?, ?, '', ?, 'event', unixepoch(), unixepoch(), 1)`
        )
        .bind(`evt-${i}`, `Event ${i}`, `2099-05-${String(i + 1).padStart(2, '0')}`)
        .run();
    }
    const reply = await whatsappReply(d1, userMessage('evènman'));
    const bullets = reply.split('•').length - 1;
    expect(bullets).toBe(5);
  });

  it('"match" returns upcoming matches with home/away teams', async () => {
    await d1
      .prepare(
        `INSERT INTO matches (slug, home_team, away_team, match_date, match_time, location, status, created_at, updated_at, published)
         VALUES (?, ?, ?, ?, ?, ?, 'upcoming', unixepoch(), unixepoch(), 1)`
      )
      .bind('m1', 'Saint-Michel FC', 'Marchand FC', '2099-05-08', '15:00', 'Estad Komin')
      .run();

    const reply = await whatsappReply(d1, userMessage('match'));
    expect(reply).toMatch(/Match kap vini:/);
    expect(reply).toContain('Saint-Michel FC vs Marchand FC');
    expect(reply).toContain('2099-05-08');
  });

  it('"match" returns the polite empty state when no matches scheduled', async () => {
    const reply = await whatsappReply(d1, userMessage('match'));
    expect(reply).toBe('Pa gen match pwograme.');
  });

  it('"match" only returns matches with status=upcoming', async () => {
    await d1
      .prepare(
        `INSERT INTO matches (slug, home_team, away_team, match_date, status, created_at, updated_at, published)
         VALUES ('done', 'A', 'B', '2099-05-08', 'completed', unixepoch(), unixepoch(), 1)`
      )
      .run();

    const reply = await whatsappReply(d1, userMessage('match'));
    expect(reply).toBe('Pa gen match pwograme.');
  });

  it('case-insensitive: "EVÈNMAN" matches the same way as "evènman"', async () => {
    const reply = await whatsappReply(d1, userMessage('EVÈNMAN'));
    expect(reply).toBe('Pa gen evènman pwograme kounye a.'); // matched, just empty
  });

  it('substring matching: "tell me about evènman please" still triggers events', async () => {
    const reply = await whatsappReply(d1, userMessage('tell me about evènman please'));
    expect(reply).toBe('Pa gen evènman pwograme kounye a.');
  });
});
