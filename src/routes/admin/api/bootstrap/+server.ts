
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

const ITERATIONS = 310_000;
const USERNAME = 'ultimateadmin';

async function hashPw(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    key,
    256
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

export const POST: RequestHandler = async ({ platform, request }) => {
  // Dev-only guard
  if (!dev) {
    return json({ error: 'Disabled in production' }, { status: 403 });
  }

  // Token guard (defense in depth)
  const token = request.headers.get('x-bootstrap-token');
  if (!env.BOOTSTRAP_TOKEN || token !== env.BOOTSTRAP_TOKEN) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Password from env, not source
  const password = env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!password) {
    return json(
      { error: 'BOOTSTRAP_ADMIN_PASSWORD not configured' },
      { status: 500 }
    );
  }

  const db = platform?.env?.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  // Hash password
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = btoa(String.fromCharCode(...saltBytes));
  const hash = await hashPw(password, saltBytes);

  // Allowlist entry (idempotent)
  await db
    .prepare(
      `INSERT OR IGNORE INTO admin_allowlist
         (username, email, status, added_by, note, added_at)
       VALUES (?, 'ultimate@stmichel.ht', 'bootstrap', 'system', 'Ultimate admin', unixepoch())`
    )
    .bind(USERNAME)
    .run();

  // Upsert admin (atomic, no race)
  await db
    .prepare(
      `INSERT INTO admins
         (username, password_hash, password_salt, password_iterations, created_at)
       VALUES (?, ?, ?, ?, unixepoch())
       ON CONFLICT(username) DO UPDATE SET
         password_hash = excluded.password_hash,
         password_salt = excluded.password_salt,
         password_iterations = excluded.password_iterations`
    )
    .bind(USERNAME, hash, salt, ITERATIONS)
    .run();

  return json({
    success: true,
    username: USERNAME,
    message: 'Admin created/updated. Use the password from your .env file.'
  });
};