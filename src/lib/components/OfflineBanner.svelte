<!-- <script lang="ts">
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
</style> -->


<script lang="ts">
  import { isOnline } from '$lib/stores/network';
  import { fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
</script>

{#if !$isOnline}
  <!-- Floating Premium Banner -->
  <div 
    transition:fly={{ y: -20, duration: 600, easing: backOut }}
    class="fixed left-1/2 top-6 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-800/80 bg-slate-900/95 py-2 pl-2 pr-5 shadow-2xl shadow-red-900/20 backdrop-blur-md"
  >
    <!-- Glowing Red Pulse Indicator -->
    <div class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80 shadow-inner">
      <span class="relative flex h-2 w-2">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
      </span>
    </div>

    <!-- Editorial Typography -->
    <div class="flex items-center gap-2.5 pt-[1px]">
      <span class="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-white">
        Ou Offline
      </span>
      <span class="h-1 w-1 rounded-full bg-slate-700"></span>
      <span class="font-sans text-[10px] font-bold tracking-wider text-slate-400">
        Done lokal yo disponib
      </span>
    </div>
  </div>
{/if}

<style>


  :global(.font-sans) {
    font-family: 'Inter', sans-serif;
  }
</style>