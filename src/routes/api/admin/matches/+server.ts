import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });
  const data = await request.json();
  if (typeof data?.homeTeam !== 'string' || data.homeTeam.trim() === '') {
    return json({ error: 'data.homeTeam is required' }, { status: 400 });
  }
  if (typeof data?.awayTeam !== 'string' || data.awayTeam.trim() === '') {
    return json({ error: 'data.awayTeam is required' }, { status: 400 });
  }
  if (typeof data?.matchDate !== 'string' || data.matchDate.trim() === '') {
    return json({ error: 'data.matchDate is required' }, { status: 400 });
  }
  if (data.id) {
    await db.prepare(`UPDATE matches SET home_team=?, away_team=?, match_date=?, match_time=?, location=?, description=?, home_score=?, away_score=?, status=?, cover_image_url=?, published=?, updated_at=unixepoch() WHERE id=?`).bind(data.homeTeam, data.awayTeam, data.matchDate, data.matchTime, data.location, data.description, data.homeScore, data.awayScore, data.status, data.coverImageUrl, data.published ?? 1, data.id).run();
  } else {
  //   const slug = `${data.homeTeam}-vs-${data.awayTeam}-${data.matchDate}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  //   await db.prepare(`INSERT INTO matches (slug, home_team, away_team, match_date, match_time, location, description, home_score, away_score, status, cover_image_url, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`).bind(slug, data.homeTeam, data.awayTeam, data.matchDate, data.matchTime, data.location, data.description, data.homeScore, data.awayScore, data.status, data.coverImageUrl, data.published ?? 1).run();
  // }
  // 1. Create the clean base slug
    const baseSlug = `${data.homeTeam}-vs-${data.awayTeam}-${data.matchDate}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
      
    // 2. Generate a random 4-character string (e.g., 'x7q2')
    const uniqueId = Math.random().toString(36).substring(2, 6);
    
    // 3. Combine them! Now it's impossible to have a duplicate.
    const slug = `${baseSlug}-${uniqueId}`;

    await db.prepare(`INSERT INTO matches (slug, home_team, away_team, match_date, match_time, location, description, home_score, away_score, status, cover_image_url, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`)
      .bind(slug, data.homeTeam, data.awayTeam, data.matchDate, data.matchTime, data.location, data.description, data.homeScore, data.awayScore, data.status, data.coverImageUrl, data.published ?? 1)
      .run();
  }
  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ url, platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  const id = url.searchParams.get('id');
  if (!db || !id) return json({ error: 'Invalid request' }, { status: 400 });
  await db.prepare('DELETE FROM match_photos WHERE match_id = ?').bind(id).run();
  await db.prepare('DELETE FROM matches WHERE id = ?').bind(id).run();
  return json({ success: true });
};
