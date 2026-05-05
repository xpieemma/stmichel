import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Admin CRUD for match photos. Uploading is handled by the caller
// (image URL passed in — Cloudflare Images or R2 does the actual
// upload). This endpoint just owns the DB row.

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  if (!cookies.get('admin_session')) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  const data = await request.json();
  if (!data.matchId || !data.imageUrl) {
    return json({ error: 'matchId and imageUrl required' }, { status: 400 });
  }

  await db
    .prepare(
      `INSERT INTO match_photos (match_id, image_url, blur_hash, caption, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, unixepoch())`
    )
    .bind(
      data.matchId,
      data.imageUrl,
      data.blurHash ?? null,
      data.caption ?? null,
      data.sortOrder ?? 0
    )
    .run();

  // Touch the parent match's updated_at so the sync engine picks it up.
  await db
    .prepare('UPDATE matches SET updated_at = unixepoch() WHERE id = ?')
    .bind(data.matchId)
    .run();

  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ url, platform, cookies }) => {
  if (!cookies.get('admin_session')) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  const id = url.searchParams.get('id');
  if (!db || !id) return json({ error: 'Invalid request' }, { status: 400 });

  const row = await db
    .prepare('SELECT match_id FROM match_photos WHERE id = ?')
    .bind(id)
    .first<{ match_id: number }>();
  await db.prepare('DELETE FROM match_photos WHERE id = ?').bind(id).run();
  if (row) {
    await db
      .prepare('UPDATE matches SET updated_at = unixepoch() WHERE id = ?')
      .bind(row.match_id)
      .run();
  }
  return json({ success: true });
};
