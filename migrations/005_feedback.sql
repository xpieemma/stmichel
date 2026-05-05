CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  event_title TEXT,
  rating INTEGER,
  comment TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_feedback_event ON feedback(event_id);
