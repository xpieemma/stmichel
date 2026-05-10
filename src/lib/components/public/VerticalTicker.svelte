<!-- 

<script lang="ts">
  import { resolve } from '$app/paths';
  
  type Event = {
    id: number;
    slug: string;
    title: string;
    date: string;       // 'YYYY-MM-DD'
    time?: string;
    location?: string;
  };

  let { items = [] }: { items: Event[] } = $props();

  // Smart Duplication for a flawless loop
  let displayItems = $derived([
    ...items.map((it) => ({ ...it, uniqueKey: `${it.id}-a` })),
    ...items.map((it) => ({ ...it, uniqueKey: `${it.id}-b` }))
  ]);

  const TODAY_STR = new Date().toISOString().slice(0, 10);

  // Helper to extract a beautiful day/month format
  function getDayMonth(dStr: string) {
    if (!dStr) return { day: '--', month: '---' };
    const [y, m, d] = dStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return {
      day: String(dateObj.getDate()).padStart(2, '0'),
      month: dateObj.toLocaleDateString('ht-HT', { month: 'short' }).replace('.', '').substring(0, 3)
    };
  }
</script> -->

<!-- <div class="relative h-[280px] w-full overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50"> -->
  
 <!-- Smooth Fade Masks (Top & Bottom)  -->
  <!-- <div class="pointer-events-none absolute left-0 right-0 top-0 z-10 h-12 bg-gradient-to-b from-white via-white/80 to-transparent"></div>
  <div class="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-12 bg-gradient-to-t from-white via-white/80 to-transparent"></div> -->

  <!-- Guaranteed Motion Container -->
  <!-- <div class="marquee-y-container">
    <div class="marquee-y-content flex flex-col py-4">
      
      {#each displayItems as item (item.uniqueKey)}
        {@const isToday = item.date === TODAY_STR}
        {@const dm = getDayMonth(item.date)}
        
        <a 
          href={resolve(`/event/${item.slug}`)} 
          class="group mx-3 flex items-center gap-4 rounded-2xl p-3 transition-all duration-300 hover:bg-slate-50 active:scale-[0.97]"
        > -->
          <!-- Editorial Date Block -->
          <!-- <div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[1rem] border border-slate-100 bg-white shadow-sm transition-all duration-300 group-hover:border-blue-200 group-hover:shadow-md">
            {#if isToday}
              <span class="font-sans text-[8px] font-black uppercase tracking-wider text-red-600">Jodi</span>
              <span class="font-serif text-[18px] font-bold leading-none text-red-600">{dm.day}</span>
            {:else}
              <span class="font-sans text-[8px] font-black uppercase tracking-wider text-slate-400 transition-colors group-hover:text-blue-500">{dm.month}</span>
              <span class="font-serif text-[18px] font-bold leading-none text-slate-700 transition-colors group-hover:text-blue-700">{dm.day}</span>
            {/if}
          </div> -->

          <!-- Event Data -->
          <!-- <div class="flex min-w-0 flex-col justify-center">
            <p class="truncate font-serif text-[15px] font-bold leading-tight text-slate-900 transition-colors group-hover:text-blue-600">
              {item.title}
            </p>
            <div class="mt-1 flex items-center gap-1.5">
              {#if isToday} -->
                <!-- Live indicator for today's events -->
                <!-- <span class="relative flex h-1.5 w-1.5">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
                </span>
              {/if}
              <p class="truncate font-sans text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                {item.time || 'Tout Jounen'} 
                {#if item.location}
                  <span class="mx-1 text-slate-300">•</span> {item.location}
                {/if}
              </p>
            </div>
          </div>
        </a>
      {/each}

    </div>
  </div> 
</div>

<style>


  :global(.font-serif) { font-family: 'DM Serif Display', serif; }
  :global(.font-sans) { font-family: 'Inter', sans-serif; }

  /* Rock-solid Vertical Ticker Animation */
  .marquee-y-container {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  .marquee-y-content {
    /* 
      Depending on how many items you have, you might want to adjust the 25s. 
      More items = slower speed requirement to maintain readability. 
    */
    animation: scroll-y 25s linear infinite;
  }

  /* Pauses cleanly on hover or when interacting */
  .marquee-y-container:hover .marquee-y-content,
  .marquee-y-container:active .marquee-y-content {
    animation-play-state: paused;
  }

  @keyframes scroll-y {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
</style> -->


<script lang="ts">
  import { resolve } from '$app/paths';
  
  type Event = {
    id: number;
    slug: string;
    title: string;
    date: string;       // 'YYYY-MM-DD'
    time?: string;
    location?: string;
  };

  let { items = [] }: { items: Event[] } = $props();

  // Smart Duplication for the infinite loop
  let displayItems = $derived([
    ...items.map((it) => ({ ...it, uniqueKey: `${it.id}-a` })),
    ...items.map((it) => ({ ...it, uniqueKey: `${it.id}-b` }))
  ]);

  const TODAY_STR = new Date().toISOString().slice(0, 10);

  function getDayMonth(dStr: string) {
    if (!dStr) return { day: '--', month: '---' };
    const [y, m, d] = dStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return {
      day: String(dateObj.getDate()).padStart(2, '0'),
      month: dateObj.toLocaleDateString('ht-HT', { month: 'short' }).replace('.', '').substring(0, 3)
    };
  }
</script>

<!-- Floating Card Container -->
<div class="fixed bottom-6 right-6 z-40 w-72 sm:w-80">
  <div class="relative h-[320px] w-full overflow-hidden rounded-[2.5rem] border border-white bg-smoke-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-md">
    
    <!-- Top Label / "Passport" Header -->
    <div class="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-smoke-white/90 px-6 py-3 backdrop-blur-sm">
      <span class="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Prochèn Evènman</span>
      <div class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
    </div>

    <!-- Fade Overlays -->
    <div class="pointer-events-none absolute inset-x-0 top-12 z-10 h-12 bg-gradient-to-b from-smoke-white to-transparent"></div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-smoke-white to-transparent"></div>

    <!-- Ticker Content -->
    <div class="marquee-y-container h-full pt-8">
      <div class="marquee-y-content flex flex-col gap-2 p-2">
        
        {#each displayItems as item (item.uniqueKey)}
          {@const isToday = item.date === TODAY_STR}
          {@const dm = getDayMonth(item.date)}
          
          <a 
            href={resolve(`/event/${item.slug}`)} 
            class="group flex items-center gap-4 rounded-[1.5rem] bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
          >
            <!-- The "Stamp" Date Block -->
            <div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed {isToday ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'} transition-colors group-hover:border-blue-300">
              <span class="font-sans text-[7px] font-black uppercase text-slate-400 {isToday ? 'text-red-400' : ''}">{dm.month}</span>
              <span class="font-serif text-lg font-bold leading-none {isToday ? 'text-red-600' : 'text-slate-800'}">{dm.day}</span>
            </div>

            <div class="flex min-w-0 flex-col">
              <p class="truncate font-serif text-sm font-bold text-slate-900 group-hover:text-haiti-blue">{item.title}</p>
              <p class="truncate font-sans text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {item.time || '12:00 PM'} • {item.location || 'St. Michel'}
              </p>
            </div>
          </a>
        {/each}

      </div>
    </div>
  </div>
</div>

<style>
  /* Vertical Scrolling Animation */
  .marquee-y-container {
    mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
  }

  .marquee-y-content {
    animation: scroll-y 30s linear infinite;
  }

  .marquee-y-container:hover .marquee-y-content {
    animation-play-state: paused;
  }

  @keyframes scroll-y {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }

  /* Custom Serif for the "Apprentice OS" feel */
  :global(.font-serif) {
    font-family: 'DM Serif Display', serif;
  }
</style>