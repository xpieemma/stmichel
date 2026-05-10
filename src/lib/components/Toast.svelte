<script lang="ts">
  import { toasts } from '$lib/stores/toasts';
  import { flip } from 'svelte/animate';
  import { fly, scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
</script>

<div class="fixed bottom-24 left-1/2 z-[100] w-full max-w-xs -translate-x-1/2 pointer-events-none px-4 flex flex-col items-center gap-3">
  {#each $toasts as toast (toast.id)}
    <div 
      animate:flip={{ duration: 400 }}
      in:fly={{ y: 20, duration: 500, easing: backOut }}
      out:scale={{ start: 0.9, duration: 200 }}
      class="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-800/50 
             bg-slate-900/95 px-6 py-3 shadow-2xl shadow-slate-900/20 backdrop-blur-md"
    >
      <!-- Subtle Pulse Icon -->
      <div class="relative flex h-2 w-2">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
      </div>

      <span class="font-sans text-xs font-bold tracking-tight text-white/95">
        {toast.message}
      </span>
    </div>
  {/each}
</div>

<style>


  :global(.font-sans) {
    font-family: 'Inter', sans-serif;
  }
</style>