<script lang="ts">
  import { slide } from 'svelte/transition';
  import { scale } from 'svelte/transition';

  // Props
  let { queued = 0, syncing = false, online = true } = $props();

  let showSuccess = $state(false);

  // When syncing completes (goes from true to false), show "Up to date" briefly
  $effect(() => {
    if (!syncing && queued === 0 && online) {
      showSuccess = true;
      const timer = setTimeout(() => showSuccess = false, 2000);
      return () => clearTimeout(timer);
    }
  });
</script>

<div class="flex items-center gap-2">
  <!-- syncing spinner -->
  {#if syncing}
    <svg class="animate-spin h-5 w-5 text-haiti-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {/if}

  <!-- queued badge -->
  {#if queued > 0}
    <span
      class="bg-haiti-red text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1"
      in:scale={{ duration: 200 }}
      out:scale={{ duration: 200 }}
    >
      {queued}
    </span>
  {/if}

  <!-- offline indicator -->
  {#if !online}
    <span class="text-xs text-haiti-red font-medium">Offline</span>
  {/if}

  <!-- success message -->
  {#if showSuccess}
    <span
      class="text-xs text-green-600 font-medium"
      in:slide={{ duration: 200 }}
      out:slide={{ duration: 200 }}
    >
      ✅ Dènye a
    </span>
  {/if}
</div>

<style>
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>