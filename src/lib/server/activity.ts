// src/lib/server/activity.ts
import type { D1Database } from '@cloudflare/workers-types';

// export async function logActivity(db: D1Database, type: string, message: string, metadata: any = {}) {
//   try {
//     await db.prepare(
//       'INSERT INTO activity_feed (type, message, metadata) VALUES (?, ?, ?)'
//     ).bind(type, message, JSON.stringify(metadata)).run();
//   } catch (e) {
//     console.error('[activity-log] Failed to write to feed:', e);
//   }
// }

export async function logActivity(db: D1Database, type: string, message: string, metadata: any = {}) {
  try {
    await db.prepare(
      'INSERT INTO activity_feed (type, message, metadata, user_name, avatar_url) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      type, 
      message, 
      JSON.stringify(metadata), 
      metadata.user || 'Anonyme', 
      metadata.avatar || '🔥'
    ).run();
  } catch (e) {
    console.error('[activity-log] D1 error:', e);
  }
}