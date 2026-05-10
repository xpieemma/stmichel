<script lang="ts">
  import { passportCount } from '$lib/stores/passport';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
</script>

<button 
  type="button" 
  class="group fixed bottom-[90px] right-5 z-[100] flex items-center gap-3.5 
         rounded-[2.5rem] border border-slate-200/80 bg-white/90 p-2.5 pr-5 pl-3 
         shadow-lg shadow-slate-200/50 backdrop-blur-md transition-all 
         duration-300 hover:-translate-y-1 hover:border-blue-600 
         hover:shadow-xl active:scale-[0.96] active:translate-y-0"
  onclick={() => goto(resolve('/passport'))}
>
  <!-- Icon Well -->
  <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-2xl shadow-inner">
    <span class="icon">🛂</span>
  </div>

  <!-- Content -->
  <div class="flex flex-col text-left">
    <span class="mb-0.5 font-sans text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
      Paspò Dijital
    </span>
    <div class="flex items-center gap-2">
      <span class="font-serif text-2xl font-bold leading-none text-slate-900">
        {$passportCount}
      </span>
      <span class="rounded-full bg-blue-600 px-2.5 py-0.5 font-sans text-[9px] font-extrabold uppercase tracking-wider text-white shadow-md shadow-blue-500/20">
        Kache
      </span>
    </div>
  </div>

  <!-- Animated Chevron -->
  <span class="ml-1 text-xl text-slate-300 transition-transform group-hover:translate-x-1">
    &rsaquo;
  </span>
</button>

<style>
  /* Integrating your specific font choices into the Tailwind utility layer */


  :global(.font-serif) {
    font-family: 'DM Serif Display', serif;
  }
  
  :global(.font-sans) {
    font-family: 'Inter', sans-serif;
  }
</style>