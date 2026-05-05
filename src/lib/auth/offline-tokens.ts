/**
 * Offline delegation tokens for air‑gapped admin provisioning.
 *
 * The signing key is the admin's PBKDF2 password hash (derived from the fixed
 * salt).  Because the server stores this hash, it can verify the token later.
 */

import { hashPassword, FIXED_SALT_U8 } from './crypto';

// ---------- tiny base64url helpers ----------
// function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
//   return btoa(String.fromCharCode(...new Uint8Array(buf)))
//     .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
// }

// function b64urlDecode(str: string): Uint8Array {
//   const base64 = str.replace(/-/g, '+').replace(/_/g, '/') +
//     '='.repeat((4 - str.length % 4) % 4);
//   return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
// }


function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - str.length % 4) % 4);
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
 
  return new Uint8Array(bytes);
}

function utf8ToU8(str: string): Uint8Array<ArrayBuffer> {
 return new Uint8Array(new TextEncoder().encode(str));
}

// ---------- JWT‑like token generation ----------
export interface DelegationPayload {
  sub: string;     // delegating admin username (who signed this)
  role: 'admin';
  exp: number;     // Unix timestamp of expiration
  iss: string;     // device ID of the delegating device
  iat: number;     // issued at
}

/**
 * Create an HMAC‑SHA‑256 signed delegation token that can be verified by the
 * server when it comes online.
 *
 * @param password  The plaintext password of the CURRENTLY LOGGED IN admin.
 * @param username  The admin's username.
 * @param deviceId  A unique identifier for the delegating device.
 * @returns         A JWT‑style token string.
 */
export async function generateDelegationToken(
  password: string,
  username: string,
  deviceId: string
): Promise<string> {
  // 1. Derive the HMAC key from the admin's password (same as on login)
  const keyData = await hashPassword(password, FIXED_SALT_U8);
  const keyBytes = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  // 2. Build the payload
  const now = Math.floor(Date.now() / 1000);
  const payload: DelegationPayload = {
    sub: username,
    role: 'admin',
    exp: now + 86400,         // valid for 24 hours
    iss: deviceId,
    iat: now,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = b64urlEncode(utf8ToU8(payloadJson));

  // 3. Sign with HMAC‑SHA‑256
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = b64urlEncode(utf8ToU8(JSON.stringify(header)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
   new Uint8Array(utf8ToU8(signingInput))
  );
  const sigB64 = b64urlEncode(sig);

  return `${signingInput}.${sigB64}`;
}



/**
 * (Server‑side) Verify a delegation token using the admin’s stored password hash.
 * This function is intended for the `/api/admin/delegation/claim` endpoint.
 */
export async function verifyDelegationToken(
  token: string,
  expectedPasswordHash: string   // base64 of the PBKDF2 hash
): Promise<DelegationPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const keyBytes = Uint8Array.from(atob(expectedPasswordHash), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      b64urlDecode(sigB64),
      new Uint8Array(utf8ToU8(`${headerB64}.${payloadB64}`)).buffer
    );

    if (!valid) return null;

    const payloadText = new TextDecoder().decode(b64urlDecode(payloadB64));
    const payload = JSON.parse(payloadText) as DelegationPayload;

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}