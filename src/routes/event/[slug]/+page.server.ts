import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';


type EventRecord = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  imageUrl: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
  published: number;
};

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform?.env?.DB;
  if (!db) {
    return {
      event: { id: 0, slug: params.slug, title: 'Loading…', description: '', date: new Date().toISOString(), imageUrl: null },
      meta: { title: 'ST MICHEL', description: '', image: '/og-default.png' },
      _serverFallback: true,
    };
  }

  const event = await db
    .prepare(
      `SELECT id, slug, title, description, date, time, location, lat, lng, image_url as imageUrl,
              type, created_at as createdAt, updated_at as updatedAt, published
       FROM events WHERE slug = ? AND type = 'event' AND published = 1`
    )
    .bind(params.slug)
    .first<EventRecord>();

  if (!event) throw error(404, 'Event not found');

  return {
    event,
    meta: {
      title: event.title,
      description: event.description,
      image: event.imageUrl || '/og-default.png',
    },
  };
};
