-- Events table
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT,
  lat TEXT,
  lng TEXT,
  image_url TEXT,
  blur_hash TEXT,
  type TEXT CHECK(type IN ('event', 'poi', 'history')) DEFAULT 'event',
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  published INTEGER DEFAULT 1
);

-- Matches table
CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TEXT NOT NULL,
  match_time TEXT,
  location TEXT,
  description TEXT,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT CHECK(status IN ('upcoming', 'live', 'completed', 'cancelled')) DEFAULT 'upcoming',
  cover_image_url TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  published INTEGER DEFAULT 1
);

-- Match photos
CREATE TABLE match_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  blur_hash TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Passport stamps
CREATE TABLE stamps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER REFERENCES events(id),
  earned_at INTEGER DEFAULT (unixepoch()),
  synced INTEGER DEFAULT 0
);

-- Admins table for passkeys
CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Analytics (optional)
CREATE TABLE stamp_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER REFERENCES events(id),
  user_id TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
