import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Admin CRUD for album photos. Parallels /api/admin/match-photos.

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  if (!cookies.get('admin_session')) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  const data = await request.json();
  if (!data.albumId || !data.imageUrl) {
    return json({ error: 'albumId and imageUrl required' }, { status: 400 });
  }

  await db
    .prepare(
      `INSERT INTO album_photos (album_id, image_url, blur_hash, caption, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, unixepoch())`
    )
    .bind(
      data.albumId,
      data.imageUrl,
      data.blurHash ?? null,
      data.caption ?? null,
      data.sortOrder ?? 0
    )
    .run();

  // Touch the parent album so the albums sync picks up the change.
  await db
    .prepare('UPDATE albums SET updated_at = unixepoch() WHERE id = ?')
    .bind(data.albumId)
    .run();

  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ url, platform, cookies }) => {
  if (!cookies.get('admin_session')) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  const id = url.searchParams.get('id');
  if (!db || !id) return json({ error: 'Invalid request' }, { status: 400 });

  const row = await db
    .prepare('SELECT album_id FROM album_photos WHERE id = ?')
    .bind(id)
    .first<{ album_id: number }>();
  await db.prepare('DELETE FROM album_photos WHERE id = ?').bind(id).run();
  if (row) {
    await db
      .prepare('UPDATE albums SET updated_at = unixepoch() WHERE id = ?')
      .bind(row.album_id)
      .run();
  }
  return json({ success: true });
};
