<!-- src/routes/admin/+layout.svelte -->
<script lang="ts">
import {browser} from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  import { currentAdmin } from '$lib/auth/session';
  import { fakeToast } from '$lib/stores/toasts';
  import Toast from '$lib/components/Toast.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { Snippet } from 'svelte';
  import { listenBroadcasts, type BroadcastMessage } from '$lib/auth/broadcast';
  import { stopHeartbeat } from '$lib/auth/heartbeat';
import { clearAuditKey } from '$lib/auth/audit';


  let { children }: { children: Snippet } = $props();

  let decoy = $state(false);
  let unsub: (() => void) | undefined;


  let unsubBroadcast: (() => void) | undefined;
  onMount(() => {
    unsub = currentAdmin.subscribe((session) => {
      decoy = session?.role === 'decoy';
    });

    if (decoy && browser) {
      document.addEventListener('click', handleDecoyClick, true);
    }

    // Also redirect if not authenticated at all (fallback safety)
    // (the server hooks already handle this, but belt-and-braces)
    if (browser && !$currentAdmin?.active) {
      goto(resolve('/admin/login'));
    }

   unsubBroadcast = listenBroadcasts((msg: BroadcastMessage) => {
  if (msg.type === 'LOGOUT') {
    stopHeartbeat();
    clearAuditKey();
    goto(resolve('/admin/login'));
  } else if (msg.type === 'SESSION_LOCK') {
    // Only lock if not already locked
    if (!get(adminLocked).locked) {
      adminLocked.set({ locked: true, username: msg.username });
    }
  } else if (msg.type === 'SESSION_UNLOCK') {
    adminLocked.set({ locked: false, username: msg.username });
  } else if (msg.type === 'DECOY_ACTIVE') {
    currentAdmin.set({ username: msg.username, role: 'decoy', active: true });
  }
});

  });

  onDestroy(() => {

    if (unsub) unsub();
    if (browser) {
      document.removeEventListener('click', handleDecoyClick, true);
    }

    if (browser && unsubBroadcast) unsubBroadcast();
  });

  function handleDecoyClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('[data-destructive]')) {
      e.preventDefault();
      e.stopPropagation();
      fakeToast('Mod pa pèmè nan mòd lekti sèlman');
    }
  }
  
</script>

{#if decoy}
  <div class="fixed top-0 left-0 right-0 bg-yellow-100 text-yellow-900 p-2 text-center text-sm font-medium z-50 border-b border-yellow-300">
    ⚠️ Mòd lekti sèlman (dekoy) — pa gen modifikasyon pèmèt
  </div>
{/if}

<div class={decoy ? 'pt-10' : ''}>
  {@render children()}
</div>

<Toast />

<style>
  /* In decoy mode, dim any element marked as destructive */
  :global(.decoy-mode [data-destructive]) {
    opacity: 0.5;
    pointer-events: none;
  }
</style>