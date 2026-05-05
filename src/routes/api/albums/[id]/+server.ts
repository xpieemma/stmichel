import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });
  const album = await db.prepare(`SELECT id, slug, title, description, cover_image_url as coverImageUrl, created_at as createdAt, updated_at as updatedAt, published FROM albums WHERE slug = ? AND published = 1`).bind(params.id).first();
  if (!album) return json({ error: 'Not found' }, { status: 404 });
  const photos = await db.prepare(`SELECT id, image_url as imageUrl, caption, sort_order as sortOrder FROM album_photos WHERE album_id = ? ORDER BY sort_order`).bind(album.id).all();
  return json({ ...album, photos: photos.results });
};

export const PUT: RequestHandler = async ({ params, request, platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });
  const data = await request.json();
  await db.prepare(`UPDATE albums SET title=?, description=?, cover_image_url=?, published=?, updated_at=unixepoch() WHERE id=?`).bind(data.title, data.description, data.coverImageUrl, data.published, params.id).run();
  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });
  await db.prepare('DELETE FROM album_photos WHERE album_id = ?').bind(params.id).run();
  await db.prepare('DELETE FROM albums WHERE id = ?').bind(params.id).run();
  return json({ success: true });
};
