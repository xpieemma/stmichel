<script lang="ts">
  import { isOnline } from '$lib/stores/network';
  import { fade } from 'svelte/transition';
</script>

{#if !$isOnline}
  <div class="offline-banner" transition:fade>
    <span>📡 Ou offline</span><span>· Done lokal yo disponib</span>
  </div>
{/if}

<style>
  .offline-banner {
    position: fixed; top: 0; left: 0; right: 0;
    background: var(--accent-red); color: white; padding: 10px;
    text-align: center; font-weight: 500; z-index: 1000;
    display: flex; justify-content: center; gap: 8px;
  }
</style>
