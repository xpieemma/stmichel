// import { json } from '@sveltejs/kit';
// import type { RequestHandler } from './$types';

// export const GET: RequestHandler = async ({ platform, cookies }) => {
//   if (!cookies.get('admin_session')) return json({ error: 'Unauthorized' }, { status: 401 });
//   const db = platform?.env?.DB;
//   if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

//   const rows = await db.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all();
//   return json({ items: rows.results || [] });
// };


import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, cookies }) => {
  if (!cookies.get('admin_session')) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  if (!db) return json({ items: [] });

  try {
    const rows = await db.prepare(
      'SELECT id, event_id, event_title, rating, comment, created_at FROM feedback ORDER BY created_at DESC'
    ).all();
    return json({ items: rows.results || [] });
  } catch { return json({ items: [] }); }
};