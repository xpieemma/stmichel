import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Admin upsert endpoint for albums — the target of
// `syncToServer('albums', form)` from the admin dashboard. Previously
// the admin UI called this URL and got a silent 404 because only
// /api/albums existed. Writes now actually land.

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  if (!cookies.get('admin_session')) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  const data = await request.json();
  if (typeof data?.title !== 'string' || data.title.trim() === '') {
    return json({ error: 'data.title is required' }, { status: 400 });
  }

  if (data.id) {
    await db
      .prepare(
        `UPDATE albums SET title=?, description=?, cover_image_url=?, published=?, updated_at=unixepoch() WHERE id=?`
      )
      .bind(data.title, data.description ?? '', data.coverImageUrl ?? null, data.published ?? 1, data.id)
      .run();
  } else {
    const slug = (data.title || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await db
      .prepare(
        `INSERT INTO albums (slug, title, description, cover_image_url, published, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch())`
      )
      .bind(slug, data.title, data.description ?? '', data.coverImageUrl ?? null, data.published ?? 1)
      .run();
  }

  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ url, platform, cookies }) => {
  // if (!cookies.get('admin_session')) return json({ error: 'Unauthorized' }, { status: 401 });
  const session = cookies.get('admin_session');
  if(!session) return json({ error: 'Unauthorized' }, { status: 401 });

  const db = platform?.env?.DB;
  const id = url.searchParams.get('id');
  if (!db || !id) return json({ error: 'Invalid request' }, { status: 400 });

  await db.prepare('DELETE FROM album_photos WHERE album_id = ?').bind(id).run();

  await db.prepare('DELETE FROM albums WHERE id = ?').bind(id).run();
  return json({ success: true });
};
