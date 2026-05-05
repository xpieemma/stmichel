import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });
  const data = await request.json();
  if (typeof data?.key !== 'string' || data.key.trim() === '') {
    return json({ error: 'data.key is required' }, { status: 400 });
  }
  await db.prepare(`UPDATE city_info SET content_fr=?, content_ht=?, content_es=?, content_en=?, updated_at=unixepoch() WHERE key=?`).bind(data.contentFr, data.contentHt, data.contentEs, data.contentEn, data.key).run();
  return json({ success: true });
};
