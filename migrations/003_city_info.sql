CREATE TABLE city_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  content_fr TEXT,
  content_ht TEXT,
  content_es TEXT,
  content_en TEXT,
  image_url TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);

INSERT INTO city_info (key, content_fr, content_ht, content_es, content_en) VALUES
('history', 
 'Saint-Michel de l''Attalaye est une commune d''Haïti située dans le département de l''Artibonite. Fondée en 1768 sous le nom de San Miguel de la Atalaya, elle doit son nom à Saint Michel Archange. La bataille de Saint-Michel-de-l''Attalaye s''y déroula le 3 août 1793 pendant la Révolution haïtienne.',
 'Sen Michèl Latalay se yon komin nan depatman Latibonit. Li te fonde an 1768 sou non San Miguel de la Atalaya. Batay Sen Michèl te fèt 3 out 1793 pandan Revolisyon Ayisyen an.',
 'Saint-Michel de l''Attalaye es una comuna de Haití ubicada en el departamento de Artibonite. Fue fundada en 1768 con el nombre de San Miguel de la Atalaya. La batalla de Saint-Michel-de-l''Attalaye tuvo lugar el 3 de agosto de 1793 durante la Revolución Haitiana.',
 'Saint-Michel de l''Attalaye is a commune in Haiti located in the Artibonite department. Founded in 1768 as San Miguel de la Atalaya, it is named after Saint Michael the Archangel. The Battle of Saint-Michel-de-l''Attalaye took place on August 3, 1793 during the Haitian Revolution.'),
 
('mayor',
 'Le maire actuel est le Dr. Gueillant Dorcinvil (également orthographié Dorsainville). Il est en poste depuis plus de 10 ans et a lancé le mouvement politique "Vision SMA".',
 'Majistra aktyèl la se Dr. Gueillant Dorcinvil (oswa Dorsainville). Li nan pòs depi plis pase 10 lane e li te lanse mouvman politik "Vision SMA".',
 'El alcalde actual es el Dr. Gueillant Dorcinvil (también escrito Dorsainville). Lleva más de 10 años en el cargo y lanzó el movimiento político "Vision SMA".',
 'The current mayor is Dr. Gueillant Dorcinvil (also spelled Dorsainville). He has been in office for over 10 years and launched the political movement "Vision SMA".'),
 
('888fest',
 'Le festival "Saint-Michel en fête – 888" a lieu chaque année les 7 et 8 mai. C''est l''un des plus grands événements culturels de la région, attirant des milliers de visiteurs.',
 'Festival "Saint-Michel en fête – 888" fèt chak ane 7 ak 8 me. Se youn nan pi gwo evènman kiltirèl nan zòn nan, ki atire plizyè milye vizitè.',
 'El festival "Saint-Michel en fête – 888" se celebra cada año el 7 y 8 de mayo. Es uno de los eventos culturales más grandes de la región, atrayendo a miles de visitantes.',
 'The "Saint-Michel en fête – 888" festival takes place every year on May 7th and 8th. It is one of the largest cultural events in the region, attracting thousands of visitors.'),
 
('clairin',
 'Saint-Michel de l''Attalaye est considérée comme le "grand cru" du clairin haïtien. Le Clairin Sajous, produit à la Distillerie Chelo par Michel Sajous, est mondialement reconnu.',
 'Yo konsidere Sen Michèl Latalay kòm "gran krwa" kleren ayisyen an. Kleren Sajous, ki fèt nan Distileri Chelo pa Michel Sajous, se yon kleren ki renome entènasyonalman.',
 'Saint-Michel de l''Attalaye es considerado el "grand cru" del clairin haitiano. El Clairin Sajous, producido en la Destilería Chelo por Michel Sajous, es reconocido mundialmente.',
 'Saint-Michel de l''Attalaye is considered the "grand cru" of Haitian clairin. Clairin Sajous, produced at Distillerie Chelo by Michel Sajous, is world‑renowned.'),
 
('radio',
 'Radios locales : Radio Full Power (RFP) 95.1 FM, Radio St Michel FM, Radio Tele Exelcior (RTE) 93.9 FM.',
 'Radyo lokal yo : Radyo Full Power (RFP) 95.1 FM, Radyo St Michel FM, Radyo Tele Exelcior (RTE) 93.9 FM.',
 'Radios locales: Radio Full Power (RFP) 95.1 FM, Radio St Michel FM, Radio Tele Exelcior (RTE) 93.9 FM.',
 'Local radio stations: Radio Full Power (RFP) 95.1 FM, Radio St Michel FM, Radio Tele Exelcior (RTE) 93.9 FM.');

-- Festival dates (dynamic)
INSERT INTO city_info (key, content_en, updated_at) VALUES 
('festival_start', '2026-05-01', unixepoch()),
('festival_end', '2026-05-11', unixepoch());
