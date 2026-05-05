-- Round 12 follow-up: relax credential_id constraint.
--
-- Pre-Round-12: admins.credential_id was UNIQUE NOT NULL. That made
-- sense when only passkey login existed. Round 8 added password-only
-- admins (no credential), which were inserted with credential_id=''.
-- That worked for the FIRST password-only admin — the empty string is
-- a valid string — but collided with UNIQUE for every subsequent one.
--
-- The Round 12 demo-login endpoint hit this exact collision: it tries
-- INSERT OR IGNORE for the 'demo' user, but the existing 'admin' row
-- with credential_id='' caused the silent ignore, so 'demo' was never
-- created, and the auth gate's cross-check failed.
--
-- Fix: rebuild admins to allow NULL credential_id, drop the UNIQUE.
-- A partial unique index keeps the integrity guarantee for actual
-- passkey credential IDs while letting password-only and demo users
-- coexist with NULL.
-- 1. New table with relaxed credential_id
CREATE TABLE admins_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  credential_id TEXT,
  public_key TEXT,
  counter INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  password_salt TEXT,
  password_iterations INTEGER DEFAULT 100000,
  created_at INTEGER DEFAULT (unixepoch())
);
-- 2. Copy rows. Empty-string credential_id becomes NULL so the unique
--    index below treats them as absent rather than colliding.
INSERT INTO admins_new (
    id,
    username,
    email,
    display_name,
    credential_id,
    public_key,
    counter,
    password_hash,
    password_salt,
    password_iterations,
    created_at
  )
SELECT id,
  username,
  email,
  display_name,
  NULLIF(credential_id, ''),
  NULLIF(public_key, ''),
  counter,
  password_hash,
  password_salt,
  password_iterations,
  created_at
FROM admins;
-- 3. Swap
DROP TABLE admins;
ALTER TABLE admins_new
  RENAME TO admins;
-- 4. Re-create the unique index, but only on non-null credential_ids.
--    Partial unique indexes are exactly what we want here: passkey
--    admins still can't share a credential, but password/demo admins
--    can have NULL without conflict.
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email_unique ON admins(email)
WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_credential_unique ON admins(credential_id)
WHERE credential_id IS NOT NULL;