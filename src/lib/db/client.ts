

import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import { browser } from '$app/environment';

let dbInstance: SqliteRemoteDatabase<typeof schema> | null = null;
let initPromise: Promise<SqliteRemoteDatabase<typeof schema> | null> | null = null;

/**
 * Initialize the local OPFS-backed SQLite database via sqlite-wasm's
 * Worker1 promiser.
 */
export async function initLocalDB() {
  if (!browser) return null;
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const doInit = async () => {
        const { sqlite3Worker1Promiser } = await import('@sqlite.org/sqlite-wasm');

        const promiser = await new Promise<any>((resolve) => {
          const _p = (sqlite3Worker1Promiser as any)({
            locateFile: (file: string) => {
              if (file.endsWith('.wasm')) {
                return '/sqlite3.wasm'; // served from static/
              }
              return file;
            },
            onready: () => resolve(_p),
          });
        });

        const openResp = await promiser('open', {
          filename: 'file:festival.db?vfs=opfs',
        });
        const dbId = openResp.dbId;

        const exec = async (sqlOrOpts: any) => {
          if (typeof sqlOrOpts === 'string') {
            return promiser('exec', { dbId, sql: sqlOrOpts });
          }
          if (sqlOrOpts.callback) {
            const cb = sqlOrOpts.callback;
            const rowMode = sqlOrOpts.rowMode || 'array';
            const result = await promiser('exec', {
              dbId,
              sql: sqlOrOpts.sql,
              bind: sqlOrOpts.bind,
              rowMode,
              returnValue: 'resultRows',
            });
            for (const row of result.result?.resultRows || []) cb(row);
            return result;
          }
          return promiser('exec', {
            dbId,
            sql: sqlOrOpts.sql,
            bind: sqlOrOpts.bind,
          });
        };

        const db = drizzle(async (sqlText, params, method) => {
          try {
            if (method === 'run') {
              await promiser('exec', { dbId, sql: sqlText, bind: params });
              return { rows: [] };
            }
            const res = await promiser('exec', {
              dbId,
              sql: sqlText,
              bind: params,
              rowMode: 'array',
              returnValue: 'resultRows',
            });
            return { rows: res.result?.resultRows || [] };
          } catch (err) {
            console.error('[sqlite] query failed:', err, '\n  SQL:', sqlText);
            throw err;
          }
        }, { schema });

        await createTables({ exec });
        return db;
      };

      if (typeof navigator !== 'undefined' && 'locks' in navigator) {
        return await new Promise<SqliteRemoteDatabase<typeof schema> | null>((resolve, reject) => {
          navigator.locks
            .request('festival_db', { ifAvailable: true }, async (lock) => {
              if (!lock) {
                console.warn('[sqlite] OPFS locked by another tab; UI will degrade');
                window.dispatchEvent(new CustomEvent('db-locked'));
                resolve(null);
                return;
              }
              try {
                const db = await doInit();
                resolve(db);
                await new Promise(() => {});
              } catch (err) {
                reject(err);
              }
            })
            .catch(reject);
        });
      }

      return await doInit();
    } catch (err) {
      console.error(
        '[sqlite] initLocalDB failed. Common causes:\n' +
          "  - Missing 'wasm-unsafe-eval' in CSP script-src\n" +
          '  - Missing COOP/COEP headers in production (check static/_headers)\n' +
          '  - Browser without OPFS support (very old Safari/Firefox)\n' +
          '  - Private browsing mode (some browsers disable OPFS there)',
        err
      );
      return null;
    }
  })();

  const result = await initPromise;
  dbInstance = result;
  if (!result) initPromise = null;
  return result;
}

async function createTables(db: { exec: (sqlOrOpts: any) => Promise<any> }) {
  // ✅ FIXED: Added 'category TEXT' back into the events table so it matches schema.ts!
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE, title TEXT, description TEXT, date TEXT, time TEXT, location TEXT, lat TEXT, lng TEXT, category TEXT, image_url TEXT, blur_hash TEXT, type TEXT DEFAULT 'event', created_at INTEGER, updated_at INTEGER, published INTEGER DEFAULT 1, version INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS matches (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE, home_team TEXT, away_team TEXT, match_date TEXT, match_time TEXT, location TEXT, description TEXT, home_score INTEGER, away_score INTEGER, status TEXT DEFAULT 'upcoming', cover_image_url TEXT, created_at INTEGER, updated_at INTEGER, published INTEGER DEFAULT 1, version INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS match_photos (id INTEGER PRIMARY KEY AUTOINCREMENT, match_id INTEGER, image_url TEXT, blur_hash TEXT, caption TEXT, sort_order INTEGER DEFAULT 0, created_at INTEGER);
    CREATE TABLE IF NOT EXISTS albums (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE, title TEXT, description TEXT, cover_image_url TEXT, blur_hash TEXT, created_at INTEGER, updated_at INTEGER, published INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS album_photos (id INTEGER PRIMARY KEY AUTOINCREMENT, album_id INTEGER, image_url TEXT, blur_hash TEXT, caption TEXT, sort_order INTEGER DEFAULT 0, created_at INTEGER);
    CREATE TABLE IF NOT EXISTS stamps (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER, earned_at INTEGER, synced INTEGER DEFAULT 0, nonce TEXT);
    CREATE TABLE IF NOT EXISTS city_info (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, content_fr TEXT, content_ht TEXT, content_es TEXT, content_en TEXT, image_url TEXT, updated_at INTEGER);
    CREATE TABLE IF NOT EXISTS pending_sync (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, payload TEXT, created_at INTEGER, attempts INTEGER DEFAULT 0, last_attempt INTEGER);
    CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER, event_title TEXT, rating INTEGER, comment TEXT, created_at INTEGER);
  `);

  let hasNonce = false;
  await db.exec({
    sql: 'PRAGMA table_info(stamps)',
    rowMode: 'object',
    callback: (row: any) => {
      if (row.name === 'nonce') hasNonce = true;
    },
  });
  if (!hasNonce) {
    await db.exec('ALTER TABLE stamps ADD COLUMN nonce TEXT;');
    await db.exec("UPDATE stamps SET nonce = printf('legacy-opfs-%d', id) WHERE nonce IS NULL;");
  }
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_stamps_nonce ON stamps(nonce);');
}

export async function getLocalDB() {
  if (dbInstance) return dbInstance;
  return initLocalDB();
}