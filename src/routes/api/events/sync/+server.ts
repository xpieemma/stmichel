import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
  const db = platform?.env?.DB; if (!db) return json({ error: 'DB unavailable' }, { status: 500 });
  const since = url.searchParams.get('since') || '0';
  const result = await db.prepare(`SELECT id, slug, title, description, date, time, location, lat, lng, image_url as imageUrl, blur_hash as blurHash, type, created_at as createdAt, updated_at as updatedAt, published FROM events WHERE updated_at > ? AND published = 1`).bind(since).all();
  return json(result.results);
};
