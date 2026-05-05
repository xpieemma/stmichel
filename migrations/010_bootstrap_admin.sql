-- 1. Ensure admin_allowlist has all needed columns
-- (skip if they already exist from prior migrations)
-- 2. Insert the bootstrap ultimate admin into the allowlist
INSERT
  OR IGNORE INTO admin_allowlist (
    username,
    email,
    status,
    added_by,
    note,
    added_at
  )
VALUES (
    'ultimateadmin',
    'ultimate@stmichel.admin',
    'bootstrap',
    'system',
    'Bootstrap super-admin — created by migration',
    unixepoch()
  );
-- 3. Create a request_status table to track self-registrations
--    (separate from allowlist so we don't pollute the trust table)
CREATE TABLE IF NOT EXISTS admin_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 100000,
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | approved | rejected
  requested_at INTEGER NOT NULL DEFAULT (unixepoch()),
  reviewed_by TEXT,
  reviewed_at INTEGER,
  reject_reason TEXT
);