CREATE TABLE albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  published INTEGER DEFAULT 1
);

CREATE TABLE album_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  blur_hash TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);
