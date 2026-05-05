import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
  const db = platform?.env?.DB; if (!db) return json({ error: 'DB unavailable' }, { status: 500 });
  const result = await db.prepare(`SELECT id, key, content_fr as contentFr, content_ht as contentHt, content_es as contentEs, content_en as contentEn, image_url as imageUrl, updated_at as updatedAt FROM city_info`).all();
  return json(result.results);
};
