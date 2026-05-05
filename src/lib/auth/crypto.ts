

const ALGORITHM = 'PBKDF2';
const HASH = 'SHA-256';
const ITERATIONS = 100_000;
const KEY_LENGTH = 256; // bits → 32 bytes → base64 length 44


export async function hashPassword(
  password: string,
  salt: Uint8Array
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password) as BufferSource,
    { name: ALGORITHM },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      hash: HASH,
      salt: salt as BufferSource,
      iterations: ITERATIONS,
    },
    key,
    KEY_LENGTH
  );

  // Convert ArrayBuffer → base64 (standard, no URL-safe chars needed)
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

/**
 * Convert a hex string to a Uint8Array salt.
 * Useful when we receive a salt from the server as hex.
 */
export function hexToSalt(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex salt');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * The global salt used when a per-user salt is not yet known.
 * In a zero‑budget, offline‑first platform, a fixed salt is acceptable
 * because the primary threat is network interception, not local brute force.
 * (Local brute force is bounded by the device’s limited CPU power.)
 */
export const FIXED_SALT_B64 = 'U3RNTWNoZWxEZUxhdGFsYXllU2FsdA=='; // arbitrary 24 bytes
export const FIXED_SALT_U8 = Uint8Array.from(atob(FIXED_SALT_B64), c => c.charCodeAt(0));