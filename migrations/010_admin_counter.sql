-- WebAuthn replay protection requires persisting the authenticator
-- counter and checking that each new authentication returns a higher
-- counter than the last. Before this migration, the admins table had
-- no counter column and we passed `counter: 0` to verifyAuthentication,
-- which disabled the check.

ALTER TABLE admins ADD COLUMN counter INTEGER NOT NULL DEFAULT 0;
