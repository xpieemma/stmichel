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
        description as msg,
        created_at 
      FROM activity_feed 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();
const formattedFeed = results.map((item: unknown) => {
      // If you are storing user info inside the metadata JSON, you could parse it here:
      // const meta = item.metadata ? JSON.parse(item.metadata) : {};

      return {
        msg: (item as { msg: string }).msg,
        user_name: 'Sistèm', // Fallback since user_name doesn't exist in schema
        avatar: '',          // Fallback since avatar_url doesn't exist in schema
        created_at: (item as { created_at: string }).created_at
      };
    });
    return {
      feedItems: formattedFeed ?? []
    };
  } catch (e) {
    console.error('Failed to fetch activity feed:', e);
    return { feedItems: [] };
  }
};

