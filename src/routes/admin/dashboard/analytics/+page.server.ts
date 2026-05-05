import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

interface Stat {
  count: number;
}

export const load: PageServerLoad = async ({ locals }) => {
  // Admin gate — hooks.server.ts authHandle already verified the
  // signed cookie and set locals.admin. We just guard belt-and-braces.
  if (!locals.admin) throw redirect(302, '/admin/login');

  const db = locals.db;
  if (!db) {
    return {
      stats: { totalEvents: 0, totalStamps: 0, totalFeedback: 0, totalMatches: 0 },
      degraded: true,
    };
  }

  // Run the four counts in parallel — D1 round-trips dominate, not CPU.
  const [eventsRow, stampsRow, feedbackRow, matchesRow] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM events WHERE published = 1').first<Stat>(),
    db.prepare('SELECT COUNT(*) as count FROM stamp_analytics').first<Stat>(),
    db.prepare('SELECT COUNT(*) as count FROM feedback').first<Stat>(),
    db.prepare('SELECT COUNT(*) as count FROM matches WHERE published = 1').first<Stat>(),
  ]);

  return {
    stats: {
      totalEvents: eventsRow?.count ?? 0,
      totalStamps: stampsRow?.count ?? 0,
      totalFeedback: feedbackRow?.count ?? 0,
      totalMatches: matchesRow?.count ?? 0,
    },
    degraded: false,
  };
};
