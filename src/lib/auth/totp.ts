/**
 * Zero‑dependency RFC6238 TOTP generator / verifier.
 * Uses Web Crypto API for HMAC‑SHA‑1.
 */

// ── Base32 ────────────────────────────────────────────────────────
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(data: string): Uint8Array {
  let bits = '';
  for (const ch of data.replace(/=+$/, '').toUpperCase()) {
    const val = BASE32_ALPHABET.indexOf(ch);
    if (val < 0) throw new Error('Invalid base32 character: ' + ch);
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

export function base32Encode(buffer: Uint8Array): string {
  let bits = '';
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0');
  }
  const padding = (5 - (bits.length % 5)) % 5;
  bits += '0'.repeat(padding);
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    result += BASE32_ALPHABET[parseInt(bits.substr(i, 5), 2)];
  }
  return result + '='.repeat(Math.ceil(padding / 8)); // standard padding
}

// ── TOTP core ─────────────────────────────────────────────────────
const TIME_STEP = 30; // seconds
const DIGITS = 6;
const HMAC_ALGORITHM = { name: 'HMAC', hash: 'SHA-1' };

/**
 * Generate a TOTP code for a given secret and time counter.
 * @param secret  Base32‑encoded secret key.
 * @param timeCounter  Epoch time divided by TIME_STEP (floor).
 */
async function totpCode(secret: string, timeCounter: number): Promise<string> {
  const keyBytes = base32Decode(secret);


  const key = await crypto.subtle.importKey(
    'raw', keyBytes.buffer as ArrayBuffer, HMAC_ALGORITHM, false, ['sign']
  );

  // Convert time counter to big‑endian 8‑byte buffer
  const counterBuf = new ArrayBuffer(8);
  const dv = new DataView(counterBuf);
  dv.setBigUint64(0, BigInt(timeCounter), false);

  const hmac = await crypto.subtle.sign(HMAC_ALGORITHM, key, counterBuf);
  const hmacBytes = new Uint8Array(hmac);

  // Dynamic truncation
  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
  const binCode =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  const code = binCode % 10 ** DIGITS;
  return code.toString().padStart(DIGITS, '0');
}

/**
 * Generate the current TOTP token from a base32 secret.
 */
export async function generateTOTP(secret: string): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / TIME_STEP);
  return totpCode(secret, counter);
}

/**
 * Verify a user‑entered TOTP code against the secret.
 * Accepts a 1‑step drift (30 seconds) to account for minor clock skew.
 */
export async function verifyTOTP(
  secret: string,
  code: string
): Promise<boolean> {
  if (code.length !== DIGITS) return false;
  const now = Math.floor(Date.now() / 1000);
  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor(now / TIME_STEP) + offset;
    if ((await totpCode(secret, counter)) === code) return true;
  }
  return false;
}

/**
 * Generate a random base32 secret (standard 160‑bit key).
 */
export function generateSecret(): string {
  const random = new Uint8Array(20);
  crypto.getRandomValues(random);
  return base32Encode(random);
}