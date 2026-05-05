import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';


export const GET: RequestHandler = async ({ platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  try {
    // Fetches all events, newest first
    const { results } = await db.prepare('SELECT * FROM events ORDER BY date DESC').all();
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
  const data = await request.json();
  if (typeof data?.title !== 'string' || data.title.trim() === '') {
    return json({ error: 'data.title is required' }, { status: 400 });
  }
  if (typeof data?.date !== 'string' || data.date.trim() === '') {
    return json({ error: 'data.date is required' }, { status: 400 });
  }
  if (data.id) {
    await db.prepare(`UPDATE events SET title=?, description=?, date=?, time=?, location=?, lat=?, lng=?, image_url=?, type=?, published=?, updated_at=unixepoch() WHERE id=?`).bind(data.title, data.description, data.date, data.time, data.location, data.lat, data.lng, data.imageUrl, data.type, data.published ?? 1, data.id).run();
  } else {
    const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await db.prepare(`INSERT INTO events (slug, title, description, date, time, location, lat, lng, image_url, type, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`).bind(slug, data.title, data.description, data.date, data.time, data.location, data.lat, data.lng, data.imageUrl, data.type, data.published ?? 1).run();
  }
  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ url, platform, cookies }) => {
  const session = cookies.get('admin_session');
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  const db = platform?.env?.DB;
  const id = url.searchParams.get('id');
  if (!db || !id) return json({ error: 'Invalid request' }, { status: 400 });
  await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
  return json({ success: true });
};
