import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform?.env?.DB;
  if (!db) {
    return {
      match: {
        id: 0,
        slug: params.slug,
        homeTeam: '…',
        awayTeam: '…',
        matchDate: '',
        status: 'upcoming',
        homeScore: null,
        awayScore: null,
        coverImageUrl: null,
        description: '',
      },
      _serverFallback: true,
    };
  }

  const match = await db
    .prepare(
      `SELECT id, slug, home_team as homeTeam, away_team as awayTeam, match_date as matchDate,
              match_time as matchTime, location, description, home_score as homeScore, away_score as awayScore,
              status, cover_image_url as coverImageUrl, created_at as createdAt, updated_at as updatedAt
       FROM matches WHERE slug = ? AND published = 1`
    )
    .bind(params.slug)
    .first();

  if (!match) throw error(404, 'Match not found');

  return { match };
};
