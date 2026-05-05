import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { revokeAllSessions } from '$lib/server/admin-session';

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

export const GET: RequestHandler = async ({ platform, locals }) => {
  if (!locals.admin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  const rows = await db
    .prepare(
      `SELECT username, email, note, added_by, status,
              requested_at, reviewed_at, reviewed_by, added_at
       FROM admin_allowlist
       ORDER BY
         CASE status WHEN 'pending' THEN 0 ELSE 1 END,
         COALESCE(requested_at, added_at) DESC`
    )
    .all();

  return json({ items: rows.results || [], me: locals.admin });
};

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.admin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  let body: { username?: unknown; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { username, action } = body;
  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username)) {
    return json({ error: 'Invalid username' }, { status: 400 });
  }
  if (action !== 'approve' && action !== 'reject') {
    return json({ error: 'action must be approve or reject' }, { status: 400 });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const result = await db
    .prepare(
      `UPDATE admin_allowlist
       SET status = ?, reviewed_at = unixepoch(), reviewed_by = ?
       WHERE username = ? AND status = 'pending'`
    )
    .bind(newStatus, locals.admin, username)
    .run();

  if (result.meta.changes === 0) {
    return json(
      { error: 'No pending entry found for that username' },
      { status: 404 }
    );
  }

  // On reject, also remove any existing admin row + sessions
  if (action === 'reject') {
    await revokeAllSessions(username, db);
    await db.prepare('DELETE FROM admins WHERE username = ?').bind(username).run();
  }

  return json({ ok: true, status: newStatus });
};

export const DELETE: RequestHandler = async ({ url, platform, locals }) => {
  if (!locals.admin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  const username = url.searchParams.get('username');
  if (!username || !USERNAME_PATTERN.test(username)) {
    return json({ error: 'Invalid username' }, { status: 400 });
  }

  // Prevent self-deletion
  if (username === locals.admin) {
    return json({ error: 'Cannot remove yourself' }, { status: 409 });
  }

  // Must keep at least one other approved/bootstrap admin
  const survivors = await db
    .prepare(
      `SELECT COUNT(*) as count FROM admin_allowlist
       WHERE status IN ('approved', 'bootstrap') AND username != ?`
    )
    .bind(username)
    .first<{ count: number }>();

  if (!survivors || survivors.count < 1) {
    return json({ error: 'Cannot remove the last admin' }, { status: 409 });
  }

  // Revoke sessions, then delete in atomic batch
  await revokeAllSessions(username, db);

  const [allowlistResult] = await db.batch([
    db.prepare('DELETE FROM admin_allowlist WHERE username = ?').bind(username),
    db.prepare('DELETE FROM admins WHERE username = ?').bind(username)
  ]);

  if (allowlistResult.meta.changes === 0) {
    return json({ error: 'User not found' }, { status: 404 });
  }

  return json({ ok: true });
};