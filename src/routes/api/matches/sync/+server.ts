import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Incremental sync endpoint for matches + their photos. Parallels
// /api/albums/sync — batched photo fetch, embedded per row.

export const GET: RequestHandler = async ({ platform, url }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });
  const since = url.searchParams.get('since') || '0';

  const matches = await db
    .prepare(
      `SELECT id, slug, home_team as homeTeam, away_team as awayTeam,
              match_date as matchDate, match_time as matchTime,
              location, description, home_score as homeScore,
              away_score as awayScore, status,
              cover_image_url as coverImageUrl,
              created_at as createdAt, updated_at as updatedAt, published
       FROM matches
       WHERE updated_at > ? AND published = 1`
    )
    .bind(since)
    .all();

  const ids = (matches.results || []).map((m: any) => m.id);
  const photosByMatch = new Map<number, any[]>();
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    const photos = await db
      .prepare(
        `SELECT id, match_id as matchId, image_url as imageUrl,
                blur_hash as blurHash, caption,
                sort_order as sortOrder, created_at as createdAt
         FROM match_photos
         WHERE match_id IN (${placeholders})
         ORDER BY sort_order`
      )
      .bind(...ids)
      .all();
    for (const p of photos.results || []) {
      const arr = photosByMatch.get((p as any).matchId) || [];
      arr.push(p);
      photosByMatch.set((p as any).matchId, arr);
    }
  }

  const out = (matches.results || []).map((m: any) => ({
    ...m,
    photos: photosByMatch.get(m.id) || [],
  }));
  return json(out);
};
