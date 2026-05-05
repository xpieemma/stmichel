import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { issueSessionCookie } from '$lib/server/admin-session';
import { env as privateEnv } from '$env/dynamic/private';

// Demo login — issues a session cookie for the special 'demo' user.
// The demo user can VIEW every admin page but every mutating endpoint
// rejects them (gated in apiAdminAuthHandle by username === 'demo').
//
// In production, demo login is disabled unless ADMIN_DEMO_ENABLED=1.
// This protects production deployments from accidentally exposing
// preview access.

export const POST: RequestHandler = async ({ cookies, platform }) => {
  const enabled = dev || privateEnv.ADMIN_DEMO_ENABLED === '1';
  if (!enabled) {
    return json({ error: 'Demo login disabled' }, { status: 403 });
  }

  const db = platform?.env?.DB;
  if (db) {
    // Ensure the demo user exists in the admins table so the
    // hooks.server.ts cross-check passes. Idempotent.
    await db
      .prepare(
        `INSERT OR IGNORE INTO admins (username, email, credential_id, public_key, counter, created_at)
         VALUES ('demo', 'demo@festival-lakay.local', NULL, NULL, 0, unixepoch())`
      )
      .run();
    await db
      .prepare(
        `INSERT OR IGNORE INTO admin_allowlist (username, email, note, added_by, status)
         VALUES ('demo', 'demo@festival-lakay.local', 'Read-only demo account', 'system', 'approved')`
      )
      .run();
  }

  await issueSessionCookie(cookies, 'demo', privateEnv.ADMIN_SESSION_SECRET || '', dev);
  return json({ ok: true, demo: true });
};
