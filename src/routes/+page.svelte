<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocalDB } from '$lib/db/client';
  import { events } from '$lib/db/schema';
  import { and, asc, eq } from 'drizzle-orm';
  import { goto } from '$app/navigation';
  import PassportStamp from '$components/PassportStamp.svelte';
  import ScheduleCalendar from '$components/ScheduleCalendar.svelte';
  import { resolve } from '$app/paths';
  import LivePulse from '$lib/components/LivePulse.svelte';
 import CivicFeed from '$components/public/CivicFeed.svelte';
  import VerticalTicker from '$components/public/VerticalTicker.svelte';


  let {data} = $props();

  let feed: any[] = $state([]);
  let loading = $state(true);

  // onMount(async () => {
  //   const db = await getLocalDB();
  //   if (db) { 
  //     // Only show actual scheduled events here. POIs live on /map,
  //     // history items live on /ville. Order ascending by date so the
  //     // next thing the user can attend is at the top of the feed.
  //     feed = await db
  //       .select()
  //       .from(events)
  //       .where(and(eq(events.published, 1), eq(events.type, 'event')))
  //       .orderBy(asc(events.date))
  //       .limit(20)
  //       .all();
  //   }
  //   loading = false;
  // });
onMount(async () => {
    try {
      const db = await getLocalDB();
      if (db) { 
        feed = await db
          .select()
          .from(events)
          .where(and(eq(events.published, 1), eq(events.type, 'event')))
          .orderBy(asc(events.date))
          .limit(20)
          .all();
      }
    } catch (error) {
      console.error("🔥 DATABASE ERROR:", error); // <-- This will tell us the exact problem
    } finally {
      loading = false; // <-- This ensures "Chaje..." always goes away, even if it fails
    }
  });
  function preview(text: string | null | undefined, max = 120): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }
</script>

<svelte:head><title>ST MICHEL | St Michel de l'Attalaye</title></svelte:head>

<!-- <div class="sticky top-0 z-50 -mx-4 mb-6 bg-smoke-white/80 px-4 py-4 backdrop-blur-lg">
  <LivePulse feedItems = {data.feedItems} />



  <header class="text-center mb-6 mt-4">
    <h1 class="text-3xl font-semibold flex items-center justify-center gap-2"><span>💯</span>Bienvini <span>🔥</span> ST MICHEL<span>🙏</span></h1>
    <p class="text-text-muted">1-8-11 Me · Fet St Michel de l'Attalaye</p>
  </header>
</div>

<div class="feed-page"></div>
<div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] items-start">
    <div class="relative z-10 flex flex-col gap-6"></div>
  {#if loading}
    <p class="text-center text-text-muted py-10">Chaje...</p>
  {:else if feed.length === 0}
    <p class="text-center text-text-muted py-10">Pa gen evènman pwograme ankò.</p>
  {:else}
    <div class="flex flex-col gap-4 mt-6">
      {#each feed as event (event.id)}
        <a
          href={resolve(`/event/${event.slug}`)}
          class="block bg-card-white rounded-3xl overflow-hidden border border-border-light shadow-card no-underline text-text-primary transition-transform active:scale-[0.99]"
        >
          {#if event.imageUrl}<img src={event.imageUrl} alt={event.title} class="w-full h-44 object-cover" />{/if}
          <div class="p-4">
            <h2 class="text-xl font-semibold mb-1">{event.title}</h2>
            <div class="flex items-center gap-2 mb-2">
              <span class="w-1 h-4 bg-haiti-blue rounded-full"></span>
              <span class="text-sm text-text-secondary uppercase">{new Date(event.date).toLocaleDateString('ht-HT')}</span>
            </div>
            <p class="text-text-secondary">{preview(event.description)}</p>
          </div>
        </a>
      {/each}
    </div>
  {/if}
  </div>


  <aside class="sticky top-32 z-40 hidden flex-col gap-6 lg:flex h-fit">
    <div class="rounded-[2.5rem] border border-white bg-white p-2 shadow-xl shadow-slate-200/50">
  <ScheduleCalendar />
  </div>
  
   <div class="rounded-[2.5rem] border border-white bg-white p-6 shadow-xl shadow-slate-200/50">
  <CivicFeed events={feed} />
  </div>
 
  <VerticalTicker items={feed.filter(e => e.date >= new Date().toISOString().slice(0,10))} />

    <div class="scale-95 opacity-90 transition-all hover:scale-100 hover:opacity-100">
  <PassportStamp />
    </div>
  
</aside>
</div> -->


<!-- 1. THE TOP SHIELD (Locked Header) -->

<!-- 1. THE TOP SHIELD (Locked Header) -->
<div class="sticky top-0 z-50 -mx-4 mb-6 bg-smoke-white/90 px-4 py-4 backdrop-blur-xl border-b border-white/50 shadow-sm">
  <LivePulse feedItems={data.feedItems} />
  
  <!-- EXACT MATCH: Do not change -->
  <header class="mt-4 text-center">
    <h1 class="font-serif text-3xl font-bold flex items-center justify-center gap-2">
      <span>💯</span> Bienvini <span>🔥</span> ST MICHEL <span>🙏</span>
    </h1>
    <p class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
      1-8-11 Me · Fet St Michel de l'Attalaye
    </p>
  </header>
</div>

<div class="feed-page pt-2">
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] items-start">
    
    <!-- ========================================== -->
    <!-- LEFT COLUMN: The Scrolling Floor           -->
    <!-- ========================================== -->
    <div class="relative z-10 flex flex-col gap-6">
      
      <!-- 1. CIVIC INFO FIRST ON MOBILE -->
      <!-- Appears immediately under the header on small screens -->
      <div class="block lg:hidden rounded-[2.5rem] border border-white bg-white p-6 shadow-xl shadow-slate-200/50">
        <h3 class="mb-4 font-serif text-lg font-bold">Aktivite Vil la</h3>
        <CivicFeed events={feed} />
      </div>

      <!-- Mobile Horizontal Dashboard (Calendar, Ticker, Stamp) -->
      <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar lg:hidden">
        <div class="min-w-[260px] shrink-0">
          <div class="rounded-[2rem] border border-white bg-white p-2 shadow-md">
            <ScheduleCalendar />
          </div>
        </div>
        <div class="min-w-[260px] shrink-0">
          <VerticalTicker items={feed.filter(e => e.date >= new Date().toISOString().slice(0,10))} />
        </div>
        <div class="min-w-[120px] shrink-0 self-center">
           <PassportStamp />
        </div>
      </div>

      <!-- Main Event Feed Loop -->
      {#if loading}
        <p class="py-10 text-center text-text-muted">Chaje...</p>
      {:else if feed.length === 0}
        <p class="py-10 text-center text-text-muted">Pa gen evènman ankò.</p>
      {:else}
        <div class="flex flex-col gap-4">
          {#each feed as event (event.id)}
            <a href={resolve(`/event/${event.slug}`)} 
               class="group block overflow-hidden rounded-[2.5rem] border border-border-light bg-card-white shadow-card transition-all hover:-translate-y-1 active:scale-[0.99]">
               {#if event.imageUrl}
                <img src={event.imageUrl} alt={event.title} class="h-44 w-full object-cover" />
               {/if}
               <div class="p-6">
                 <h2 class="text-xl font-semibold mb-2 group-hover:text-haiti-blue">{event.title}</h2>
                 <p class="text-sm text-text-secondary leading-relaxed">{preview(event.description)}</p>
               </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- ========================================== -->
    <!-- RIGHT COLUMN: Desktop Sidebar              -->
    <!-- ========================================== -->
    <aside class="sticky top-36 z-40 hidden h-[calc(100vh-10rem)] flex-col gap-6 lg:flex pb-4">
      
      <!-- TOP WIDGETS: Floating Calendar & Stamp -->
      <div class="flex items-start gap-4">
        <!-- The Stamp (On top of the vertical feed space) -->
        <div class="z-20 shrink-0 scale-95 transition-transform hover:scale-105 hover:drop-shadow-2xl">
          <PassportStamp />
        </div>
        
        <!-- The Floating Calendar -->
        <!-- Heavy shadow and translation makes it "float" physically -->
        <div class="z-10 flex-1 rounded-[2rem] border border-white/60 bg-white/90 p-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all hover:-translate-y-1">
          <ScheduleCalendar />
        </div>
      </div>

      <!-- VERTICAL TICKER (Perfect as is) -->
      <div class="h-[280px] w-full">
        <VerticalTicker items={feed.filter(e => e.date >= new Date().toISOString().slice(0,10))} />
      </div>

      <!-- DESKTOP CIVIC FEED -->
      <div class="flex-1 min-h-[200px] overflow-y-auto custom-scrollbar rounded-[2.5rem] border border-white bg-white p-6 shadow-xl shadow-slate-200/50">
        <h3 class="mb-4 font-serif text-lg font-bold">Aktivite Vil la</h3>
        <CivicFeed events={feed} />
      </div>
      
    </aside>
  </div>
</div>