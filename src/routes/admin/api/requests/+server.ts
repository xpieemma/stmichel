// import { json } from '@sveltejs/kit';
// import type { RequestHandler } from './$types';

// // Public endpoint that lets someone request admin access. Creates a
// // 'pending' row in admin_allowlist. A real admin must accept it via
// // the dashboard before the requester can register a passkey/password.
// //
// // Rate limit: one pending request per email at a time. Subsequent
// // POSTs are idempotent — they don't multiply rows. A rejected email
// // stays rejected (UI shows that to the requester so they don't
// // keep trying); only an admin can re-approve.

// const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// const MAX_NOTE = 500;

// export const POST: RequestHandler = async ({ request, platform }) => {
//   const db = platform?.env?.DB;
//   if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

//   let body: any;
//   try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }

//   const { email, displayName, note } = body || {};
//   if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
//     return json({ error: 'Valid email required' }, { status: 400 });
//   }
//   if (typeof displayName !== 'string' || displayName.trim().length < 2) {
//     return json({ error: 'Display name required' }, { status: 400 });
//   }
//   const safeNote = typeof note === 'string' ? note.slice(0, MAX_NOTE) : '';
//   // Username derived from email local-part. We may need to
//   // disambiguate: alice@gmail.com and alice@protonmail.com would both
//   // produce 'alice', and the second one would crash on the username
//   // PRIMARY KEY constraint. Strategy: try the bare local-part first;
//   // if a row with that username exists for a DIFFERENT email, append
//   // a short hash of the full email to make it unique.
//   const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
//   let username = baseUsername;
//   const collision = await db
//     .prepare('SELECT email FROM admin_allowlist WHERE username = ?')
//     .bind(baseUsername)
//     .first<{ email: string | null }>();
//   if (collision && collision.email !== email) {
//     // 4-char hex hash of the full email — collision-resistant enough
//     // for festival-scale admin lists.
//     const enc = new TextEncoder();
//     const digest = await crypto.subtle.digest('SHA-256', enc.encode(email));
//     const hex = Array.from(new Uint8Array(digest, 0, 2))
//       .map((b) => b.toString(16).padStart(2, '0'))
//       .join('');
//     username = `${baseUsername}-${hex}`;
//   }

//   // Check existing state
//   const existing = await db
//     .prepare('SELECT username, email, status FROM admin_allowlist WHERE email = ? OR username = ?')
//     .bind(email, username)
//     .first<{ username: string; email: string; status: string }>();

//   if (existing) {
//     if (existing.status === 'rejected') {
//       // Don't let a rejected user spam the queue. They have to talk to
//       // an admin out-of-band.
//       return json({ error: 'Demann ou an te refize. Kontakte yon administratè.' }, { status: 403 });
//     }
//     if (existing.status === 'approved' || existing.status === 'bootstrap') {
//       return json({ ok: true, status: existing.status, message: 'You are already approved. You can register at /admin/login.' });
//     }
//     // pending — idempotent
//     return json({ ok: true, status: 'pending', message: 'Demann ou an deja anrejistre. Tann yon administratè.' });
//   }

//   await db
//     .prepare(
//       `INSERT INTO admin_allowlist (username, email, note, added_by, status, requested_at)
//        VALUES (?, ?, ?, ?, 'pending', unixepoch())`
//     )
//     .bind(username, email, displayName + (safeNote ? ' | ' + safeNote : ''), 'self-request')
//     .run();

//   return json({ ok: true, status: 'pending', message: 'Demann ou an voye. Yon administratè ap wè li.' });
// };



import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { issueSessionCookie } from '$lib/server/admin-session';
import { env as privateEnv } from '$env/dynamic/private';

// GET — List all requests (for the approval dashboard)
export const GET: RequestHandler = async ({ platform, locals }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const rows = await db.prepare(
    `SELECT id, username, email, status, requested_at, reviewed_by, reviewed_at, reject_reason
     FROM admin_requests
     ORDER BY
       CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
       requested_at DESC`
  ).all();

  return json({ requests: rows.results || [], admin: locals.admin });
};

// POST — Approve or Reject a request
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const { id, action, reason } = await request.json();
  if (!id || (action !== 'approve' && action !== 'reject')) {
    return json({ error: 'id and action (approve|reject) required' }, { status: 400 });
  }

  // Fetch the request
  const req = await db.prepare(
    'SELECT * FROM admin_requests WHERE id = ?'
  ).bind(id).first<{
    id: number; username: string; email: string; status: string;
    password_hash: string; password_salt: string; password_iterations: number;
  }>();

  if (!req) return json({ error: 'Request not found' }, { status: 404 });
  if (req.status !== 'pending') {
    return json({ error: `Already ${req.status}` }, { status: 400 });
  }

  if (action === 'reject') {
    await db.prepare(
      `UPDATE admin_requests
       SET status = 'rejected', reviewed_by = ?, reviewed_at = unixepoch(), reject_reason = ?
       WHERE id = ?`
    ).bind(locals.admin || 'unknown', reason || null, id).run();
    return json({ ok: true, status: 'rejected' });
  }

  // ── APPROVE: move credentials into admins + allowlist ──
  // 1. Add to allowlist
  await db.prepare(
    `INSERT OR IGNORE INTO admin_allowlist (username, email, status, added_by, added_at)
     VALUES (?, ?, 'approved', ?, unixepoch())`
  ).bind(req.username, req.email, locals.admin || 'unknown').run();

  // 2. Create admin account with the password they already set
  const existingAdmin = await db.prepare(
    'SELECT username FROM admins WHERE username = ?'
  ).bind(req.username).first();

  if (!existingAdmin) {
    await db.prepare(
      `INSERT INTO admins (username, credential_id, public_key, counter,
                           password_hash, password_salt, password_iterations, created_at)
       VALUES (?, NULL, NULL, 0, ?, ?, ?, unixepoch())`
    ).bind(req.username, req.password_hash, req.password_salt, req.password_iterations).run();
  }

  // 3. Mark request as approved
  await db.prepare(
    `UPDATE admin_requests
     SET status = 'approved', reviewed_by = ?, reviewed_at = unixepoch()
     WHERE id = ?`
  ).bind(locals.admin || 'unknown', id).run();

  return json({ ok: true, status: 'approved', username: req.username });
};