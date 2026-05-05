import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Incremental sync endpoint for albums + their photos. Mirrors the
// shape of /api/events/sync and /api/matches/sync. The client-side
// sync engine fetches this with `?since=<unix>`; we return all
// albums updated since that timestamp, each with its photo list
// embedded so the client only needs one round trip per album.

export const GET: RequestHandler = async ({ platform, url }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const since = url.searchParams.get('since') || '0';

  const albums = await db
    .prepare(
      `SELECT id, slug, title, description,
              cover_image_url as coverImageUrl,
              created_at as createdAt, updated_at as updatedAt, published
       FROM albums
       WHERE updated_at > ? AND published = 1`
    )
    .bind(since)
    .all();

  // Pull photos for the returned albums in one batched SELECT to
  // avoid the N+1 fan-out on D1.
  const ids = (albums.results || []).map((a: any) => a.id);
  const photosByAlbum: Map<number, any[]> = new Map<number, any[]>();
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    const photos = await db
      .prepare(
        `SELECT id, album_id as albumId,
                image_url as imageUrl, blur_hash as blurHash,
                caption, sort_order as sortOrder, created_at as createdAt
         FROM album_photos
         WHERE album_id IN (${placeholders})
         ORDER BY sort_order`
      )
      .bind(...ids)
      .all();
    for (const p of photos.results || []) {
      const arr = photosByAlbum.get((p as any).albumId) || [];
      arr.push(p);
      photosByAlbum.set((p as any).albumId, arr);
    }
  }

  const out = (albums.results || []).map((a: any) => ({
    ...a,
    photos: photosByAlbum.get(a.id) || [],
  }));
  return json(out);
};
