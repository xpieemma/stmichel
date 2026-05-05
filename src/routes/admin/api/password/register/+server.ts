

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ITERATIONS = 100_000;

// 1. Define a strict interface for the expected request body
interface AdminRequestPayload {
  username?: string;
  password?: string;
  password_hash?: string;
  client_salt?: string;
}

// 2. Define DB response types for strong typing
interface AdminCheckResult {
  username: string;
}

interface PendingCheckResult {
  id: number;
  status: 'pending' | 'rejected' | 'approved';
}

// Helper function (Safe in global scope as it is stateless)
async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password) as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS },
    key,
    256
  );
  // Using spread operator on Uint8Array is safe for 32 bytes (256 bits)
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  // 1. Verify admin_requests table exists
  try {
    await db.prepare('SELECT 1 FROM admin_requests LIMIT 0').run();
  } catch {
    return json({
      error: 'Sistèm enskripsyon pa disponib. Kouri migration avan.',
      hint: 'Run: npx wrangler d1 execute stmichel-db --local --file=migrations/100_admin_system.sql'
    }, { status: 503 });
  }

  // 2. Parse request body with our strong type
  const body = (await request.json()) as AdminRequestPayload;
  
  if (!body.username) {
    return json({ error: 'Non itilizatè obligatwa' }, { status: 400 });
  }

  // 3. Handle Password Hashing vs Client Pre-Hashed
  // Local variables bound ONLY to this specific request's scope
  let hash: string;
  let salt: string;
  let finalIterations = ITERATIONS;

  if (body.password_hash && typeof body.password_hash === 'string' && body.password_hash.length === 44) {
    // Client provided pre-hashed password
    hash = body.password_hash;
    salt = body.client_salt || 'client-unknown';
    finalIterations = 0;
  } else {
    // Plaintext password provided
    if (!body.password || body.password.length < 10) {
      return json({ error: 'Modpas dwe gen omwen 10 karaktè' }, { status: 400 });
    }
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    salt = btoa(String.fromCharCode(...saltBytes));
    hash = await hashPassword(body.password, saltBytes);
  }

  // 4. Determine if input is email
  const isEmail = body.username.includes('@');
  const email = isEmail ? body.username : `${body.username}@pending.local`;
  const displayName = isEmail ? body.username.split('@')[0] : body.username;

  // 5. Check if already registered as full admin
  let adminCheck: AdminCheckResult | null;
  
  if (isEmail) {
    adminCheck = await db.prepare(`
      SELECT a.username FROM admins a
      LEFT JOIN admin_allowlist al ON a.username = al.username
      WHERE a.username = ? OR al.email = ?
    `).bind(email, email).first<AdminCheckResult>();
  } else {
    adminCheck = await db.prepare(
      'SELECT username FROM admins WHERE username = ?'
    ).bind(body.username).first<AdminCheckResult>();
  }

  if (adminCheck) {
    return json({ error: 'Kont sa a deja egziste. Itilize login.' }, { status: 400 });
  }

  // 6. Check if already has a pending request
  const pendingCheck = await db.prepare(
    'SELECT id, status FROM admin_requests WHERE email = ? OR username = ?'
  ).bind(email, displayName).first<PendingCheckResult>();

  if (pendingCheck) {
    if (pendingCheck.status === 'pending') {
      return json({
        error: 'Demann ou deja soumèt. Tann apwobasyon admin.',
        pending: true
      }, { status: 409 });
    }
    if (pendingCheck.status === 'rejected') {
      return json({
        error: 'Demann ou te rejte. Kontakte administratè a.',
        rejected: true
      }, { status: 403 });
    }
  }

  // 7. Insert the new request using the correctly scoped variables
  await db.prepare(
    `INSERT INTO admin_requests (username, email, password_hash, password_salt, password_iterations, status, requested_at)
     VALUES (?, ?, ?, ?, ?, 'pending', unixepoch())`
  ).bind(displayName, email, hash, salt, finalIterations).run();

  return json({
    success: true,
    message: 'Demann ou soumèt! Yon administratè dwe apwouve l anvan ou ka konekte.'
  });
};