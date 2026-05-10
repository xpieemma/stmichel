-- Migration number: 0102 	 2026-05-07T02:20:43.433Z
CREATE TABLE IF NOT EXISTS activity_feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type TEXT NOT NULL,
  description TEXT,
  user_id TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);