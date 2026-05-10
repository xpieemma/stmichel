<!-- <script lang="ts">
	import type { Pathname } from './types';
	import { page } from '$app/stores';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { updated } from '$app/stores';
	import { resolve } from '$app/paths';
	import { onNavigate } from '$app/navigation'; // <-- Correctly imported

	import {
		syncFromServer,
		pushPendingStamps,
		processPendingQueue,
		getDeviceId
	} from '$lib/db/sync';

	import { startBackgroundSync } from '$lib/workers/sync-worker';
	import { initPassport } from '$lib/stores/passport';
	import OfflineBanner from '$components/OfflineBanner.svelte';
	import '../app.css';

	let { children }: { children: Snippet } = $props();
	let dbLocked = $state(false);
	let updateAvailable = $state(false);
	let syncing = $state(false);

	// ✅ View Transitions MUST be registered at the top level of the script
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolveTransition) => {
			document.startViewTransition(async () => {
				resolveTransition();
				await navigation.complete;
			});
		});
	});

	async function runSync() {
		if (syncing || typeof navigator === 'undefined' || !navigator.onLine) return;

		syncing = true;

		try {
			const userId = getDeviceId();

			await pushPendingStamps(userId);
			await processPendingQueue();
			await syncFromServer();
		} finally {
			syncing = false;
		}
	}

	async function registerServiceWorker() {
		if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

		try {
			await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });

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

		const onOnline = () => {
			void runSync();
		};

		window.addEventListener('online', onOnline);
		window.addEventListener('db-locked', onDbLocked as EventListener);

		const unsubscribe = updated.subscribe((v) => {
			if (v) updateAvailable = true;
		});

		// ✅ Clean return without unreachable code underneath it
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
	<div class="bg-haiti-red fixed top-0 right-0 left-0 z-[60] p-3 text-center text-sm text-white">
		📑 App louvri nan yon lòt onglè. Tanpri fèmen lòt onglè yo pou sove done w yo.
	</div>
{/if}

{#if updateAvailable}
	<div
		class="bg-haiti-blue fixed right-4 bottom-20 left-4 z-[60] flex items-center justify-between gap-3 rounded-2xl p-3 text-white shadow-lg"
	>
		<span class="text-sm">🚀 Nouvo vèsyon disponib.</span>

		<button
			onclick={reloadApp}
			class="text-haiti-blue rounded-full bg-white px-3 py-1 text-sm font-semibold"
			>Aktyalize</button
		>
	</div>
{/if}

<OfflineBanner />

<div class="app-container" style="view-transition-name: roots">{@render children()}</div>

<nav class="bottom-nav">
	<a href={resolve('/')} class:active={$page.url.pathname === '/'}>🏠 Lakay</a>

	<a href={resolve('/matches')} class:active={$page.url.pathname === '/matches'}>⚽ Match</a>

	<a href={resolve('/gallery')} class:active={$page.url.pathname.startsWith('/gallery')}
		>📸 Galeri</a
	>

	<a href={resolve('/ville')} class:active={$page.url.pathname === '/ville'}>🏙️ Vil</a>

	<a href={resolve('/map')} class:active={$page.url.pathname === '/map'}>🗺️ Kat</a>
</nav>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref($page.url.pathname || '', { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>

<style>
	.app-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 16px 16px 80px;
	}

	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		background: var(--bg-card);
		padding: 12px 8px;
		border-top: 1px solid var(--border-light);
		z-index: 50;
	}

	.bottom-nav a {
		text-decoration: none;
		color: var(--text-secondary);
		font-size: 0.8rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.bottom-nav a.active {
		color: var(--accent-blue);
		font-weight: 600;
	}
</style> -->


<script lang="ts">
  import type { Pathname } from './$types';
  import { locales, localizeHref } from '$lib/paraglide/runtime';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { page, updated } from '$app/stores';
  import { resolve } from '$app/paths';
  import { onNavigate } from '$app/navigation';
  
  import { syncFromServer, pushPendingStamps, processPendingQueue, getDeviceId } from '$lib/db/sync';
  import { startBackgroundSync } from '$lib/workers/sync-worker';
  import { initPassport } from '$lib/stores/passport';
  import OfflineBanner from '$components/OfflineBanner.svelte';
  import '../app.css';

  let { children }: { children: Snippet } = $props();

  let dbLocked = $state(false);
  let updateAvailable = $state(false);
  let syncing = $state(false);

  // Derived pathname to trigger reactivity when navigating
  let pathname = $derived($page.url.pathname);

  // Smart active route checker that ignores 2-letter language prefixes
  function isActive(target: string) {
    if (target === '/') {
      return pathname === '/' || /^\/[a-z]{2}\/?$/.test(pathname);
    }
    return pathname.includes(target);
  }

  // View Transitions registered at the top level
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    return new Promise((resolveTransition) => {
      document.startViewTransition(async () => {
        resolveTransition();
        await navigation.complete;
      });
    });
  });

  async function runSync() {
    if (syncing || typeof navigator === 'undefined' || !navigator.onLine) return;
    syncing = true;
    try {
      const userId = getDeviceId();
      await pushPendingStamps(userId);
      await processPendingQueue();
      await syncFromServer();
    } finally {
      syncing = false;
    }
  }

  async function registerServiceWorker() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });
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

<div class="mx-auto max-w-[600px] px-4 pt-4 pb-20" style="view-transition-name: page-container">
  {@render children()}
</div>

<nav class="fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-[var(--bg-card)] py-3 px-2 border-t border-[var(--border-light)]">
  <a href={resolve("/")} class="no-underline text-[0.8rem] flex flex-col items-center gap-1 transition-colors duration-200 {isActive('/') ? 'text-[var(--accent-blue)] font-semibold' : 'text-[var(--text-secondary)]'}">
    🏠 Lakay
  </a>
  <a href={resolve("/matches")} class="no-underline text-[0.8rem] flex flex-col items-center gap-1 transition-colors duration-200 {isActive('/matches') ? 'text-[var(--accent-blue)] font-semibold' : 'text-[var(--text-secondary)]'}">
    ⚽ Match
  </a>
  <a href={resolve("/gallery")} class="no-underline text-[0.8rem] flex flex-col items-center gap-1 transition-colors duration-200 {isActive('/gallery') ? 'text-[var(--accent-blue)] font-semibold' : 'text-[var(--text-secondary)]'}">
    📸 Galeri
  </a>
  <a href={resolve("/ville")} class="no-underline text-[0.8rem] flex flex-col items-center gap-1 transition-colors duration-200 {isActive('/ville') ? 'text-[var(--accent-blue)] font-semibold' : 'text-[var(--text-secondary)]'}">
    🏙️ Vil
  </a>
  <a href={resolve("/map")} class="no-underline text-[0.8rem] flex flex-col items-center gap-1 transition-colors duration-200 {isActive('/map') ? 'text-[var(--accent-blue)] font-semibold' : 'text-[var(--text-secondary)]'}">
    🗺️ Kat
  </a>
</nav>

<div class="hidden">
  {#each locales as locale (locale)}
    <a href={resolve(localizeHref($page.url.pathname || '', { locale }) as Pathname)}>{locale}</a>
  {/each}
</div>