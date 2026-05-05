import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Cheap health check for uptime monitors. Returns 200 if the Worker
// can respond AND can reach D1 (a single cheap SELECT). Returns 503
// if D1 isn't reachable. Deliberately NOT gated by the admin origin
// check so monitors don't need to spoof headers.

export const GET: RequestHandler = async ({ platform }) => {
  const db = platform?.env?.DB;
  if (!db) {
    return json(
      { ok: false, error: 'no D1 binding' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
  try {
    const row = await db.prepare('SELECT 1 as ping').first<{ ping: number }>();
    if (row?.ping !== 1) {
      return json({ ok: false, error: 'unexpected response' }, { status: 503 });
    }
    return json(
      { ok: true, now: Math.floor(Date.now() / 1000) },
      { headers: { 'cache-control': 'no-store' } }
    );
  } catch (err) {
    return json(
      { ok: false, error: (err as Error).message },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
};
