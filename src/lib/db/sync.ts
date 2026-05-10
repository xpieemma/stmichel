



import { getLocalDB } from './client';
import { events, matches, cityInfo, stamps, albums, albumPhotos, matchPhotos } from './schema';
import { eq } from 'drizzle-orm';
import { getPendingOperations, removeFromQueue } from './pending-sync';
import { signAction } from '$lib/auth/audit';
import { syncing} from '$lib/stores/sync-state';
import { sql } from 'drizzle-orm';

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
  type: 'event' | 'poi' | 'history'; 
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
  matchRow?: string | number;
  location?: string;
  description?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
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

// function stripId<T extends { id?: unknown }>(row: T): Omit<T, 'id'> {
//   const { id: _id, ...rest } = row;
//   return rest;
// }

function stripId<T extends { id?: unknown }>(row: T): Omit<T, 'id'> {
  const copy: Partial<T> = { ...row };
  delete copy.id; // ✅ Removes the ID without creating an unused variable
  return copy as Omit<T, 'id'>;
}
/**
 * Helper to dispatch URLs to the Service Worker so the actual image 
 * files are downloaded and cached for true offline viewing.
 */
function requestImagePrecache(urls: string[]) {
  // Filter out falsy values and deduplicate
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  if (uniqueUrls.length === 0) return;

  if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PRECACHE_IMAGES',
      payload: uniqueUrls
    });
  }
}

export async function syncFromServer(): Promise<void> {
  const db = await getLocalDB();
  if (!db) return;

  const lastSync = localStorage.getItem(LAST_SYNC_KEY) || '0';
  let highWaterMark = parseInt(lastSync, 10) || 0;
  
  // Accumulate URLs during sync to hand off to the Service Worker
  const imagesToCache: string[] = [];
 syncing.set(true);
  try {
    // --- 1. EVENTS SYNC ---
    const eventsRes = await fetch(`/api/events/sync?since=${lastSync}`);
    if (eventsRes.ok) {
      const serverEvents = (await eventsRes.json()) as SyncEvent[];
      for (const evt of serverEvents) {
        if (evt.imageUrl) imagesToCache.push(evt.imageUrl);

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
        if (m.coverImageUrl) imagesToCache.push(m.coverImageUrl);

        const { photos, ...matchRow } = m;
        await db
          .insert(matches)
          .values(matchRow as SyncMatch)
          .onConflictDoUpdate({ target: matches.slug, set: stripId(matchRow as SyncMatch) });

        if (photos && photos.length) {
          const local = await db.select().from(matches).where(eq(matches.slug, m.slug)).get();
          if (local) {
            // Clear old photos
            await db.delete(matchPhotos).where(eq(matchPhotos.matchId, local.id));
            
            // Prepare Bulk Insert Array
            const photoInserts = photos.map(p => {
              imagesToCache.push(p.imageUrl); // queue photo for offline cache
              const copy = { ...p } as Partial<SyncMatchPhoto>;
              delete copy.id; // ✅ Replaces the destructuring
              return { ...copy, matchId: local.id } as SyncMatchPhoto;
            });

            // Single bulk database operation
            if (photoInserts.length > 0) {
              await db.insert(matchPhotos).values(photoInserts);
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
        if (a.coverImageUrl) imagesToCache.push(a.coverImageUrl);

        const { photos, ...albumRow } = a;
        await db
          .insert(albums)
          .values(albumRow)
          .onConflictDoUpdate({ target: albums.slug, set: stripId(albumRow) });
        
        if (photos && photos.length) {
          const local = await db.select().from(albums).where(eq(albums.slug, a.slug)).get();
          if (local) {
            // Clear old photos
            await db.delete(albumPhotos).where(eq(albumPhotos.albumId, local.id));
            
            // Prepare Bulk Insert Array
            const photoInserts = photos.map(p => {
              imagesToCache.push(p.imageUrl); // queue photo for offline cache
              const copy = { ...p } as Partial<SyncAlbumPhoto>;
              delete copy.id; 
              return { ...copy, albumId: local.id } as SyncAlbumPhoto;
            });

            // Single bulk database operation
            if (photoInserts.length > 0) {
              await db.insert(albumPhotos).values(photoInserts);
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
        if (item.imageUrl) imagesToCache.push(item.imageUrl);

        await db
          .insert(cityInfo)
          .values(item)
          .onConflictDoUpdate({ target: cityInfo.key, set: stripId(item) });
          
        if (typeof item.updatedAt === 'number' && item.updatedAt > highWaterMark) {
          highWaterMark = item.updatedAt;
        }
      }
    }

    // 5. Update local cursor and tell SW to download the raw images
    if (highWaterMark > (parseInt(lastSync, 10) || 0)) {
      localStorage.setItem(LAST_SYNC_KEY, highWaterMark.toString());
    }
    
    // Dispatch network requests for images in the background
    requestImagePrecache(imagesToCache);

  } catch (error) {
    console.warn('[sync] pull failed; using cached data', error);
  } finally {
    syncing.set(false);
  }
}

export async function syncToServer(collection: string, data: unknown) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const audit = await signAction(data);
  if (audit) {
    headers['X-Audit-Signature'] = audit.signature;
    headers['X-Audit-Timestamp'] = String(audit.timestamp);
    headers['X-Audit-Device-Id'] = audit.deviceId;
  }

  const response = await fetch(`/api/admin/${collection}`, {
    method: 'POST',
    headers,
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

// export async function processPendingQueue(): Promise<void> {

//   const pending = await getPendingOperations();
//   for (const op of pending) {
//     try {
//       if (op.type === 'feedback') {
//         const res = await fetch('/api/feedback', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'X-Requested-With': 'XMLHttpRequest'
//           },
//           body: JSON.stringify(op.payload)
//         });
//         if (!res.ok) throw new Error(`Feedback POST failed: ${res.status}`);
//       } else {
//         await syncToServer(op.type, op.payload);
//       }
//       await removeFromQueue(op.id);
//     } catch (e) {
//       console.warn(`[sync] pending op ${op.id} (${op.type}) failed; will retry`, e);
//     }
//   }
// }

export async function processPendingQueue(): Promise<void> {
  const pending = await getPendingOperations();
  const db = await getLocalDB(); // We need the DB instance here to run the ID swap

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
        // 1. Send the payload to Cloudflare and await the response
        const response: unknown = await syncToServer(op.type, op.payload);

        // 2. Check if this was an offline creation that needs its ID swapped
        if (response && typeof response === 'object' && 'action' in response && response.action === 'inserted' && 'offlineId' in response && 'realId' in response && db) {
          // Swap the local SQLite auto-increment ID for the official Cloudflare D1 ID
          await db.run(sql`
            UPDATE ${sql.raw(op.type)} 
            SET id = ${response.realId} 
            WHERE id = ${response.offlineId}
          `);
          console.log(`[sync] Swapped temp ID ${response.offlineId} for real ID ${response.realId} in ${op.type}`);
        }
      }
      
      // 3. Remove from the queue ONLY after successful sync and ID swap
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