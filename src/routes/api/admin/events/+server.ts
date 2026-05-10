import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { events } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm'; 

interface EventPayload {
  id?: string | number;
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  lat?: string | null;
  lng?: string | null;
  imageUrl?: string;
  type?: 'event' | 'poi' | 'history';
  published?: number;
  offlineId?: string | number;
}

export const GET: RequestHandler = async ({ platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  try {
    const d1 = drizzle(db);
    const results = await d1.select().from(events).orderBy(desc(events.date)).all();
    return json({ items: results });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return json({ error: 'Failed to fetch events' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });
  
  // Cast safely using 'as' syntax
  const data = (await request.json()) as EventPayload;
  
  if (typeof data?.title !== 'string' || data.title.trim() === '') {
    return json({ error: 'Title is required' }, { status: 400 });
  }
  if (typeof data?.date !== 'string' || data.date.trim() === '') {
    return json({ error: 'Date is required' }, { status: 400 });
  }

  const d1 = drizzle(db);
  const nowUnix = Math.floor(Date.now() / 1000);

  

  try {


if (data.offlineId) {
      const slug = data.title!.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
      
     const insertedRow = await d1.insert(events).values({
  slug,
  title: data.title!,
  description: data.description ?? '', 
  date: data.date!,                    
  time: data.time ?? '',
  location: data.location ?? '',
  lat: data.lat ?? null,
  lng: data.lng ?? null,
  imageUrl: data.imageUrl ?? '',
  type: data.type ?? 'event',
  published: data.published ?? 1,
  createdAt: nowUnix,
  updatedAt: nowUnix
}).returning({ id: events.id });
      
      return json({ 
        success: true, 
        action: 'inserted',
        realId: insertedRow[0].id,      // The official D1 ID
        offlineId: data.offlineId       // Echo back the local SQLite ID
      });
    }
    if (data.id) {
      // ✅ Safely handle the ID whether it is a string or already a number
      const parsedId = typeof data.id === 'string' ? parseInt(data.id, 10) : data.id;

      await d1.update(events)
        .set({
          title: data.title!,
          description: data.description ?? '',
          date: data.date!,
          time: data.time ?? '',
          location: data.location ?? '',
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          imageUrl: data.imageUrl ?? '',
          type: data.type ?? 'event',
          published: data.published ?? 1,
          updatedAt: nowUnix
        })
        .where(eq(events.id, parsedId)) 
        .run();
    } else {
      const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
      
      await d1.insert(events).values({
        slug,
        title: data.title!,
        description: data.description ?? '',
        date: data.date!,
        time: data.time ?? '',
        location: data.location ?? '',
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        imageUrl: data.imageUrl ?? '',
        type: data.type ?? 'event',
        published: data.published ?? 1,
        createdAt: nowUnix,
        updatedAt: nowUnix
      }).run();
    }
    return json({ success: true });
  } catch (err) { // ✅ Removed :any
    console.error("Database operation failed:", err);
    // ✅ Safely extract the error message
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return json({ error: errorMessage }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ url, platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  
  const db = platform?.env?.DB;
  const id = url.searchParams.get('id');
  if (!db || !id) return json({ error: 'Invalid request' }, { status: 400 });

  try {
    const d1 = drizzle(db);
    await d1.delete(events).where(eq(events.id, parseInt(id, 10))).run();
    return json({ success: true });
  } catch (err) { // ✅ Removed :any
    console.error("Failed to delete event:", err);
    return json({ error: 'Failed to delete event' }, { status: 500 });
  }
};