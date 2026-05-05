
import { getLocalDB } from './client';
import { events, matches, cityInfo, stamps, albums, albumPhotos, matchPhotos } from './schema';
import { eq } from 'drizzle-orm';
import { getPendingOperations, removeFromQueue } from './pending-sync';

// -------- Typed shapes for sync responses --------
interface SyncEvent {
  id: number;
  slug: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  lat?: string;
  lng?: string;
  imageUrl?: string;
  blurHash?: string;
  type: string;
  createdAt: number;
  updatedAt: number;
  published: number;
}

interface SyncMatch {
  id: number;
  slug: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  matchTime?: string;
  location?: string;
  description?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  coverImageUrl?: string;
  createdAt: number;
  updatedAt: number;
  published: number;
}

interface SyncMatchPhoto {
  id: number;
  matchId: number;
  imageUrl: string;
  blurHash?: string;
  caption?: string;
  sortOrder: number;
  createdAt: number;
}

interface SyncAlbumPhoto {
  id: number;
  albumId: number;
  imageUrl: string;
  blurHash?: string;
  caption?: string;
  sortOrder: number;
  createdAt: number;
}

interface SyncAlbum {
  id: number;
  slug: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  createdAt: number;
  updatedAt: number;
  published: number;
  photos: SyncAlbumPhoto[];
}

interface SyncCityItem {
  id: number;
  key: string;
  contentFr?: string;
  contentHt?: string;
  contentEs?: string;
  contentEn?: string;
  imageUrl?: string;
  updatedAt: number;
}

const LAST_SYNC_KEY = 'last_sync_timestamp';

function stripId<T extends { id?: unknown }>(row: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = row;
  return rest;
}

export async function syncFromServer(): Promise<void> {
  const db = await getLocalDB();
  if (!db) return;

  const lastSync = localStorage.getItem(LAST_SYNC_KEY) || '0';
  let highWaterMark = parseInt(lastSync, 10) || 0;

  try {
    // --- 1. EVENTS SYNC ---
    const eventsRes = await fetch(`/api/events/sync?since=${lastSync}`);
    if (eventsRes.ok) {
      const serverEvents = (await eventsRes.json()) as SyncEvent[];
      for (const evt of serverEvents) {
        await db
          .insert(events)
          .values(evt)
          .onConflictDoUpdate({ target: events.slug, set: stripId(evt) });
        
        if (typeof evt.updatedAt === 'number' && evt.updatedAt > highWaterMark) {
          highWaterMark = evt.updatedAt;
        }
      }
    }

    // --- 2. MATCHES SYNC ---
    const matchesRes = await fetch(`/api/matches/sync?since=${lastSync}`);
    if (matchesRes.ok) {
      const serverMatches = (await matchesRes.json()) as Array<SyncMatch & { photos?: SyncMatchPhoto[] }>;
      for (const m of serverMatches) {
        const { photos, ...matchRow } = m;
        await db
          .insert(matches)
          .values(matchRow as SyncMatch)
          .onConflictDoUpdate({ target: matches.slug, set: stripId(matchRow as SyncMatch) });

        if (photos && photos.length) {
          const local = await db.select().from(matches).where(eq(matches.slug, m.slug)).get();
          if (local) {
            await db.delete(matchPhotos).where(eq(matchPhotos.matchId, local.id));
            for (const p of photos) {
              const { id: _pid, ...photoRow } = p;
              await db.insert(matchPhotos).values({ ...photoRow, matchId: local.id });
            }
          }
        }

        if (typeof m.updatedAt === 'number' && m.updatedAt > highWaterMark) {
          highWaterMark = m.updatedAt;
        }
      }
    }

    // --- 3. ALBUMS SYNC ---
    const albumsRes = await fetch(`/api/albums/sync?since=${lastSync}`);
    if (albumsRes.ok) {
      const serverAlbums = (await albumsRes.json()) as SyncAlbum[];
      for (const a of serverAlbums) {
        const { photos, ...albumRow } = a;
        await db
          .insert(albums)
          .values(albumRow)
          .onConflictDoUpdate({ target: albums.slug, set: stripId(albumRow) });
        
        if (photos && photos.length) {
          const local = await db.select().from(albums).where(eq(albums.slug, a.slug)).get();
          if (local) {
            await db.delete(albumPhotos).where(eq(albumPhotos.albumId, local.id));
            for (const p of photos) {
              const { id: _photoId, ...photoRow } = p;
              await db.insert(albumPhotos).values({ ...photoRow, albumId: local.id });
            }
          }
        }

        if (typeof a.updatedAt === 'number' && a.updatedAt > highWaterMark) {
          highWaterMark = a.updatedAt;
        }
      }
    }

    // --- 4. CITY INFO SYNC ---
    const cityRes = await fetch('/api/city/sync');
    if (cityRes.ok) {
      const cityData = (await cityRes.json()) as SyncCityItem[];
      for (const item of cityData) {
        await db
          .insert(cityInfo)
          .values(item)
          .onConflictDoUpdate({ target: cityInfo.key, set: stripId(item) });
        if (typeof item.updatedAt === 'number' && item.updatedAt > highWaterMark) {
          highWaterMark = item.updatedAt;
        }
      }
    }

    if (highWaterMark > (parseInt(lastSync, 10) || 0)) {
      localStorage.setItem(LAST_SYNC_KEY, highWaterMark.toString());
    }
  } catch (error) {
    console.warn('[sync] pull failed; using cached data', error);
  }
}

export async function syncToServer(collection: string, data: unknown) {
  const response = await fetch(`/api/admin/${collection}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to sync ${collection}: ${response.status}`);
  return response.json();
}

export async function pushPendingStamps(userId: string): Promise<number> {
  const db = await getLocalDB();
  if (!db) return 0;

  const pending = await db
    .select()
    .from(stamps)
    .where(eq(stamps.synced, 0))
    .all();

  let pushed = 0;
  for (const stamp of pending) {
    try {
      const res = await fetch('/api/passport/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          nonce: stamp.nonce,
          eventId: stamp.eventId,
          userId,
          clientTs: stamp.earnedAt,
        }),
      });
      if (res.ok) {
        await db.update(stamps).set({ synced: 1 }).where(eq(stamps.id, stamp.id));
        pushed++;
      }
    } catch {
      // Network error — leave it queued for next online event.
    }
  }
  return pushed;
}

export async function processPendingQueue(): Promise<void> {
  const pending = await getPendingOperations();
  for (const op of pending) {
    try {
      if (op.type === 'feedback') {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(op.payload)
        });
        if (!res.ok) throw new Error(`Feedback POST failed: ${res.status}`);
      } else {
        await syncToServer(op.type, op.payload);
      }
      await removeFromQueue(op.id);
    } catch (e) {
      console.warn(`[sync] pending op ${op.id} (${op.type}) failed; will retry`, e);
    }
  }
}

export function getDeviceId(): string {
  const KEY = 'device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) ||
         `dev_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}