-- Re-seed admin_allowlist with the correct column name
-- (previous migration tried to insert into 'created_at' which doesn't exist)
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