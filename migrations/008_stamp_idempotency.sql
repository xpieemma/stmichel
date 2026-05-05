-- -- The original migration (001_initial.sql) creates `stamp_analytics`
-- -- with no nonce column. CREATE TABLE IF NOT EXISTS would have been a
-- -- no-op against an existing database, leaving production incapable of
-- -- recording stamps idempotently.
-- --
-- -- We migrate forward with the standard SQLite copy-and-swap pattern.
-- PRAGMA foreign_keys = OFF;
-- BEGIN TRANSACTION;
-- -- 1. New, correctly-shaped table
-- CREATE TABLE IF NOT EXISTS stamp_analytics_new (
--   id         INTEGER PRIMARY KEY AUTOINCREMENT,
--   nonce      TEXT NOT NULL,
--   event_id   INTEGER NOT NULL,
--   user_id    TEXT NOT NULL,
--   client_ts  INTEGER,            -- when the device thinks it happened
--   server_ts  INTEGER NOT NULL,   -- authoritative server timestamp
--   UNIQUE(nonce)
-- );
-- -- 2. Copy any pre-existing rows; synthesize a nonce so existing rows
-- --    are still uniquely keyed (legacy rows had no nonce concept).
-- INSERT INTO stamp_analytics_new (nonce, event_id, user_id, client_ts, server_ts)
-- SELECT
--   printf('legacy-%d', id),
--   event_id,
--   COALESCE(user_id, 'anonymous'),
--   NULL,
--   COALESCE(created_at, unixepoch())
-- FROM stamp_analytics;
-- -- 3. Swap
-- DROP TABLE stamp_analytics;
-- ALTER TABLE stamp_analytics_new RENAME TO stamp_analytics;
-- -- 4. Indexes
-- CREATE INDEX IF NOT EXISTS idx_stamp_analytics_event ON stamp_analytics(event_id);
-- CREATE INDEX IF NOT EXISTS idx_stamp_analytics_user  ON stamp_analytics(user_id);
-- COMMIT;
-- PRAGMA foreign_keys = ON;
-- The original migration (001_initial.sql) creates `stamp_analytics`
-- with no nonce column. CREATE TABLE IF NOT EXISTS would have been a
-- no-op against an existing database, leaving production incapable of
-- recording stamps idempotently.
--
-- We migrate forward with the standard SQLite copy-and-swap pattern.
PRAGMA foreign_keys = OFF;
-- 1. New, correctly-shaped table
CREATE TABLE IF NOT EXISTS stamp_analytics_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nonce TEXT NOT NULL,
  event_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  client_ts INTEGER,
  -- when the device thinks it happened
  server_ts INTEGER NOT NULL,
  -- authoritative server timestamp
  UNIQUE(nonce)
);
-- 2. Copy any pre-existing rows; synthesize a nonce so existing rows
--    are still uniquely keyed (legacy rows had no nonce concept).
INSERT INTO stamp_analytics_new (nonce, event_id, user_id, client_ts, server_ts)
SELECT printf('legacy-%d', id),
  event_id,
  COALESCE(user_id, 'anonymous'),
  NULL,
  COALESCE(created_at, unixepoch())
FROM stamp_analytics;
-- 3. Swap
DROP TABLE stamp_analytics;
ALTER TABLE stamp_analytics_new
  RENAME TO stamp_analytics;
-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_stamp_analytics_event ON stamp_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_stamp_analytics_user ON stamp_analytics(user_id);
PRAGMA foreign_keys = ON;