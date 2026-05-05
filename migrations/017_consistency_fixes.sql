-- ============================================================
-- Migration 017: Consistency fixes
-- Fixes two latent bugs from earlier migrations:
--   1. stamps.nonce was added in OPFS schema but not cloud schema
--   2. admin_allowlist seed used wrong column name (created_at instead of added_at)
-- ============================================================
-- Fix 1: Add nonce column to stamps (cloud parity with OPFS)
ALTER TABLE stamps
ADD COLUMN nonce TEXT;
UPDATE stamps
SET nonce = printf('legacy-%d', id)
WHERE nonce IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stamps_nonce ON stamps(nonce);
-- Fix 2: Re-seed allowlist with the correct column name
-- (previous migration tried to insert into created_at which doesn't exist)
INSERT
  OR IGNORE INTO admin_allowlist (username, email, status, added_by, added_at)
VALUES (
    'ultimateadmin',
    'ultimate@stmichel.ht',
    'bootstrap',
    'system',
    unixepoch()
  ),
  (
    'bob',
    'bob@marley.com',
    'approved',
    'system',
    unixepoch()
  );