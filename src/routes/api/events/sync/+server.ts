// import { json } from '@sveltejs/kit';
// import type { RequestHandler } from './$types';

// export const GET: RequestHandler = async ({ platform, url }) => {
//   const db = platform?.env?.DB; if (!db) return json({ error: 'DB unavailable' }, { status: 500 });
//   const since = url.searchParams.get('since') || '0';
//   const result = await db.prepare(`SELECT id, slug, title, description, date, time, location, lat, lng, image_url as imageUrl, blur_hash as blurHash, type, created_at as createdAt, updated_at as updatedAt, published FROM events WHERE updated_at > ? AND published = 1`).bind(since).all();
//   return json(result.results);
// };


import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
  const db = platform?.env?.DB; 
  if (!db) return json({ error: 'DB unavailable' }, { status: 503 });

  // ✅ FIX 1: Convert the URL string to a Number so D1 doesn't panic
  const sinceParam = url.searchParams.get('since') || '0';
  const sinceTimestamp = parseInt(sinceParam, 10);

  try {
    const result = await db.prepare(`
      SELECT 
        id, 
        slug, 
        title, 
        description, 
        date, 
        time, 
        location, 
        lat, 
        lng, 
        image_url as imageUrl, 
        blur_hash as blurHash, 
        type, 
        created_at as createdAt, 
        updated_at as updatedAt, 
        published 
      FROM events 
      WHERE updated_at > ? AND published = 1
    `).bind(sinceTimestamp).all(); // Pass the Number, not the String

    return json(result.results);

  } catch (error) {
    // ✅ FIX 2: Catch the error and print it to your terminal!
    console.error('🚨 [API /events/sync] D1 Query Failed:', error);
    
    // Send the actual error message back to the browser so you can see it
    return json({ 
      error: 'Database query failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
};