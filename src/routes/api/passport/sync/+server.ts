import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface StampPayload {
  nonce?: string;
  eventId?: number;
  userId?: string;
  clientTs?: number;
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  let body: StampPayload;
  try {
    body = (await request.json()) as StampPayload;
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { nonce, eventId, userId, clientTs } = body;
  if (!nonce || typeof eventId !== 'number') {
    return json({ error: 'nonce and eventId required' }, { status: 400 });
  }

  try {
    // INSERT OR IGNORE makes this safe to retry: if the nonce is already
    // recorded, the second call is a silent no-op. The server timestamp
    // is authoritative — the client clock is only stored for analytics.
    await db
      .prepare(
        `INSERT OR IGNORE INTO stamp_analytics
           (nonce, event_id, user_id, client_ts, server_ts)
         VALUES (?, ?, ?, ?, unixepoch())`
      )
      .bind(nonce, eventId, userId || 'anonymous', clientTs || null)
      .run();
    return json({ success: true });
  } catch (e) {
    console.error('[stamp-sync]', e);
    return json({ success: false, error: 'Database error' }, { status: 500 });
  }
};
