import { getDeviceId } from '$lib/db/sync';

const AUDIT_SALT = new TextEncoder().encode('st-michel-audit-log-v1');

// Module‑level variable holding the current admin’s audit signing key.
let _auditKey: CryptoKey | null = null;

/** Derive a per‑admin signing key from their password. */
export async function deriveAuditKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: AUDIT_SALT, iterations: 100_000 },
    rawKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

/** Store the active audit key for the session. */
export function setAuditKey(key: CryptoKey) { _auditKey = key; }
/** Clear the key on logout / lock. */
export function clearAuditKey() { _auditKey = null; }

/**
 * Sign an admin action.
 * Returns an object with the base64 signature, timestamp, and deviceId.
 */
export async function signAction(data: unknown): Promise<{
  signature: string;
  timestamp: number;
  deviceId: string;
} | null> {
  if (!_auditKey) return null;

  const deviceId = getDeviceId();
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify(data) + '\n' + timestamp + '\n' + deviceId;
  const sigBuf = await crypto.subtle.sign(
    'HMAC', _auditKey!, new TextEncoder().encode(payload)
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return { signature, timestamp, deviceId };
}