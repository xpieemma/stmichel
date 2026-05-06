import { getRecoveryHintBlob, getRecoveryRequestedAt, setRecoveryRequestedAt } from './vault';

const RECOVERY_SALT = new TextEncoder().encode('st-michel-recovery-salt-v1');
const DELAY_MS = 5 * 60 * 1000; // 5 minutes

async function deriveRecoveryKey(pin: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKey = await crypto.subtle.importKey(
    'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: RECOVERY_SALT, iterations: 100_000 },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypt a hint string with a recovery PIN. Returns base64 of the concatenated (iv + ciphertext). */
export async function encryptHint(plainHint: string, pin: string): Promise<string> {
  const key = await deriveRecoveryKey(pin);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainHint);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/** Decrypt an encrypted blob (base64) with the recovery PIN. Returns plaintext hint. */
export async function decryptHint(encryptedBlob: string, pin: string): Promise<string> {
  const key = await deriveRecoveryKey(pin);
  const combined = Uint8Array.from(atob(encryptedBlob), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}

/**
 * Request to see the recovery hint. Records the current timestamp if not already set.
 * Returns the timestamp for countdown.
 */
export async function requestHint(username: string): Promise<number> {
  let requestedAt = await getRecoveryRequestedAt(username);
  if (!requestedAt) {
    requestedAt = Math.floor(Date.now());
    await setRecoveryRequestedAt(username, requestedAt);
  }
  return requestedAt;
}

/**
 * Attempt to unlock the hint after the delay. Returns the hint if PIN correct and time lock expired.
 */
export async function unlockHint(username: string, pin: string): Promise<string | null> {
  const requestedAt = await getRecoveryRequestedAt(username);
  if (!requestedAt) return null; // no request has been made

  const now = Date.now();
  const elapsed = now - requestedAt;
  if (elapsed < DELAY_MS) return null; // still locked

  const blob = await getRecoveryHintBlob(username);
  if (!blob) return null;

  try {
    const hint = await decryptHint(blob, pin);
    return hint;
  } catch {
    return null; // wrong PIN
  }
}