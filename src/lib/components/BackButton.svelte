<!-- <script lang="ts">
 
  let { href, text } = $props();
</script>

<a 
  {href} 
  class="inline-flex items-center gap-2 text-text-secondary hover:text-haiti-blue transition-colors mb-6 font-medium group"
>
  <span class="transform group-hover:-translate-x-1 transition-transform">←</span> 
  {text}
</a> -->

<script lang="ts">
  let { href, text } = $props();
</script>

<a 
  {href} 
  class="group mb-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-5 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95"
>
  <!-- Isolated Arrow Well -->
  <div class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm">
    <span class="transition-transform duration-300 group-hover:-translate-x-0.5">
      &larr;
    </span>
  </div>
  
  <!-- Editorial Label -->
  <span class="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition-colors group-hover:text-slate-900">
    {text}
  </span>
</a>

<style>


  :global(.font-sans) { 
    font-family: 'Inter', sans-serif; 
  }
</style>