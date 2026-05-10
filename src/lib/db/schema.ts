
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';


export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  date: text('date').notNull(),
  time: text('time'),
  location: text('location'),
  lat: text('lat'),
  lng: text('lng'),
  category: text('category').default('community'),
  imageUrl: text('image_url'),
  blurHash: text('blur_hash'),
  type: text('type', { enum: ['event', 'poi', 'history'] }).default('event'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  published: integer('published').default(1),
  version: integer('version').default(1),
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  matchDate: text('match_date').notNull(),
  matchTime: text('match_time'),
  location: text('location'),
  description: text('description'),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  status: text('status', { enum: ['upcoming', 'live', 'completed', 'cancelled'] }).default('upcoming'),
  coverImageUrl: text('cover_image_url'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  published: integer('published').default(1),
  version: integer('version').default(1),
});

export const matchPhotos = sqliteTable('match_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matchId: integer('match_id').references(() => matches.id),
  imageUrl: text('image_url').notNull(),
  blurHash: text('blur_hash'),
  caption: text('caption'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at'),
});

export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  published: integer('published').default(1),
  blurHash: text('blur_hash'),
});

export const albumPhotos = sqliteTable('album_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  albumId: integer('album_id').references(() => albums.id),
  imageUrl: text('image_url').notNull(),
  blurHash: text('blur_hash'),
  caption: text('caption'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at'),
});

export const stamps = sqliteTable('stamps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nonce: text('nonce').notNull().unique(),
  eventId: integer('event_id').references(() => events.id),
  earnedAt: integer('earned_at'),
  synced: integer('synced').default(0),
});

export const cityInfo = sqliteTable('city_info', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  contentFr: text('content_fr'),
  contentHt: text('content_ht'),
  contentEs: text('content_es'),
  contentEn: text('content_en'),
  imageUrl: text('image_url'),
  updatedAt: integer('updated_at'),
});

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
   email: text('email'), 
   displayName: text('display_name'), 
  credentialId: text('credential_id'),
  publicKey: text('public_key'),
  counter: integer('counter').default(0),          
  password: text('password'),
  createdAt: integer('created_at'),
});

export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: integer('event_id'),
  eventTitle: text('event_title'),
  rating: integer('rating'),
  comment: text('comment'),
  createdAt: integer('created_at'),
});

export const activityFeed = sqliteTable('activity_feed', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),    // e.g., 'event_created'
  message: text('description'),       // This is the column your app is looking for!
  metadata: text('metadata'),      // For JSON strings
  createdAt: integer('created_at').default(0),
});

export const pendingSync = sqliteTable('pending_sync', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  payload: text('payload').notNull(),

  createdAt: integer('created_at'),
  attempts: integer('attempts').default(0),
  lastAttempt: integer('last_attempt'),
});
