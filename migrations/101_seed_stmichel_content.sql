-- ═══════════════════════════════════════
-- SAINT-MICHEL-DE-L'ATALAYE CONTENT SEED
-- Rich content for city info, events, history
-- ═══════════════════════════════════════
-- ═══════════════════════════════════════
-- CITY INFO (multilingual)
-- ═══════════════════════════════════════
INSERT
  OR REPLACE INTO city_info (
    key,
    content_ht,
    content_fr,
    content_en,
    content_es,
    image_url,
    updated_at
  )
VALUES (
    'overview',
    'Sen Michèl Latalay se yon komin nan Awondisman Mamelade, nan depatman Latibonit ann Ayiti. Li gen 150,511 abitan. Li se dezyèm pi gwo vil jeyografikman apre Pòtoprens. Li sitiye nan Plato Santral la, li gen plizyè gwo legliz kretyen. Se yon bèl kote ki gen bon tè agrikòl, anpil sous dlo ak mòn nan tout direksyon.',
    'Saint-Michel-de-l''Attalaye est une commune de l''arrondissement de Marmelade, dans le département de l''Artibonite en Haïti. Elle compte 150 511 habitants. C''est la deuxième plus grande ville géographiquement après Port-au-Prince.',
    'Saint-Michel-de-l''Attalaye is a commune in the Marmelade Arrondissement, in the Artibonite department of Haiti. It has 150,511 inhabitants. It is the second largest city geographically after Port-au-Prince, the national capital. Located in the Central Plateau, it is home to several large Christian churches. It is a scenic locale, surrounded by rich farmland, abundant water resources and distant mountain peaks in every direction.',
    'Saint-Michel-de-l''Attalaye es una comuna del distrito de Marmelade, en el departamento de l''Artibonite en Haití. Cuenta con 150 511 habitantes. Es la segunda ciudad más grande geográficamente después de Puerto Príncipe.',
    '/cartestm.jpg',
    unixepoch()
  ),
  (
    'geography',
    'Sen Michèl sitiye nan 19.3713° N, 72.3370° W. Komin nan gen yon sipèfisi total de 613.74 km², kote 309.46 km² (50%) se riral, 296.82 km² (48%) se sibirbèn, epi 7.46 km² (2%) se iben. Li gen 8 seksyon kominal, ki divize an omwen 284 lokalite ak 117 katye.',
    'Saint-Michel est situé à 19.3713° N, 72.3370° W. La commune a une superficie totale de 613,74 km². Elle comprend huit sections communales subdivisées en au moins 284 localités et 117 quartiers.',
    'Saint-Michel is located at 19.3713° N, 72.3370° W. The commune has a total land area of 613.74 km², of which 50% is rural, 48% is suburban, and 2% is urban. It includes eight communal sections subdivided into at least 284 localities and 117 neighborhoods.',
    'Saint-Michel está ubicado en 19.3713° N, 72.3370° W. La comuna tiene una superficie total de 613,74 km². Incluye ocho secciones comunales subdivididas en al menos 284 localidades y 117 barrios.',
    '/carteSM.jpg',
    unixepoch()
  ),
  (
    'hydrography',
    'Zòn Sen Michèl sitiye nan pati nòdès basen idwolojik Latibonit la, nan Plato Santral. Plato a, ki gen yon altitid mwayèn de 350 m, se yon sifas ki woule dousman antoure ak mòn. Rivyè Canoe ak Bouyaha drenaj li. Lapli varyé ant 1,400 a 2,000 mm pa ane.',
    'La zone de Saint-Michel est située dans la partie nord-est du bassin hydrologique de l''Artibonite, dans le Plateau Central. Le plateau a une altitude moyenne d''environ 350 m.',
    'The Saint-Michel area is situated in the northeastern part of the Artibonite hydrological basin, in the Central Plateau. The Plateau has an average altitude of about 350m and is drained by the Canoe and Bouyaha Rivers. Rainfall ranges from 1,400 to 2,000 mm per year.',
    'La zona de Saint-Michel está situada en la parte noreste del basamento hidrográfico de l''Artibonite, en el Plateau Central. El Plateau tiene una altitud promedio de unos 350 m y está drenado por los ríos Canoe y Bouyaha. La precipitación varía de 1.400 a 2.000 mm por año.',
    '/emblemeSm.jpg',
    unixepoch()
  ),
  (
    'economy',
    'Sen Michèl gen yon sektè agrikòl divès ki se baz ekonomi lokal la. Kiltivatè yo plante koton, kann, tabak, diri, mango ak legim divès. Gen min kwiv tou. Gen yon otèl, kat restoran ak de kès popilè.',
    'Saint-Michel prospère grâce à un secteur agricole diversifié. L''économie locale repose sur la culture du coton, de la canne à sucre et du tabac, ainsi que du riz, des mangues et divers légumes.',
    'Saint-Michel thrives on a diverse agricultural sector. The local economy is based on growing cotton, sugar cane and tobacco, while farmers also yield rice, mangoes, sugarcane, and various vegetables. Copper mining contributes to the local economy. There is a hotel, four restaurants and two credit unions.',
    'Saint-Michel prospera con un sector agrícola diversificado. La economía local se basa en el cultivo de algodón, caña de azúcar y tabaco, así como de arroz, mangos y diversos vegetales. La minería de cobre contribuye a la economía local. Hay un hotel, cuatro restaurantes y dos cooperativas.',
    '/gedesm.jpg',
    unixepoch()
  ),
  (
    'education',
    'Distri lekòl la gen 132 lekòl nan komin nan — 126 nan nivo primè ak 6 nan nivo segondè. Anviwon 87% nan lekòl yo se prive. Gen kat sant alfabetizasyon ak senk enstitisyon teknik ak pwofesyonèl.',
    'Le district scolaire compte 132 écoles — 126 au niveau primaire et six au niveau secondaire. Environ 87% des écoles sont privées. Il y a aussi quatre centres d''alphabétisation et cinq institutions techniques.',
    'The school district has 132 schools — 126 at primary level and six at secondary level. Around 87% are privately owned. There are also four literacy centers and five technical and professional institutions.',
    'El distrito escolar cuenta con 132 escuelas — 126 de nivel primario y seis de nivel secundario. Aproximadamente el 87% son privadas. También hay cuatro centros de alfabetización y cinco instituciones técnicas.',
    '/marcel.jpg',
    unixepoch()
  ),
  (
    'health',
    'Gen yon sant sante ak kabann ak twa dispansè nan komin nan. Ekip swen sante a gen de doktè, yon enfimyè estajiè, sèt asistan, ak de teknisyen laboratwa. Dlo komin nan soti nan omwen senk rivyè, 62 sous ak yon lagon.',
    'Il y a un centre de santé avec lit et trois dispensaires. L''équipe de santé comprend deux médecins, un infirmier stagiaire, sept assistants et deux techniciens de laboratoire.',
    'There is a health center with a bed and three dispensaries. The healthcare team consists of two doctors, a nurse trainee, seven assistants, and two laboratory technicians. Water is supplied by at least five rivers, 62 springs and a lagoon.',
    'Hay un centro de salud con cama y tres dispensarios. El equipo de salud consiste en dos médicos, una enfermera estagiaria, siete asistentes y dos técnicos de laboratorio. El agua se suministra por al menos cinco ríos, 62 manantiales y un lago.',
    '/mounnanbouk.jpg',
    unixepoch()
  ),
  (
    'religion',
    'Gen anviwon 167 legliz nan Sen Michèl ki gen diferan denominasyon: Adventis (5), Batis (63), Katolik (25), Legliz Bondye (15), Nazareyen (1), Pentekotis (56), Temwen Jewova (1), ak Metodis (1). Chak 8 me, Sen Michèl selebre fèt patwon li, Sen Michèl. Moun ki swiv Vodou vizite Gwòt Sen Fransik toupre la.',
    'Il y a environ 167 églises de différentes dénominations à Saint-Michel. Chaque année le 8 mai, on célèbre la fête patronale de Saint Michel.',
    'There are approximately 167 churches of different denominations including Adventist (5), Baptist (63), Catholic (25), Church of God (15), Pentecostal (56), and others. Every May 8th, Saint-Michel celebrates the feast day of its patron. Vodun followers visit the nearby Grotto Saint Francis de Asis.',
    'Hay aproximadamente 167 iglesias de diferentes denominaciones en Saint-Michel. Cada año el 8 de mayo se celebra la festividad patronal de San Miguel. Los seguidores del Vodú visitan la Grotta de San Francisco de Asís cercana.',
    "/Welcome.jpg",
    unixepoch()
  ),
  (
    'tourism',
    'Sen Michèl se yon vil vibran ki atire anpil touris chak ane. Li gen 27,000 ektè tè plat ki pa divize. Aktivite yo enkli espò, atizana, mizik, bon manje, ak otèl. Gen gwòt natirèl ak kaskad dlo. Ou ka admire bèl peyizaj vetivè ki mennen nan Savane Dianne.',
    'Saint-Michel est une ville vibrante qui attire de nombreux touristes. Avec 27 000 hectares de terrain plat, la ville offre sports, art, musique live et gastronomie.',
    'St Michel de l''Attalaye is a vibrant city attracting numerous tourists annually. With 27,000 hectares of undivided flat land, it offers sports, art, live music, fine dining, and more. Natural attractions include caves and waterfalls. One can marvel at the breathtaking vetiver landscape leading to stunning Savane Dianne.',
    'Saint-Michel es una ciudad vibrante que atrae a muchos turistas cada año. Con 27,000 hectáreas de tierra plana no dividida, la ciudad ofrece deportes, arte, música en vivo y gastronomía. Hay atracciones naturales como cuevas y cascadas. Se puede admirar el impresionante paisaje de vetiver que conduce a la deslumbrante Savane Dianne.',
    "/pwopteSm.jpg",
    unixepoch()
  ),
  (
    'culture',
    'Sen Michèl se yon vil divès ak rich kiltirèlman. Chak seksyon vil la ofri yon bagay inik. Gen de bibliyotèk, twa teyat, yon sinema, yon plas piblik, de bwat de nwi, 48 gagè, ak yon teren foutbòl. Ou ka pran yon bol mayi ak kanna nan sos oswa yon senp fritay ak yon vè kleren 22.',
    'Saint-Michel est une ville culturellement riche et diversifiée. Elle dispose de deux bibliothèques, trois théâtres, un cinéma, une place publique, deux discothèques, 48 gaguères et un terrain de football.',
    'Saint-Michel is diverse and culturally rich. It has two libraries, three theaters, a cinema, a public square, two nightclubs, 48 gagueres, and a soccer field. Visitors can enjoy cockfight shows with corn and duck in sauce or simple fritay with klerin 22.',
    'Saint-Michel es una ciudad diversa y rica culturalmente. Cada sección de la ciudad ofrece algo único. Hay dos bibliotecas, tres teatros, un cine, un lugar público, dos discotecas, 48 gagueres y un campo de fútbol. Se puede disfrutar de espectáculos de gallos con maíz y pato en salsa o un simple fritay con klerin 22.',
    '/sion.jpg',
    unixepoch()
  ),
  (
    'communication',
    'Komin nan gen plizye estasyon radyo, tankou "Radio Unité", "Radio Full Power", "Radio Oxygene", "Radio Saint-Michel" ak anpil lot. Gen plizye jounal medya, magazin, ak yon estasyon televizyon (Excelcior).',
    'La commune dispose de plusieurs stations de radio, telles que "Radio Unité", "Radio Full Power", "Radio Oxygene", "Radio Saint-Michel" et bien d’autres. Il existe plusieurs journaux, magazines et une station de télévision (Excelcior).',
    'The commune has several radio stations, such as "Radio Unité", "Radio Full Power", "Radio Oxygene", "Radio Saint-Michel" and many others. There are several media journals, magazines and a television station (Excelcior).',
    'La commune tiene varias estaciones de radio, como "Radio Unité", "Radio Full Power", "Radio Oxygene", "Radio Saint-Michel" y muchas otras. Hay varios medios de comunicación, revistas y una estación de televisión (Excelcior).',
    "/unissonsSm.jpg",
    unixepoch()
  ),
  (
    'administration',
    'Enfrastrikti administratif ak jidisyè Sen Michèl gen ladan yon tribinal de pè ak yon komisarya polis. Gen yon prizon tou. Majistra prensipal la se Gueillant Dorcinvil epi Adjwen Majistra a se Merceda Jean.',
    'Les infrastructures administratives et judiciaires comprennent un tribunal de paix et un commissariat de police. Le maire principal est Gueillant Dorcinvil et la mairesse adjointe est Merceda Jean.',
    'Administrative and Judicial Infrastructures include a court of peace and a police station, plus a prison. The Principal Mayor is Gueillant Dorcinvil and the Deputy Mayor is Merceda Jean.',
    'Las infraestructuras administrativas y judiciales incluyen un tribunal de paz y un comisaría de policía. El alcalde principal es Gueillant Dorcinvil y la alcaldesa adjunta es Merceda Jean.',
    '/smMaire.jpg, /Dorcinvile.jpg',
    unixepoch()
  ),
  (
    '888fest',
    '888 Fest la se batman kè ki pa ka nye pou fet Sen Michèl Latalay. Pandan festival la, vil tounen yon limyè kiltirèl k ap selebre fèt patwonal li san kwèdèk. Lè solèy la kouche dèyè mòn yo, wout ki mennen nan Magnum Club la pral tounen batman kè vil la, avèk moto ki pral kouri monte desann nan lari, bèl negrès ak flanè ki gen plizyè koulè ap briye anba zetwal fèt lan. Avèk sipo Radio St Michel FM, selebrasyon an tounen yon gwo eksplozyon sansasyon. Anndan Magnum, DJ Valdy pral pran kontwòl, pou melanje dènye mizik Rap, Wege, Rabòday, Drill nan yon nivo ki pral chofe. Afriken gen pou li pran sèn nan pou l konekte ritm tradisyonèl yo ak enèji lari modèn. Nwit la ka rive nan nivo ki pi wo a lè L-Won fè tout foul la tounen yon sèl koral byen ta nan maten. RAM RAM RAM, 3 kout RAM. Gwo siksè sa ap chita sou do frè Marcella yo: Fernando Marcella, pwomotè vizyonè ki dèyè ki jere tout lojistik ak pwomosyon dijital, ak Erwin Mendez Marcella, MC dinamik ki gen yon vwa ki kòmande pou anime foul la. Ansanm, yo fè 888 Fest la tounen yon gwo selebrasyon pou siviv, lafwa, ak lajwa pèp Sen Michèl la. 888 makonen ak idantite fet St Michel.',
    'Le 888 Fest est le pouls indéniable de la fête de Saint-Michel-de-l''Attalaye. Pendant le festival, la ville devient un phare culturel célébrant sa fête patronale sans retenue. Lorsque le soleil se couche derrière les montagnes, la route menant au Magnum Club devient le cœur de la ville, avec des motos sillonnant les rues, de belles femmes et des fêtards élégants aux tenues colorées brillant sous les étoiles de la fête. Avec le soutien de Radio St Michel FM, la célébration se transforme en une véritable explosion de sensations. À l''intérieur du Magnum, DJ Valdy prendra le contrôle, mixant les derniers hits de Rap, Reggae, Rabòday et Drill pour enflammer l''ambiance. Afriken montera sur scène pour lier les rythmes traditionnels à l''énergie de la rue moderne. La nuit atteindra son apogée lorsque L-Won transformera toute la foule en une seule chorale jusqu''au petit matin. Cet immense succès reposera sur les épaules des frères Marcella : Fernando Marcella, le promoteur visionnaire qui gère toute la logistique et la promotion numérique, et Erwin Mendez Marcella, le dynamique MC à la voix imposante pour animer la foule. Ensemble, ils font du 888 Fest une grande célébration de la survie, de la foi et de la joie du peuple de Saint-Michel. Le 888 est intimement lié à l''identité de la fête de St Michel.',
    'The 888 Fest is the undeniable heartbeat of the Saint-Michel-de-l''Attalaye festival. During the festival, the town becomes a cultural beacon, celebrating its patronal feast without hesitation. As the sun dips behind the mountains, the road to the Magnum Club becomes the town''s pulse, with motorbikes racing up and down the streets, and beautiful women and stylish revelers in a kaleidoscope of colors shining under the festival stars. With the support of Radio St Michel FM, the celebration turns into a massive explosion of sensations. Inside Magnum, DJ Valdy will take control, mixing the latest Rap, Reggae, Rabòday, and Drill tracks at a fever pitch. Afriken will take the stage to bridge traditional rhythms with modern street energy. The night will reach its absolute peak when L-Won turns the entire crowd into a unified choir late into the morning. This massive success rests on the shoulders of the Marcella brothers: Fernando Marcella, the visionary promoter managing all logistics and digital hype, and Erwin Mendez Marcella, the dynamic MC with a commanding voice to hype the crowd. Together, they make the 888 Fest a profound celebration of survival, faith, and the joy of the people of Saint-Michel. The 888 is intertwined with the very identity of the St Michel festival.',
    'El 888 Fest es el latido innegable de la fiesta de Saint-Michel-de-l''Attalaye. Durante el festival, la ciudad se convierte en un faro cultural que celebra su fiesta patronal sin reservas. Cuando el sol se oculta tras las montañas, el camino hacia el Magnum Club se convierte en el corazón de la ciudad, con motocicletas recorriendo las calles, y hermosas mujeres y elegantes fiesteros de colores vibrantes brillando bajo las estrellas del festival. Con el apoyo de Radio St Michel FM, la celebración se convierte en una gran explosión de sensaciones. Dentro de Magnum, DJ Valdy tomará el control, mezclando los últimos éxitos de Rap, Reggae, Rabòday y Drill para encender el ambiente. Afriken subirá al escenario para conectar los ritmos tradicionales con la energía moderna de la calle. La noche alcanzará su punto máximo cuando L-Won convierta a toda la multitud en un solo coro hasta altas horas de la madrugada. Este enorme éxito descansará sobre los hombros de los hermanos Marcella: Fernando Marcella, el promotor visionario que gestiona toda la logística y promoción digital, y Erwin Mendez Marcella, el dinámico MC con una voz imponente para animar a la multitud. Juntos, hacen del 888 Fest una gran celebración de la supervivencia, la fe y la alegría del pueblo de Saint-Michel. El 888 está entrelazado con la misma identidad de la fiesta de St Michel.',
    '/88fest_2026.jpg',
    unixepoch()
  );
-- ═══════════════════════════════════════
-- HISTORY (as events with type='history')
-- ═══════════════════════════════════════
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
    'fondation-1768',
    'Fondasyon Sen Michèl (1768)',
    'Sen Michèl te fonde an 1768 sou non San Miguel de la Atalaya, sou tè Estancia Marigallega pa lyetnan-kolonèl José de Guzmán y Meléndez. Wa Charles III nan Espay te ba li tit Baron de San Miguel de la Atalaya. Kolon yo te soti nan Zile Kanari yo.',
    '1768-01-01',
    '',
    'Sen Michèl',
    'history',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'trete-1773',
    'Trete San Miguel (1773)',
    'An 1773, Trete San Miguel de la Atalaya te siyen isit la pa gouvènè koloni Panyòl Santo Domingo ak koloni Fransè Saint-Domingue. Trete a te kreye de komite pou devlope yon fwontyè ant de koloni yo, ak referans rivyè Dajabón ak Pedernales.',
    '1773-01-01',
    '',
    'Sen Michèl',
    'history',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'okipasyon-frans-1794',
    'Okipasyon Fransè (1794)',
    'Pandan Lagè Premye Kowalisyon an, Lafrans te okipe Sen Michèl an 1794. Ane apre sa, Espay te fòmèlman sede pòsyon li nan zile a bay Lafrans anba Trete Bâle la. An 1809, Espay te reprann ansyen posesyon li yo.',
    '1794-01-01',
    '',
    'Sen Michèl',
    'history',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'aneksyon-ayiti-1822',
    'Aneksyon pa Ayiti (1822)',
    'Nan desanm 1821 ak janvye 1822, Ayiti te anekse zòn santral ak nòdès zile a. Nan fevriye 1822, li te anekse vil Santo Domingo ak bò lès zile a. An 1844, Dominiken yo te pwoklame endepandans men kontwòl yo sou vil la pat efikas. Nan trete fwontyè 1936 ant Ayiti ak Repiblik Dominikèn, vil la te ofisyèlman anba kontwòl ayisyen.',
    '1822-02-01',
    '',
    'Sen Michèl',
    'history',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'popilasyon-1782',
    'Premye Resansman (1782)',
    'An 1782, popilasyon Sen Michèl te rive 1,131 abitan. Depi lè sa a, vil la te grandi dramatikman — 12,000 an 1890, 42,750 an 1950, 119,355 an 1998, epi 150,511 jodi a.',
    '1782-01-01',
    '',
    'Sen Michèl',
    'history',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'rebwazman-2020',
    'Pwojè Rebwazman (2020)',
    'Apre plante 250,000 pyebwa an 2020, devlopè pwojè yo ap ede Agrinotech plante 500,000 pyebwa pou kontinye efò rebwazman nan nò Ayiti. Pwojè a dedye a devlopman agwoforestri, restorasyon ekosistèm, ak pwoteksyon biodivèsite.',
    '2020-01-01',
    '',
    'Sen Michèl',
    'history',
    1,
    unixepoch(),
    unixepoch()
  );
-- ═══════════════════════════════════════
-- MORE EVENTS (cultural, religious, sports)
-- ═══════════════════════════════════════
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
    'fet-patronal-8-me',
    'Fèt Patronal Sen Michèl — 8 Me',
    'Chak ane nan dat 8 me, Sen Michèl selebre fèt patwon li, Sen Michèl. Se yon gwo okazyon relijye ak kiltirèl ki rasanble tout kominote a ak vizitè soti toupatou.',
    '2026-05-08',
    '08:00',
    'Legliz Katolik Sen Michèl',
    'event',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'vizit-gwot-sen-Fransik',
    'Vizit Gwòt Sen Fransik',
    'Moun ki swiv Vodou vizite Gwòt Sen Fransik ki toupre vil la. Yo ofri priyè ak sakrifis bay diferan lwa nan lafwa yo. Se yon eksperyans espiritiyèl pwofon.',
    '2026-05-09',
    '06:00',
    'Gwòt Sen Fransik, Sen Michèl',
    'event',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'jounen-agrikilti',
    'Jounen Agrikilti ak Manje Lokal',
    'Vin dekouvri richès agrikòl Sen Michèl — diri, mango, kann, koton, tabak ak legim. Kiltivatè lokal yo prezante pwodwi yo ak teknik tradisyonèl.',
    '2026-09-26',
    '10:00',
    'Mache Piblik Sen Michèl',
    'event',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'peyizaj-vetive-savane-dianne',
    'Savane Dianne — Peyizaj Vetivè',
    'Vin admire bèl peyizaj vetivè ki mennen nan estipefyan Savane Dianne. Yon eksperyans inoubliyab pou vizitè ki renmen nati ak bote peyi a.',
    '2026-09-27',
    '07:00',
    'Savane Dianne, Sen Michèl',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'gagè-tradisyonèl',
    'Espektak Gagè Tradisyonèl',
    'Pran yon ti repo nan yon gagè pou jwi yon espektak batay kòk epi manje yon bèl plat mayi ak kanna nan sos oswa yon senp fritay ak yon vè kleren 22.',
    '2026-09-28',
    '14:00',
    'Gagè Santral, Sen Michèl',
    'event',
    1,
    unixepoch(),
    unixepoch()
  );
-- ═══════════════════════════════════════
-- POINTS OF INTEREST (type = 'poi')
-- ═══════════════════════════════════════
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
    type,
    published,
    created_at,
    updated_at
  )
VALUES (
    'legliz-katolik-sen-michel',
    'Legliz Katolik Sen Michèl',
    'Youn nan pi gwo ak pi ansyen legliz nan vil la, ki la depi plis pase 50 ane. Yon pwen santral nan lavi relijye kominote a.',
    '',
    '',
    'Sant Vil Sen Michèl',
    '19.3713',
    '-72.3370',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'hotel-de-vil',
    'Otèl de Vil (City Hall)',
    'Nouvo Otèl de Vil la se yon bilding ekolojik ki fonksyone ak enèji vèt. Li te konstwi ak teknik konstriksyon modèn ak achitekti klasik.',
    '',
    '',
    'Sant Vil Sen Michèl',
    '19.3720',
    '-72.3365',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'radio-saint-michel',
    'Radio Saint-Michel',
    'Estasyon radyo prensipal vil la ki bay enfòmasyon ak divètisman pou kominote a.',
    '',
    '',
    'Sant Vil Sen Michèl',
    NULL,
    NULL,
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'radio-unite',
    'Radio Unité',
    'Dezyèm estasyon radyo vil la, sitiye sou Ri Guerrier. Li opere ak yon ekip limite.',
    '',
    '',
    'Ri Guerrier, Sen Michèl',
    NULL,
    NULL,
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'teren-foutbol-mizipal',
    'Teren Foutbòl Mizipal',
    'Teren foutbòl prensipal vil la kote match lokal ak touwa yo jwe. Se kè espòtif kominote a.',
    '',
    '',
    'Sen Michèl',
    NULL,
    NULL,
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'gwot-sen-Fransik',
    'Gwòt Sen Fransik',
    'Gwòt natirèl kote moun ki swiv Vodou vin ofri priyè ak sakrifis. Yon kote espiritiyèl enpòtan nan rejyon an.',
    '',
    '',
    'Toupre Sen Michèl',
    NULL,
    NULL,
    'poi',
    1,
    unixepoch(),
    unixepoch()
  );
-- ═══════════════════════════════════════
-- COMMUNAL SECTIONS (as events/poi for map)
-- ═══════════════════════════════════════
INSERT
  OR IGNORE INTO events (
    slug,
    title,
    description,
    date,
    location,
    type,
    published,
    created_at,
    updated_at
  )
VALUES (
    'seksyon-platana',
    '1yè Seksyon — Platana',
    'Popilasyon: 13,830. Lokalite: Alhadère, Bois Neuf, Désiré, Gaspard, Grande Mare, Grande Plaine, Platana, Roche Rameau ak plis ankò.',
    '',
    'Platana, Sen Michèl',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'seksyon-camathe',
    '2yèm Seksyon — Camathe',
    'Popilasyon: 11,130. Lokalite: Ca Marthe, Carrefour Sevère, Clerveaux, Grand Gouffre, Savane Marc ak plis ankò.',
    '',
    'Camathe, Sen Michèl',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'seksyon-bas-de-sault',
    '3yèm Seksyon — Bas de Sault',
    'Popilasyon: 12,229. Lokalite: Bas de Sault, Gauthier, Irlan, Jumeaux, Mathurin ak plis ankò.',
    '',
    'Bas de Sault, Sen Michèl',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'seksyon-lalomas',
    '4yèm Seksyon — Lalomas',
    'Popilasyon: 16,916. Lokalite: La Loma, Las Lomas, Bois Chrétien, Marché Louverture, Sainte-Marthe ak plis ankò.',
    '',
    'Lalomas, Sen Michèl',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'seksyon-lermite',
    '5yèm Seksyon — L''Ermite',
    'Popilasyon: 10,241. Lokalite: L''Ermite, Charlotte, Décid, Mapou, Terre Cassée ak plis ankò.',
    '',
    'L''Ermite, Sen Michèl',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'seksyon-lacedras',
    '6yèm Seksyon — Lacedras',
    'Popilasyon: 14,971. Lokalite: La Cidras, Bellevue, Cercadille, Orange Bénie, Savane Longue ak plis ankò.',
    '',
    'Lacedras, Sen Michèl',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'seksyon-marmont',
    '7yèm Seksyon — Marmont',
    'Popilasyon: 17,579. Lokalite: Mamont, Grand Bois, Grande Savane, L''Arabe, Platana ak plis ankò. Gen yon distri, Mamont.',
    '',
    'Marmont, Sen Michèl',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  ),
  (
    'seksyon-attalaye',
    '8yèm Seksyon — L''Attalaye',
    'Popilasyon: 14,038. Lokalite: L''Atalaye, Bassin Cheval, Dazilma, Labissainthe, Usine, Vieux Bourg ak plis ankò.',
    '',
    'L''Attalaye, Sen Michèl',
    'poi',
    1,
    unixepoch(),
    unixepoch()
  );