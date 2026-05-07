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


  let data = $props();

  let feed: any[] = $state([]);
  let loading = $state(true);

  onMount(async () => {
    const db = await getLocalDB();
    if (db) {
      // Only show actual scheduled events here. POIs live on /map,
      // history items live on /ville. Order ascending by date so the
      // next thing the user can attend is at the top of the feed.
      feed = await db
        .select()
        .from(events)
        .where(and(eq(events.published, 1), eq(events.type, 'event')))
        .orderBy(asc(events.date))
        .limit(20)
        .all();
    }
    loading = false;
  });

  function preview(text: string | null | undefined, max = 120): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }
</script>
<LivePulse feedItems = {data.feedItems} />
<svelte:head><title>ST MICHEL | St Michel de l'Attalaye</title></svelte:head>


<div class="feed-page">
  <header class="text-center mb-6 mt-4">
    <h1 class="text-3xl font-semibold flex items-center justify-center gap-2"><span>💯</span>Bon Fet <span>🔥</span> ST MICHEL<span>🙏</span></h1>
    <p class="text-text-muted">1-11 Me · St Michel de l'Attalaye</p>
  </header>

  <ScheduleCalendar />

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
  <PassportStamp />
  
<!-- Vertical ticker with all upcoming events (could be filtered further for high-priority) -->
<VerticalTicker items={feed.filter(e => e.date >= new Date().toISOString().slice(0,10))} />

<!-- Main feed with calendar grouping -->
<CivicFeed events={feed} />
</div>
