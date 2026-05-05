// // import { redirect } from '@sveltejs/kit';
// // import type { PageServerLoad } from './$types';

// // // Server-side admin gate. The actual cryptographic verification
// // // happens in hooks.server.ts (authHandle), which sets locals.admin
// // // to the verified username. This file just consumes that value —
// // // no direct cookies.get() so the auth model stays in one place.
// // //
// // // Belt-and-braces: if locals.admin somehow isn't set despite the
// // // hook firing (programming error), we fail closed with a redirect.
// // export const load: PageServerLoad = async ({ locals }) => {
// //   if (!locals.admin) throw redirect(302, '/admin/login');
// //   return { adminUsername: locals.admin };
// // };


// import type { PageServerLoad } from './$types';
// import { redirect } from '@sveltejs/kit';

// interface CountResult {
//   c: number;
// }

// export const load: PageServerLoad = async ({ locals, platform }) => {
//   if (!locals.admin) throw redirect(302, '/admin/login');

//   const db = locals.db ?? platform?.env?.DB ?? null;

//   if (!db) {
//     return {
//       admin: locals.admin,
//       stats: {
//         totalEvents: 0,
//         totalMatches: 0,
//         totalStamps: 0,
//         totalFeedback: 0,
//         totalAlbums: 0,
//         totalHistory: 0,
//         pendingRequests: 0,
//         totalPageViews: 0,
//       },
//       recentViews: [],
//       recentFeedback: [],
//       degraded: true,
//     };
//   }

//   // Run all counts in parallel — D1 round-trips dominate, not CPU.
//   // Each query is wrapped to handle missing tables gracefully.
//   async function safeCount(sql: string): Promise<number> {
//     try {
//       const row = await db!.prepare(sql).first<CountResult>();
//       return row?.c ?? 0;
//     } catch {
//       return 0; // Table doesn't exist yet
//     }
//   }

//   async function safeQuery<T>(sql: string): Promise<T[]> {
//     try {
//       const result = await db!.prepare(sql).all();
//       return (result.results || []) as T[];
//     } catch {
//       return [];
//     }
//   }

//   const [
//     totalEvents,
//     totalMatches,
//     totalStamps,
//     totalFeedback,
//     totalAlbums,
//     totalHistory,
//     pendingRequests,
//     totalPageViews,
//     recentViews,
//     recentFeedback
//   ] = await Promise.all([
//     safeCount('SELECT COUNT(*) as c FROM events WHERE published = 1'),
//     safeCount('SELECT COUNT(*) as c FROM matches WHERE published = 1'),
//     safeCount('SELECT COUNT(*) as c FROM stamp_analytics'),
//     safeCount('SELECT COUNT(*) as c FROM feedback'),
//     safeCount('SELECT COUNT(*) as c FROM albums WHERE published = 1'),
//     safeCount('SELECT COUNT(*) as c FROM history WHERE published = 1'),
//     safeCount("SELECT COUNT(*) as c FROM admin_requests WHERE status = 'pending'"),
//     safeCount('SELECT COUNT(*) as c FROM page_views'),
//     safeQuery<{ path: string; hits: number }>(
//       `SELECT path, COUNT(*) as hits FROM page_views
//        WHERE viewed_at > unixepoch() - 86400 * 7
//        GROUP BY path ORDER BY hits DESC LIMIT 10`
//     ),
//     safeQuery<{ name: string; message: string; rating: number; created_at: number }>(
//       `SELECT name, message, rating, created_at FROM feedback
//        ORDER BY created_at DESC LIMIT 5`
//     ),
//   ]);

//   return {
//     admin: locals.admin,
//     stats: {
//       totalEvents,
//       totalMatches,
//       totalStamps,
//       totalFeedback,
//       totalAlbums,
//       totalHistory,
//       pendingRequests,
//       totalPageViews,
//     },
//     recentViews,
//     recentFeedback,
//     degraded: false,
//   };
// };


import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.admin) throw redirect(302, '/admin/login');

  const db = locals.db ?? platform?.env?.DB ?? null;

  if (!db) {
    return {
      admin: locals.admin,
      stats: { totalEvents: 0, totalHistory: 0, totalMatches: 0, totalAlbums: 0,
               totalStamps: 0, totalFeedback: 0, pendingRequests: 0, totalPageViews: 0 },
      recentViews: [], recentFeedback: [], degraded: true
    };
  }

  async function sc(sql: string): Promise<number> {
    try { return (await db!.prepare(sql).first<{ c: number }>())?.c ?? 0; }
    catch { return 0; }
  }
  async function sq<T>(sql: string): Promise<T[]> {
    try { return ((await db!.prepare(sql).all()).results || []) as T[]; }
    catch { return []; }
  }

  const [tE, tH, tM, tA, tS, tF, pR, tP, rv, rf] = await Promise.all([
    sc("SELECT COUNT(*) as c FROM events WHERE type IN ('event','poi') AND published=1"),
    sc("SELECT COUNT(*) as c FROM events WHERE type='history' AND published=1"),
    sc("SELECT COUNT(*) as c FROM matches WHERE published=1"),
    sc("SELECT COUNT(*) as c FROM albums WHERE published=1"),
    sc("SELECT COUNT(*) as c FROM stamps"),
    sc("SELECT COUNT(*) as c FROM feedback"),
    sc("SELECT COUNT(*) as c FROM admin_requests WHERE status='pending'"),
    sc("SELECT COUNT(*) as c FROM page_views"),
    sq<{ path: string; hits: number }>(
      `SELECT path, COUNT(*) as hits FROM page_views
       WHERE viewed_at > unixepoch()-604800
       GROUP BY path ORDER BY hits DESC LIMIT 10`),
    sq<{ event_title: string; comment: string; rating: number; created_at: number }>(
      'SELECT event_title, comment, rating, created_at FROM feedback ORDER BY created_at DESC LIMIT 5'),
  ]);

  return {
    admin: locals.admin,
    stats: { totalEvents: tE, totalHistory: tH, totalMatches: tM, totalAlbums: tA,
             totalStamps: tS, totalFeedback: tF, pendingRequests: pR, totalPageViews: tP },
    recentViews: rv, recentFeedback: rf, degraded: false
  };
};