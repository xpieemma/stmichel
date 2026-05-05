import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform?.env?.DB;
  
  if (!db) {
    return { feedItems: [] };
  }

  try {
    // We grab the latest 10 items. 
    // We rename columns to match what your LivePulse component expects (msg, user_name, avatar)
    const { results } = await db.prepare(`
      SELECT 
        message as msg, 
        user_name, 
        avatar_url as avatar, 
        created_at 
      FROM activity_feed 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    return {
      feedItems: results ?? []
    };
  } catch (e) {
    console.error('Failed to fetch activity feed:', e);
    return { feedItems: [] };
  }
};