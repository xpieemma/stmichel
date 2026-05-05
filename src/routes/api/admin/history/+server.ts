// import { json, error } from '@sveltejs/kit';
// import type { RequestHandler } from './$types';

// type HistoryRow = {
//   id: number;
//   title: string;
//   content: string | null;
//   year: number | null;
//   image_url: string | null;
//   published: number;
//   sort_order: number;
//   created_at?: number;
//   updated_at?: number;
// };

// export const GET: RequestHandler = async ({ platform, locals, url }) => {
//   if (!locals.admin) error(401, 'Unauthorized');

//   const db = platform?.env?.DB;
//   if (!db) error(500, 'DB unavailable');

//   const idParam = url.searchParams.get('id');

//   // Fetch single item
//   if (idParam) {
//     const id = parseInt(idParam, 10);
//     if (!Number.isInteger(id) || id <= 0) error(400, 'Invalid id');

//     const item = await db
//       .prepare(
//         `SELECT id, title, content, year, image_url, published, sort_order
//          FROM history WHERE id = ?`
//       )
//       .bind(id)
//       .first<HistoryRow>();

//     if (!item) error(404, 'Not found');
//     return json({ item });
//   }

//   // Fetch all
//   const { results } = await db
//     .prepare(
//       `SELECT id, title, content, year, image_url, published, sort_order
//        FROM history
//        ORDER BY sort_order ASC, year ASC, id ASC`
//     )
//     .all<HistoryRow>();

//   return json({ items: results ?? [] });
// };

// export const POST: RequestHandler = async ({ platform, locals, request }) => {
//   if (!locals.admin) error(401, 'Unauthorized');

//   const db = platform?.env?.DB;
//   if (!db) error(500, 'DB unavailable');

//   const body = (await request.json()) as Partial<HistoryRow>;
//   if (!body.title?.trim()) error(400, 'Title required');

//   const result = await db
//     .prepare(
//       `INSERT INTO history
//          (title, content, year, image_url, published, sort_order, created_at, updated_at)
//        VALUES (?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`
//     )
//     .bind(
//       body.title.trim(),
//       body.content ?? null,
//       body.year ?? null,
//       body.image_url ?? null,
//       body.published ? 1 : 0,
//       body.sort_order ?? 0
//     )
//     .run();

//   return json({ success: true, id: result.meta.last_row_id });
// };

// export const PUT: RequestHandler = async ({ platform, locals, request }) => {
//   if (!locals.admin) error(401, 'Unauthorized');

//   const db = platform?.env?.DB;
//   if (!db) error(500, 'DB unavailable');

//   const body = (await request.json()) as Partial<HistoryRow>;
//   if (!body.id || !Number.isInteger(body.id)) error(400, 'Invalid id');
//   if (!body.title?.trim()) error(400, 'Title required');

//   const result = await db
//     .prepare(
//       `UPDATE history
//        SET title = ?, content = ?, year = ?, image_url = ?,
//            published = ?, sort_order = ?, updated_at = unixepoch()
//        WHERE id = ?`
//     )
//     .bind(
//       body.title.trim(),
//       body.content ?? null,
//       body.year ?? null,
//       body.image_url ?? null,
//       body.published ? 1 : 0,
//       body.sort_order ?? 0,
//       body.id
//     )
//     .run();

//   if (result.meta.changes === 0) error(404, 'Not found');
//   return json({ success: true });
// };

// export const DELETE: RequestHandler = async ({ platform, locals, url }) => {
//   if (!locals.admin) error(401, 'Unauthorized');

//   const db = platform?.env?.DB;
//   if (!db) error(500, 'DB unavailable');

//   const id = parseInt(url.searchParams.get('id') ?? '', 10);
//   if (!Number.isInteger(id) || id <= 0) error(400, 'Invalid id');

//   const result = await db
//     .prepare('DELETE FROM history WHERE id = ?')
//     .bind(id)
//     .run();

//   if (result.meta.changes === 0) error(404, 'Not found');
//   return json({ success: true });
// };


import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type HistoryRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  date: string;
  image_url: string | null;
  published: number;
  created_at: number | null;
  updated_at: number | null;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(
  db: D1Database,
  base: string,
  excludeId = -1
): Promise<string> {
  let candidate = base;
  for (let i = 1; i < 100; i++) {
    const existing = await db
      .prepare('SELECT id FROM events WHERE slug = ? AND id != ?')
      .bind(candidate, excludeId)
      .first<{ id: number }>();
    if (!existing) return candidate;
    candidate = `${base}-${i + 1}`;
  }
  throw error(500, 'Could not generate unique slug');
}

export const GET: RequestHandler = async ({ platform, locals, url }) => {
  if (!locals.admin) error(401, 'Unauthorized');
  const db = platform?.env?.DB;
  if (!db) error(500, 'DB unavailable');

  const idParam = url.searchParams.get('id');

  // Fetch single item
  if (idParam) {
    const id = parseInt(idParam, 10);
    if (!Number.isInteger(id) || id <= 0) error(400, 'Invalid id');

    const item = await db
      .prepare(
        `SELECT id, slug, title, description, date, image_url, published, created_at, updated_at
         FROM events WHERE id = ? AND type = 'history'`
      )
      .bind(id)
      .first<HistoryRow>();

    if (!item) error(404, 'Not found');
    return json({ item });
  }

  // Fetch all history items
  const { results } = await db
    .prepare(
      `SELECT id, slug, title, description, date, image_url, published, created_at, updated_at
       FROM events WHERE type = 'history'
       ORDER BY date DESC, id DESC`
    )
    .all<HistoryRow>();

  return json({ items: results ?? [] });
};

export const POST: RequestHandler = async ({ platform, locals, request }) => {
  if (!locals.admin) error(401, 'Unauthorized');
  const db = platform?.env?.DB;
  if (!db) error(500, 'DB unavailable');

  const body = (await request.json()) as Partial<HistoryRow>;
  if (!body.title?.trim()) error(400, 'Title required');

  // events.description is NOT NULL — coerce to empty string
  const description = (body.description ?? '').toString();
  // events.date is NOT NULL — fall back to today
  const date = body.date?.trim() || new Date().toISOString().slice(0, 10);

  const baseSlug = body.slug?.trim() || slugify(body.title);
  if (!baseSlug) error(400, 'Could not generate slug from title');
  const slug = await uniqueSlug(db, baseSlug);

  const result = await db
    .prepare(
      `INSERT INTO events
         (slug, title, description, date, image_url, type, published, created_at, updated_at, version)
       VALUES (?, ?, ?, ?, ?, 'history', ?, unixepoch(), unixepoch(), 1)`
    )
    .bind(
      slug,
      body.title.trim(),
      description,
      date,
      body.image_url || null,
      body.published ? 1 : 0
    )
    .run();

  return json({ success: true, id: result.meta.last_row_id, slug });
};

export const PUT: RequestHandler = async ({ platform, locals, request }) => {
  if (!locals.admin) error(401, 'Unauthorized');
  const db = platform?.env?.DB;
  if (!db) error(500, 'DB unavailable');

  const body = (await request.json()) as Partial<HistoryRow>;
  if (!body.id || !Number.isInteger(body.id)) error(400, 'Invalid id');
  if (!body.title?.trim()) error(400, 'Title required');

  const description = (body.description ?? '').toString();
  const date = body.date?.trim() || new Date().toISOString().slice(0, 10);

  // Slug uniqueness, excluding self
  const baseSlug = body.slug?.trim() || slugify(body.title);
  const slug = await uniqueSlug(db, baseSlug, body.id);

  const result = await db
    .prepare(
      `UPDATE events
         SET slug = ?, title = ?, description = ?, date = ?, image_url = ?,
             published = ?, updated_at = unixepoch(),
             version = COALESCE(version, 1) + 1
       WHERE id = ? AND type = 'history'`
    )
    .bind(
      slug,
      body.title.trim(),
      description,
      date,
      body.image_url || null,
      body.published ? 1 : 0,
      body.id
    )
    .run();

  if (result.meta.changes === 0) error(404, 'Not found');
  return json({ success: true, slug });
};

export const DELETE: RequestHandler = async ({ platform, locals, url }) => {
  if (!locals.admin) error(401, 'Unauthorized');
  const db = platform?.env?.DB;
  if (!db) error(500, 'DB unavailable');

  const id = parseInt(url.searchParams.get('id') ?? '', 10);
  if (!Number.isInteger(id) || id <= 0) error(400, 'Invalid id');

  const result = await db
    .prepare(`DELETE FROM events WHERE id = ? AND type = 'history'`)
    .bind(id)
    .run();

  if (result.meta.changes === 0) error(404, 'Not found');
  return json({ success: true });
};