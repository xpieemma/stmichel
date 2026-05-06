
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte'; // <-- MOVED to the top
  import { page, updated } from '$app/stores';
  import { resolve } from '$app/paths';
  
  import { syncFromServer, pushPendingStamps, processPendingQueue, getDeviceId } from '$lib/db/sync';
  import { startBackgroundSync } from '$lib/workers/sync-worker';
  import { initPassport } from '$lib/stores/passport';
  import OfflineBanner from '$components/OfflineBanner.svelte';
  import '../app.css';

  // Props for Svelte 5 layout
  let { children }: { children: Snippet } = $props();

  // UI state for two failure modes the architecture must surface:
  //   - DB locked by another tab (silent before this banner existed)
  //   - New deployment available (chunks would silently 404 on navigation)
  let dbLocked = $state(false);
  let updateAvailable = $state(false);

  // Single-flight guard: don't run sync more than once at a time.
  let syncing = $state(false);

  async function runSync() {
    if (syncing || typeof navigator === 'undefined' || !navigator.onLine) return;
    syncing = true;
    try {
      const userId = getDeviceId();
      // Push first so newly-pushed stamps are echoed back in the pull.
      await pushPendingStamps(userId);
      await processPendingQueue();
      await syncFromServer();
    } finally {
      syncing = false;
    }
  }

  // SvelteKit ships the worker but never registers it. Without this,
  // /service-worker.js is just a file; nothing intercepts fetches and
  // nothing caches anything for offline.
  async function registerServiceWorker() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });
      // The SW posts {type:'sync-pending'} when the browser fires a
      // background-sync event; we run the actual OPFS work here, in the
      // page context where sqlite-wasm can load.
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'sync-pending') void runSync();
      });
    } catch (err) {
      console.warn('[sw] registration failed', err);
    }
  }

  function onDbLocked() {
    dbLocked = true;
  }

  function reloadApp() {
    window.location.reload();
  }

  onMount(() => {
    initPassport();
    void registerServiceWorker();
    void runSync();
    startBackgroundSync();

    const onOnline = () => { void runSync(); };
    window.addEventListener('online', onOnline);
    window.addEventListener('db-locked', onDbLocked as EventListener);

    // SvelteKit's `updated` store flips to true when the build hash
    // changes on the server; this prevents the silent dead-chunk crash
    // after a deploy by giving the user a visible refresh prompt.
    const unsubscribe = updated.subscribe((v) => {
      if (v) updateAvailable = true;
    });

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('db-locked', onDbLocked as EventListener);
      unsubscribe();
    };
  });
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#F5F5F5" />
  <link rel="manifest" href="/manifest.json" />
</svelte:head>

{#if dbLocked}
  <div class="fixed top-0 left-0 right-0 z-[60] bg-haiti-red text-white p-3 text-center text-sm">
    📑 App louvri nan yon lòt onglè. Tanpri fèmen lòt onglè yo pou sove done w yo.
  </div>
{/if}

{#if updateAvailable}
  <div class="fixed bottom-20 left-4 right-4 z-[60] bg-haiti-blue text-white p-3 rounded-2xl shadow-lg flex items-center justify-between gap-3">
    <span class="text-sm">🚀 Nouvo vèsyon disponib.</span>
    <button onclick={reloadApp} class="bg-white text-haiti-blue px-3 py-1 rounded-full text-sm font-semibold">Aktyalize</button>
  </div>
{/if}

<OfflineBanner />
<div class="app-container" style="view-transition-name: root">
  {@render children()}
</div>

<nav class="bottom-nav">
  <a href={resolve("/")} class:active={$page.url.pathname === '/'}>🏠 Lakay</a>
  <a href={resolve("/matches")} class:active={$page.url.pathname === '/matches'}>⚽ Match</a>
  <a href={resolve("/gallery")} class:active={$page.url.pathname.startsWith('/gallery')}>📸 Galeri</a>
  <a href={resolve("/ville")} class:active={$page.url.pathname === '/ville'}>🏙️ Vil</a>
  <a href={resolve("/map")} class:active={$page.url.pathname === '/map'}>🗺️ Kat</a>
</nav>

<style>
  .app-container { max-width: 600px; margin: 0 auto; padding: 16px 16px 80px; }
  .bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0;
    display: flex; justify-content: space-around;
    background: var(--bg-card); padding: 12px 8px;
    border-top: 1px solid var(--border-light); z-index: 50;
  }
  .bottom-nav a {
    text-decoration: none; color: var(--text-secondary);
    font-size: 0.8rem; display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  .bottom-nav a.active { color: var(--accent-blue); font-weight: 600; }
</style>