import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });
  const result = await db.prepare(`SELECT id, slug, title, description, cover_image_url as coverImageUrl, created_at as createdAt, updated_at as updatedAt, published FROM albums WHERE published = 1 ORDER BY created_at DESC`).all();
  return json(result.results);
};

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });
  const data = await request.json();
  const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  await db.prepare(`INSERT INTO albums (slug, title, description, cover_image_url, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch())`).bind(slug, data.title, data.description, data.coverImageUrl, data.published ?? 1).run();
  return json({ success: true });
};
