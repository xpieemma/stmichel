-- -- CREATE TABLE IF NOT EXISTS admin_requests (
-- --   id INTEGER PRIMARY KEY AUTOINCREMENT,
-- --   username TEXT NOT NULL,
-- --   email TEXT NOT NULL UNIQUE,
-- --   password_hash TEXT NOT NULL,
-- --   password_salt TEXT NOT NULL,
-- --   password_iterations INTEGER NOT NULL DEFAULT 310000,
-- --   status TEXT NOT NULL DEFAULT 'pending',
-- --   requested_at INTEGER NOT NULL DEFAULT (unixepoch()),
-- --   reviewed_by TEXT,
-- --   reviewed_at INTEGER,
-- --   reject_reason TEXT
-- -- );
-- -- CREATE TABLE IF NOT EXISTS admin_sessions (
-- --   token TEXT PRIMARY KEY,
-- --   username TEXT NOT NULL,
-- --   expires_at INTEGER NOT NULL,
-- --   created_at INTEGER NOT NULL DEFAULT (unixepoch())
-- -- );
-- -- CREATE TABLE IF NOT EXISTS page_views (
-- --   id INTEGER PRIMARY KEY AUTOINCREMENT,
-- --   path TEXT NOT NULL,
-- --   referrer TEXT,
-- --   user_agent TEXT,
-- --   viewed_at INTEGER NOT NULL DEFAULT (unixepoch())
-- -- );
-- -- CREATE TABLE IF NOT EXISTS stamp_analytics (
-- --   id INTEGER PRIMARY KEY AUTOINCREMENT,
-- --   stamp_id TEXT NOT NULL,
-- --   user_id TEXT,
-- --   collected_at INTEGER NOT NULL DEFAULT (unixepoch())
-- -- );
-- -- ALTER TABLE admins
-- -- ADD COLUMN password_hash TEXT;
-- -- ALTER TABLE admins
-- -- ADD COLUMN password_salt TEXT;
-- -- ALTER TABLE admins
-- -- ADD COLUMN password_iterations INTEGER;
-- -- ALTER TABLE admin_allowlist
-- -- ADD COLUMN IF added_at INTEGER;
-- -- ALTER TABLE admin_allowlist
-- -- ADD COLUMN IF requested_at INTEGER;
-- -- ALTER TABLE admin_allowlist
-- -- ADD COLUMN IF reviewed_at INTEGER;
-- -- ALTER TABLE admin_allowlist
-- -- ADD COLUMN IF reviewed_by TEXT;
-- -- INSERT
-- --   OR IGNORE INTO admin_allowlist (username, email, status, added_by, created_at)
-- -- VALUES (
-- --     'ultimateadmin',
-- --     'ultimate@stmichel.ht',
-- --     'bootstrap',
-- --     'system',
-- --     unixepoch()
-- --   ),
-- --   (
-- --     'bob',
-- --     'bob@marley.com',
-- --     'approved',
-- --     'system',
-- --     unixepoch()
-- --   );
-- -- INSERT
-- --   OR IGNORE INTO events (
-- --     slug,
-- --     title,
-- --     description,
-- --     date,
-- --     time,
-- --     location,
-- --     type,
-- --     published,
-- --     created_at,
-- --     updated_at
-- --   )
-- -- VALUES (
-- --     'gran-fet-patronal',
-- --     'Gran Fèt Patronal St Michel',
-- --     'Selebrasyon anyèl patwon vil la.',
-- --     '2026-09-29',
-- --     '09:00',
-- --     'Legliz St Michel',
-- --     'event',
-- --     1,
-- --     unixepoch(),
-- --     unixepoch()
-- --   ),
-- --   (
-- --     'konkou-mizik',
-- --     'Konkou Gwoup Mizik',
-- --     'Konpetisyon mizik lokal.',
-- --     '2026-09-28',
-- --     '19:00',
-- --     'Plas Piblik',
-- --     'event',
-- --     1,
-- --     unixepoch(),
-- --     unixepoch()
-- --   ),
-- --   (
-- --     'orijin-fet',
-- --     'Orijin Fèt Patronal la',
-- --     'Istwa kòmansman fèt la.',
-- --     '1800-01-01',
-- --     '',
-- --     'St Michel',
-- --     'history',
-- --     1,
-- --     unixepoch(),
-- --     unixepoch()
-- --   ),
-- --   (
-- --     'epok-moden',
-- --     'Epòk Modèn',
-- --     'Fèt la grandi nan ane 2000 yo.',
-- --     '2000-01-01',
-- --     '',
-- --     'St Michel',
-- --     'history',
-- --     1,
-- --     unixepoch(),
-- --     unixepoch()
-- --   );
-- -- INSERT
-- --   OR IGNORE INTO matches (
-- --     slug,
-- --     home_team,
-- --     away_team,
-- --     match_date,
-- --     match_time,
-- --     location,
-- --     status,
-- --     published,
-- --     created_at,
-- --     updated_at
-- --   )
-- -- VALUES (
-- --     'no-vs-sid',
-- --     'Ekip Nò',
-- --     'Ekip Sid',
-- --     '2026-09-29',
-- --     '15:00',
-- --     'Teren Mizipal',
-- --     'upcoming',
-- --     1,
-- --     unixepoch(),
-- --     unixepoch()
-- --   ),
-- --   (
-- --     'les-vs-no',
-- --     'Ekip Lès',
-- --     'Ekip Nò',
-- --     '2026-09-27',
-- --     '15:00',
-- --     'Teren Mizipal',
-- --     'completed',
-- --     1,
-- --     unixepoch(),
-- --     unixepoch()
-- --   );
-- -- UPDATE matches
-- -- SET home_score = 2,
-- --   away_score = 1
-- -- WHERE slug = 'les-vs-no';
-- CREATE TABLE IF NOT EXISTS admin_requests (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   username TEXT NOT NULL,
--   email TEXT NOT NULL UNIQUE,
--   password_hash TEXT NOT NULL,
--   password_salt TEXT NOT NULL,
--   password_iterations INTEGER NOT NULL DEFAULT 310000,
--   status TEXT NOT NULL DEFAULT 'pending',
--   requested_at INTEGER NOT NULL DEFAULT (unixepoch()),
--   reviewed_by TEXT,
--   reviewed_at INTEGER,
--   reject_reason TEXT
-- );
-- CREATE TABLE IF NOT EXISTS admin_sessions (
--   token TEXT PRIMARY KEY,
--   username TEXT NOT NULL,
--   expires_at INTEGER NOT NULL,
--   created_at INTEGER NOT NULL DEFAULT (unixepoch())
-- );
-- CREATE TABLE IF NOT EXISTS page_views (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   path TEXT NOT NULL,
--   referrer TEXT,
--   user_agent TEXT,
--   viewed_at INTEGER NOT NULL DEFAULT (unixepoch())
-- );
-- CREATE TABLE IF NOT EXISTS stamp_analytics (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   stamp_id TEXT NOT NULL,
--   user_id TEXT,
--   collected_at INTEGER NOT NULL DEFAULT (unixepoch())
-- );
-- INSERT
--   OR IGNORE INTO admin_allowlist (username, email, status, added_by, created_at)
-- VALUES (
--     'ultimateadmin',
--     'ultimate@stmichel.ht',
--     'bootstrap',
--     'system',
--     unixepoch()
--   ),
--   (
--     'bob',
--     'bob@marley.com',
--     'approved',
--     'system',
--     unixepoch()
--   );
-- INSERT
--   OR IGNORE INTO events (
--     slug,
--     title,
--     description,
--     date,
--     time,
--     location,
--     type,
--     published,
--     created_at,
--     updated_at
--   )
-- VALUES (
--     'gran-fet-patronal',
--     'Gran Fet Patronal St Michel',
--     'Selebrasyon anyel patwon vil la.',
--     '2026-09-29',
--     '09:00',
--     'Legliz St Michel',
--     'event',
--     1,
--     unixepoch(),
--     unixepoch()
--   ),
--   (
--     'konkou-mizik',
--     'Konkou Gwoup Mizik',
--     'Konpetisyon mizik lokal.',
--     '2026-09-28',
--     '19:00',
--     'Plas Piblik',
--     'event',
--     1,
--     unixepoch(),
--     unixepoch()
--   ),
--   (
--     'orijin-fet',
--     'Orijin Fet Patronal la',
--     'Istwa komansman fet la.',
--     '1800-01-01',
--     '',
--     'St Michel',
--     'history',
--     1,
--     unixepoch(),
--     unixepoch()
--   ),
--   (
--     'epok-moden',
--     'Epok Moden',
--     'Fet la grandi nan ane 2000 yo.',
--     '2000-01-01',
--     '',
--     'St Michel',
--     'history',
--     1,
--     unixepoch(),
--     unixepoch()
--   );
-- INSERT
--   OR IGNORE INTO matches (
--     slug,
--     home_team,
--     away_team,
--     match_date,
--     match_time,
--     location,
--     status,
--     published,
--     created_at,
--     updated_at
--   )
-- VALUES (
--     'no-vs-sid',
--     'Ekip No',
--     'Ekip Sid',
--     '2026-09-29',
--     '15:00',
--     'Teren Mizipal',
--     'upcoming',
--     1,
--     unixepoch(),
--     unixepoch()
--   ),
--   (
--     'les-vs-no',
--     'Ekip Les',
--     'Ekip No',
--     '2026-09-27',
--     '15:00',
--     'Teren Mizipal',
--     'completed',
--     1,
--     unixepoch(),
--     unixepoch()
--   );
-- UPDATE matches
-- SET home_score = 2,
--   away_score = 1
-- WHERE slug = 'les-vs-no';
-- 1. Add the missing column to the allowlist table
ALTER TABLE admin_allowlist
ADD COLUMN created_at INTEGER;
-- 2. Create the new tables
CREATE TABLE IF NOT EXISTS admin_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 100000,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at INTEGER NOT NULL DEFAULT (unixepoch()),
  reviewed_by TEXT,
  reviewed_at INTEGER,
  reject_reason TEXT
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  viewed_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS stamp_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stamp_id TEXT NOT NULL,
  user_id TEXT,
  collected_at INTEGER NOT NULL DEFAULT (unixepoch())
);
-- 3. Insert the seed data
INSERT
  OR IGNORE INTO admin_allowlist (username, email, status, added_by, created_at)
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
INSERT
  OR IGNORE INTO events (
    slug,
    title,
    description,
    date,
    time,
    location,
    type,
    published,
    created_at,
    updated_at
  )
VALUES (
    'gran-fet-patronal',
    'Gran Fet Patronal St Michel',
    'Selebrasyon anyel patwon vil la.',
    '2026-09-29',
    '09:00',
    'Legliz St Michel',
    'event',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'konkou-mizik',
    'Konkou Gwoup Mizik',
    'Konpetisyon mizik lokal.',
    '2026-09-28',
    '19:00',
    'Plas Piblik',
    'event',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'orijin-fet',
    'Orijin Fet Patronal la',
    'Istwa komansman fet la.',
    '1800-01-01',
    '',
    'St Michel',
    'history',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'epok-moden',
    'Epok Moden',
    'Fet la grandi nan ane 2000 yo.',
    '2000-01-01',
    '',
    'St Michel',
    'history',
    1,
    unixepoch(),
    unixepoch()
  );
INSERT
  OR IGNORE INTO matches (
    slug,
    home_team,
    away_team,
    match_date,
    match_time,
    location,
    status,
    published,
    created_at,
    updated_at
  )
VALUES (
    'no-vs-sid',
    'Ekip No',
    'Ekip Sid',
    '2026-09-29',
    '15:00',
    'Teren Mizipal',
    'upcoming',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'les-vs-no',
    'Ekip Les',
    'Ekip No',
    '2026-09-27',
    '15:00',
    'Teren Mizipal',
    'completed',
    1,
    unixepoch(),
    unixepoch()
  );
UPDATE matches
SET home_score = 2,
  away_score = 1
WHERE slug = 'les-vs-no';