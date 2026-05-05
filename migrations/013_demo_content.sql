-- Demo content for first-launch UX (Round 12).
--
-- Pre-Round-12: a fresh deploy with empty D1 showed ZERO events on
-- the homepage, ZERO matches, ZERO photos. New users assumed the app
-- was broken. Now we seed a small, clearly-marked set of demo rows.
--
-- The demo rows have slugs starting with 'demo-' so an operator can
-- delete them in one DELETE before launch:
--
--   DELETE FROM events WHERE slug LIKE 'demo-%';
--   DELETE FROM matches WHERE slug LIKE 'demo-%';
--   DELETE FROM albums WHERE slug LIKE 'demo-%';
--
-- Or via the admin UI (each demo row has 'DEMO:' prefix in the title
-- so admins know what's safe to delete).
INSERT
  OR IGNORE INTO events (
    slug,
    title,
    description,
    date,
    time,
    location,
    lat,
    lng,
    image_url,
    type,
    published
  )
VALUES (
    'demo-defile-ouverture',
    'DEMO: Defile ouvèti festival',
    'Defile granmoun, gwoup mizik, ak danse tradisyonèl pou louvri Festival 888 a. Komanse depi devan legliz Sen Michèl.',
    '2026-05-07',
    '15:00',
    'Plas Sen Michèl',
    '19.3795',
    '-72.3196',
    '/og-default.png',
    'event',
    1
  ),
  (
    'demo-konsè-rasin',
    'DEMO: Konsè rasin ak rara',
    'Tann nan plas piblik la pou yon nuit mizik rasin ak gwoup rara lokal yo. Antre gratis.',
    '2026-05-08',
    '19:00',
    'Plas Piblik',
    '19.3798',
    '-72.3201',
    '/og-default.png',
    'event',
    1
  ),
  (
    'demo-fwa-atizana',
    'DEMO: Fwa atizanal',
    'Atizan lokal yo prezante travay yo: woulo, kleren, sak nan tete, panye. Bon pou pi piti pri.',
    '2026-05-09',
    '09:00',
    'Mache Sen Michèl',
    '19.3790',
    '-72.3198',
    '/og-default.png',
    'event',
    1
  ),
  (
    'demo-kafe-historique',
    'DEMO: Kafe Historique',
    'Yon ti kafe sou fason vil Sen Michèl te kreye an 1768 ak istwa Batay 1793 la. Animatè: pwofesè istwa lokal yo.',
    '2026-05-10',
    '10:30',
    'Sal mileri Vil',
    NULL,
    NULL,
    '/og-default.png',
    'event',
    1
  );
INSERT
  OR IGNORE INTO events (
    slug,
    title,
    description,
    date,
    lat,
    lng,
    type,
    published
  )
VALUES (
    'demo-poi-legliz',
    'DEMO: Legliz Sen Michèl',
    'Legliz prensipal vil la, fonde an 1768.',
    '2026-01-01',
    '19.3795',
    '-72.3196',
    'poi',
    1
  ),
  (
    'demo-poi-mache',
    'DEMO: Mache santral',
    'Pi gwo mache nan rejyon an. Tout jou fèt.',
    '2026-01-01',
    '19.3790',
    '-72.3198',
    'poi',
    1
  ),
  (
    'demo-poi-radyo',
    'DEMO: Stasyon RFP 95.1',
    'Radyo lokal ki kouvri tout aktivite festival la.',
    '2026-01-01',
    '19.3801',
    '-72.3210',
    'poi',
    1
  ),
  (
    'demo-istwa-1793',
    'DEMO: Batay 3 Out 1793',
    'Anpil moun pa konnen ke yon batay enpòtan nan Revolisyon Ayisyen an te fèt nan St Michel an 1793. Solda ayisyen yo te bat fòs franse yo.',
    '2026-01-01',
    NULL,
    NULL,
    'history',
    1
  ),
  (
    'demo-istwa-kleren',
    'DEMO: Kleren — boutèy istwa nou',
    'St Michel rekonèt kòm "kapital kleren an". Distileri lokal yo pwodwi gwo kantite kleren ki ekspòte nan tout péyi a.',
    '2026-01-01',
    NULL,
    NULL,
    'history',
    1
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
    cover_image_url,
    published,
    description
  )
VALUES (
    'demo-final-2026',
    'AS Sen Michèl',
    'Real Latibonit',
    '2026-05-11',
    '16:00',
    'Estad Vil la',
    'upcoming',
    '/og-default.png',
    1,
    'Final tounwa fooutbòl ST MICHEL 2026.'
  ),
  (
    'demo-demi-finale',
    'AS Sen Michèl',
    'Étoile Sen Michèl',
    '2026-05-09',
    '16:00',
    'Estad Vil la',
    'completed',
    '/og-default.png',
    1,
    'Demi-finale a — gen yon match enkwayab.'
  );
UPDATE matches
SET home_score = 2,
  away_score = 1
WHERE slug = 'demo-demi-finale';
INSERT
  OR IGNORE INTO albums (
    slug,
    title,
    description,
    cover_image_url,
    published
  )
VALUES (
    'demo-festival-2025',
    'DEMO: Festival 2025 — Souvni',
    'Foto yo pi bèl moman nan edisyon ane pase a.',
    '/og-default.png',
    1
  ),
  (
    'demo-vil-pwomenad',
    'DEMO: Pwomenad nan Sen Michèl',
    'Yon pwomenad ak foto yo pi bèl kote nan vil la.',
    '/og-default.png',
    1
  );