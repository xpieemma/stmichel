import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type HistoryRecord = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform?.env?.DB;
  if (!db) {
    return {
      history: { id: 0, slug: params.slug, title: 'Loading…', description: '', imageUrl: null, createdAt: new Date().toISOString() },
      meta: { title: 'Istwa Vil la', description: '', image: null },
      _serverFallback: true,
    };
  }

  const history = await db
    .prepare(
      `SELECT id, slug, title, description, image_url as imageUrl, created_at as createdAt
       FROM events WHERE slug = ? AND type = 'history' AND published = 1`
    )
    .bind(params.slug)
    .first<HistoryRecord>();

  if (!history) throw error(404, 'History not found');

  const desc = history.description || '';
  return {
    history,
    meta: {
      title: history.title,
      description: desc.substring(0, 200),
      image: history.imageUrl,
    },
  };
};
