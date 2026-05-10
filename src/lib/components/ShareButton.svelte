<script lang="ts">
  import { fade } from 'svelte/transition';

  let { title, text, url }: { title: string; text: string; url: string } = $props();
  let copied = $state(false);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Share failed', err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => copied = false, 2000);
    }
  }
</script>

<button 
  onclick={share} 
  class="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full border border-slate-200 bg-white/50 px-6 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-blue-500 hover:bg-white hover:shadow-md active:scale-95 active:bg-slate-50"
>
  {#if copied}
    <span in:fade={{ duration: 200 }} class="flex items-center gap-2 font-sans text-sm font-bold tracking-tight text-blue-600">
      ✅ Lyen kopye!
    </span>
  {:else}
    <div in:fade={{ duration: 200 }} class="flex items-center gap-2">
      <span class="text-lg transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">📤</span>
      <span class="font-sans text-sm font-bold uppercase tracking-[0.1em] text-slate-600 group-hover:text-slate-900">
        Pataje
      </span>
    </div>
  {/if}
</button>

<style>


  :global(.font-sans) {
    font-family: 'Inter', sans-serif;
  }
</style>