-- Email-based admin identity (Round 12).
--
-- Pre-Round-12, admin login used a free-form 'username'. Real-world
-- operations want emails: more memorable, supports recovery flows,
-- matches the standard mental model.
--
-- Migration is additive: existing 'username' rows keep working;
-- new admins are created with both username (a slug) AND email. The
-- login UI accepts either. A unique index on email enforces 1:1.
ALTER TABLE admins
ADD COLUMN email TEXT;
ALTER TABLE admins
ADD COLUMN display_name TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
-- The allowlist also needs email + status. 'pending' = someone has
-- requested access; 'approved' = an existing admin has accepted them
-- and they can now register; 'rejected' = denied (we keep the row so
-- the same email can't reapply repeatedly without an admin's review).
ALTER TABLE admin_allowlist
ADD COLUMN email TEXT;
ALTER TABLE admin_allowlist
ADD COLUMN status TEXT CHECK(
    status IN ('pending', 'approved', 'rejected', 'bootstrap')
  ) DEFAULT 'approved';
ALTER TABLE admin_allowlist
ADD COLUMN requested_at INTEGER;
ALTER TABLE admin_allowlist
ADD COLUMN reviewed_at INTEGER;
ALTER TABLE admin_allowlist
ADD COLUMN reviewed_by TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_allowlist_email ON admin_allowlist(email);
INSERT
  OR IGNORE INTO admin_allowlist (
    username,
    email,
    added_by,
    status,
    note,
    added_at
  )
VALUES (
    'ultimateadmin',
    'ultimate@stmichel.admin',
    'system',
    'bootstrap',
    'Bootstrap super-admin — created by migration',
    unixepoch()
  );
-- Mark the bootstrap row clearly so it shows up correctly in any UI.
UPDATE admin_allowlist
SET status = 'bootstrap'
WHERE username = 'admin'
  AND added_by = 'system';