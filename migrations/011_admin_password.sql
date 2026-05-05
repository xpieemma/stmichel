-- Password fallback for admins who can't or won't use passkeys.
--
-- Some festival admins work on shared Android devices with no
-- fingerprint sensor, or lose/replace their device mid-event. The
-- passkey flow can't help them. This migration adds the columns
-- needed to support a PBKDF2-SHA256 password login.
--
-- Security notes:
--   * Hash algorithm: PBKDF2-SHA256 with 310000 iterations (matches
--     OWASP 2023 recommendation for PBKDF2-SHA256). 32-byte output.
--   * Salt: 16 random bytes, generated per-user via crypto.getRandomValues
--     at registration time. Stored as base64.
--   * Hash output: base64-encoded.
--   * The admin_allowlist table still gates WHO can register — password
--     users must be on the allowlist, just like passkey users.
--   * Existing passkey-only admins are unaffected (NULL hash).
ALTER TABLE admins
ADD COLUMN password_hash TEXT;
ALTER TABLE admins
ADD COLUMN password_salt TEXT;
ALTER TABLE admins
ADD COLUMN password_iterations INTEGER DEFAULT 100000;