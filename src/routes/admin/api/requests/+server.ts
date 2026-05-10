import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET — List all requests (for the approval dashboard)
export const GET: RequestHandler = async ({ platform, locals }) => {
  try {
    const db = platform?.env?.DB;
    if (!db) return json({ error: 'DB unavailable. Are you running Wrangler?' }, { status: 500 });

    // Note: Use standard backticks (`) here, not sql`...`
    const rows = await db.prepare(
      `SELECT id, username, email, status, requested_at, reviewed_by, reviewed_at, reject_reason
       FROM admin_requests
       ORDER BY
         CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         requested_at DESC`
    ).all();

    return json({ requests: rows.results || [], admin: locals.admin });

  } catch (err) {
    console.error("🔥 SQL CRASH:", err);
    return json({ error: `SQL Error: ${String(err)}` }, { status: 500 });
  }
};

// POST — Approve or Reject a request
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  try {
    // ⚡️ Fix for TypeScript: We explicitly tell TS what the JSON looks like
    const body = (await request.json()) as { id: number; action: string; reason?: string };
    const { id, action, reason } = body;

    if (!id || (action !== 'approve' && action !== 'reject')) {
      return json({ error: 'id and action (approve|reject) required' }, { status: 400 });
    }

    // Fetch the request
    const req = await db.prepare(
      `SELECT * FROM admin_requests WHERE id = ?`
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
      `SELECT username FROM admins WHERE username = ?`
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

  } catch (err) {
    console.error("🔥 POST CRASH:", err);
    return json({ error: `Action Error: ${String(err)}` }, { status: 500 });
  }
};