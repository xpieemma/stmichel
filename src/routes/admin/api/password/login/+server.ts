
// };


import { json } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { issueSessionCookie } from '$lib/server/admin-session';
import { env as privateEnv } from '$env/dynamic/private';

async function hashPassword(password: string, saltBytes: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations }, key, 256
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  const { username: identifier, password } = await request.json();
  if (!identifier || !password) {
    return json({ error: 'Non itilizatè ak modpas obligatwa' }, { status: 400 });
  }

  const isEmail = typeof identifier === 'string' && identifier.includes('@');

  // ── Resolve user: email → allowlist → admins, or direct username ──
  let admin: {
    username: string;
    password: string | null;
    password_hash: string | null;
    password_salt: string | null;
    password_iterations: number | null;
  } | null = null;

  if (isEmail) {
    admin = await db.prepare(
      `SELECT a.username, a.password, a.password_hash, a.password_salt, a.password_iterations
       FROM admins a
       JOIN admin_allowlist al ON a.username = al.username
       WHERE al.email = ? AND al.status IN ('approved', 'bootstrap')`
    ).bind(identifier).first();
  } else {
    // Direct username — still check allowlist status
    admin = await db.prepare(
      `SELECT a.username, a.password, a.password_hash, a.password_salt, a.password_iterations
       FROM admins a
       LEFT JOIN admin_allowlist al ON a.username = al.username
       WHERE a.username = ? AND (al.status IN ('approved', 'bootstrap') OR al.status IS NULL)`
    ).bind(identifier).first();
  }

  // ── Check pending requests for better UX ──
  if (!admin) {
    const pending = await db.prepare(
      'SELECT status FROM admin_requests WHERE email = ? OR username = ?'
    ).bind(identifier, identifier).first<{ status: string }>();

    if (pending?.status === 'pending') {
      return json({
        error: 'Kont ou ap tann apwobasyon. Yon admin dwe apwouve l anvan.',
        pending: true
      }, { status: 403 });
    }
    if (pending?.status === 'rejected') {
      return json({
        error: 'Demann aksè ou te rejte. Kontakte administratè a.',
        rejected: true
      }, { status: 403 });
    }
    return json({ error: 'Non itilizatè oswa modpas pa kòrèk' }, { status: 401 });
  }

  // ── Verify password ──
  let passwordValid = false;

  if (admin.password_hash && admin.password_salt) {
    // NEW system: PBKDF2 with salt
    const saltBytes = Uint8Array.from(atob(admin.password_salt), c => c.charCodeAt(0));
    const iterations = admin.password_iterations || 100_000;
    const candidateHash = await hashPassword(password, saltBytes, iterations);
    passwordValid = constantTimeEqual(candidateHash, admin.password_hash);
  } else if (admin.password) {
    // OLD system: direct password field (legacy — plain text or simple hash)
    // ⚠️ If your old system stored plain text:
    passwordValid = admin.password === password;
    
    // If old system used a hash, adjust accordingly.
    // After successful login, UPGRADE to new system:
    if (passwordValid) {
      const saltBytes = crypto.getRandomValues(new Uint8Array(16));
      const salt = btoa(String.fromCharCode(...saltBytes));
      const hash = await hashPassword(password, saltBytes, 100_000);
      await db.prepare(
        'UPDATE admins SET password_hash=?, password_salt=?, password_iterations=? WHERE username=?'
      ).bind(hash, salt, 100_000, admin.username).run();
      console.log(`[login] Upgraded ${admin.username} to PBKDF2`);
    }
  } else {
    // No password at all — passkey-only admin
    return json({ error: 'Kont sa a pa gen modpas. Itilize passkey.' }, { status: 401 });
  }

  if (!passwordValid) {
    return json({ error: 'Non itilizatè oswa modpas pa kòrèk' }, { status: 401 });
  }

  // ── Issue session ──
  await issueSessionCookie(
    cookies, admin.username,
    privateEnv.ADMIN_SESSION_SECRET || '', dev,
    db
  );

  return json({ verified: true, username: admin.username });
};