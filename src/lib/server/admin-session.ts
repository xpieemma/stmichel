
import { logActivity } from '$lib/server/activity';
const MAX_SESSION_AGE_SECONDS = 86400; // 24h

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function b64urlEncode(bytes: ArrayBuffer): string {
  const arr = Array.from(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - (str.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Sign a fresh session token. Call from login endpoints AFTER the
 * credential check has succeeded.
 */
export async function signSession(username: string, secret: string): Promise<string> {
  if (!secret) throw new Error('ADMIN_SESSION_SECRET unset');
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${username}.${issuedAt}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${b64urlEncode(sig)}`;
}

/**
 * Verify a session token. Returns the username on success, null on
 * any failure (bad shape, bad signature, expired). Constant-time on
 * the signature comparison.
 */
export async function verifySession(
  token: string | undefined,
  secret: string
): Promise<string | null> {
  if (!token || !secret) return null;
  // Username can contain '.' (e.g. 'john.smith' from an email's local
  // part). Use rsplit-style parsing to find the last two dots: the
  // signature has no dots (base64url), and issuedAt is digits-only,
  // so the rightmost two dots are unambiguous boundaries.
  const lastDot = token.lastIndexOf('.');
  if (lastDot < 1) return null;
  const sigB64 = token.slice(lastDot + 1);
  const beforeSig = token.slice(0, lastDot);
  const secondLastDot = beforeSig.lastIndexOf('.');
  if (secondLastDot < 1) return null;
  const username = beforeSig.slice(0, secondLastDot);
  const issuedAtStr = beforeSig.slice(secondLastDot + 1);
  if (!username || !sigB64 || !issuedAtStr) return null;
  const issuedAt = parseInt(issuedAtStr, 10);
  if (!Number.isFinite(issuedAt)) return null;

  // Server-side TTL — defends against extended lifetime by an attacker
  // who exfiltrates a still-valid cookie.
  const now = Math.floor(Date.now() / 1000);
  if (now - issuedAt > MAX_SESSION_AGE_SECONDS) return null;
  if (issuedAt > now + 60) return null; // clock-skew tolerance

  // Recompute signature and compare in constant time.
  const payload = `${username}.${issuedAtStr}`;
  const key = await hmacKey(secret);
  const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expectedBytes = new Uint8Array(expected);
  let actualBytes: Uint8Array;
  try {
    actualBytes = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  if (!constantTimeEqual(expectedBytes, actualBytes)) return null;

  return username;
}

/**
 * Convenience used by login endpoints: issue + set the cookie. Caller
 * passes the SvelteKit cookies API.
 */
export async function issueSessionCookie(
  cookies: { set: (n: string, v: string, o: any) => void },
  username: string,
  secret: string,
  isDev: boolean,
  db?: D1Database | null
) {
  const token = await signSession(username, secret);
  const expiresAt = Math.floor(Date.now() / 1000) + MAX_SESSION_AGE_SECONDS;
  // cookies.set('admin_session', token, {
  //   path: '/',
  //   httpOnly: true,
  //   secure: !isDev,
  //   sameSite: 'strict',
  //   maxAge: MAX_SESSION_AGE_SECONDS,
  // });
  if(db) {
    try {
      await db 
      .prepare('DELETE FROM admin_sessions WHERE username = ?')
        .bind(username)
        .run();

      // Store the new session
      await db
        .prepare(
          'INSERT INTO admin_sessions (token, username, expires_at, created_at) VALUES (?, ?, ?, unixepoch())'
        )
        .bind(token, username, expiresAt)
        .run();
        await logActivity(db, 'admin', `${username} fenk konekte sou panèl la! 🛡️`, { 
        user: username,
        avatar: '🛡️' 
      });
    } catch (e) {

     console.warn('[session] D1 session store failed (non-fatal):', (e as Error).message);
  }
}

   cookies.set('admin_session', token, {
    path: '/',
    httpOnly: true,
    secure: !isDev,
    sameSite: 'strict',
    maxAge: MAX_SESSION_AGE_SECONDS,
  });
}
export async function destroySession(
  cookies: { get: (n: string) => string | undefined; delete: (n: string, o: any) => void },
  db?: D1Database | null
): Promise<void> {
  const token = cookies.get('admin_session');


  let username = 'An administratè';
  if (token) {
    const parts = token.split('.');
    if (parts.length >= 3) {
      // The token format is username.issuedAt.signature
      // We grab everything before the second-to-last dot
      username = token.slice(0, token.lastIndexOf('.', token.lastIndexOf('.') - 1));
    }
  }
  // Always clear the cookie first
  cookies.delete('admin_session', { path: '/' });

  // Remove from D1 if possible
  if (db && token) {
    try {
      await db
        .prepare('DELETE FROM admin_sessions WHERE token = ?')
        .bind(token)
        .run();
        await logActivity(db, 'admin', `${username} dekonekte, l'al pran yon ti repo. 💤`, { 
        user: username,
        avatar: '🌙' 
      });
    } catch {
      // Cookie already cleared — D1 failure is non-fatal
    }
  }
}

export async function revokeAllSessions(
  username: string,
  db: D1Database
): Promise<void> {
  try {
    await db
      .prepare('DELETE FROM admin_sessions WHERE username = ?')
      .bind(username)
      .run();
  } catch (e) {
    console.warn(
      `[session] Failed to revoke sessions for ${username}:`,
      (e as Error).message
    );
  }
}