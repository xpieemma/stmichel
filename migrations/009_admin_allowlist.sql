-- Close the open-registration hole in the WebAuthn flow.
-- Before this migration, any internet user could POST to
-- /admin/api/webauthn and register themselves as admin.
--
-- We now enforce an allowlist that must be populated OUT OF BAND
-- (CLI, wrangler d1 execute) before a new admin can register. Once
-- an admin has registered their passkey, they stay in the `admins`
-- table with their credential; removing them from `admin_allowlist`
-- does not revoke existing access (that requires deleting the row
-- from `admins`).

CREATE TABLE IF NOT EXISTS admin_allowlist (
  username    TEXT PRIMARY KEY,
  note        TEXT,             -- free-text: role, name, phone
  added_by    TEXT,              -- username of the admin who added this entry
  added_at    INTEGER DEFAULT (unixepoch())
);

-- Bootstrap row: whoever runs migrations first gets to register the
-- first admin account. Replace this with your actual first admin's
-- username before running against production.
INSERT OR IGNORE INTO admin_allowlist (username, note, added_by)
VALUES ('admin', 'Bootstrap admin — change or delete after first real admin registers', 'system');
