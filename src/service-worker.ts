/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE_NAME = `festival-cache-${version}`;
const ASSETS = [...build, ...files];

sw.addEventListener('message', (event: ExtendableEvent) => {
  // Client signals it's ready to take the new SW. We skipWaiting only
  // when explicitly asked, so users aren't yanked mid-action.
  if ((event as any).data?.type === 'SKIP_WAITING') sw.skipWaiting();
});

sw.addEventListener('install', (event: ExtendableEvent) => {
  // cache.addAll is atomic — a single 404 fails the entire install
  // and offline support breaks silently. Use per-asset cache.put with
  // allSettled so a missing file (race during deploy, asset removed
  // between manifest gen and SW install) downgrades gracefully to a
  // partial cache instead of NO cache.
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const results = await Promise.allSettled(
        ASSETS.map(async (path) => {
          const response = await fetch(path, { cache: 'reload' });
          if (!response.ok) throw new Error(`${response.status} ${path}`);
          await cache.put(path, response);
        })
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        console.warn(`[sw] cached ${ASSETS.length - failed}/${ASSETS.length} assets (${failed} failed)`);
      }
    })()
  );
  // No skipWaiting() here — wait for the client to tell us. Otherwise
  // an open tab gets its app yanked from under it mid-action.
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await sw.clients.claim();
      // Tell every open client an update was applied so they can show
      // a "reload to use new version" banner instead of stale code.
      const clients = await sw.clients.matchAll({ type: 'window' });
      for (const c of clients) c.postMessage({ type: 'sw-update-available' });
    })()
  );
});

sw.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // 1. NEVER cache or intercept API calls. Sync depends on hitting the
  //    network directly; caching would silently break it.
  if (url.pathname.startsWith('/api/')) return;

  // 2. Never intercept admin routes (passkey + admin ops).
  if (url.pathname.startsWith('/admin')) return;

  // 3. Never cache non-GET requests.
  if (event.request.method !== 'GET') return;

  // 4. Only handle same-origin requests, plus the offline map tiles.
  if (url.origin !== sw.location.origin && !url.pathname.includes('/map-tiles/')) return;

  // 5. Network-first with cache fallback.
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cloned = response.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, cloned).catch(() => {});
        }
        return response;
      } catch {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // SvelteKit serves the offline route at /offline.html/ (with
        // trailing slash) because the source folder is named
        // 'offline.html/'. Try both shapes for safety.
        const offline = (await caches.match('/offline.html/')) || (await caches.match('/offline.html'));
        return offline || Response.error();
      }
    })()
  );
});

// Background-sync wakeup. We do NOT import any OPFS code here -- the
// service worker runs in a worker scope without `window`, so loading
// `@sqlite.org/sqlite-wasm` from this context throws.
// Instead, broadcast to any active client(s), which can run the actual
// sync against OPFS in the page context.
sw.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-events') {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: 'sync-pending' });
  }
}
