<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocalDB } from '$lib/db/client';
  import { stamps, events } from '$lib/db/schema';
  import { and, eq, inArray } from 'drizzle-orm';
  import { passportCount } from '$lib/stores/passport';
  import { resolve } from '$app/paths';

  let collected = $state<any[]>([]);
  let total = $state(0);
  let loading = $state(true);

  onMount(async () => {
    const db = await getLocalDB();
    if (db) {
      // Total = number of *event*-type rows the user could possibly
      // stamp. POIs and history items have their own progression.
      const allEvents = await db
        .select()
        .from(events)
        .where(and(eq(events.published, 1), eq(events.type, 'event')))
        .all();
      total = allEvents.length;

      const myStamps = await db.select().from(stamps).all();
      const stampedIds = myStamps.map((s) => s.eventId).filter((id): id is number => id !== null);
      if (stampedIds.length) {
        // Single batch query instead of N queries inside a loop.
        // Reassign the array (Svelte reactivity needs assignment, not push).
        collected = await db
          .select()
          .from(events)
          .where(inArray(events.id, stampedIds))
          .all();
      }
    }
    loading = false;
  });

  // Guard against the divide-by-zero NaN% width before total loads.
  let progressPct = $derived(total > 0 ? Math.min(100, ($passportCount / total) * 100) : 0);
</script>

<svelte:head><title>Paspò mwen | ST MICHEL</title></svelte:head>

<div class="pb-20">
  <header class="mb-6">
    <h1 class="text-3xl font-semibold">🛂 Paspò mwen</h1>
    <div class="mt-2">
      <span class="font-semibold">{$passportCount} / {total} kache</span>
      <div class="h-2 bg-border-light rounded-full mt-1 overflow-hidden">
        <div class="h-full bg-haiti-blue rounded-full transition-all" style="width: {progressPct}%"></div>
      </div>
    </div>
  </header>

  {#if loading}
    <p class="text-center py-10 text-text-muted">Chaje paspò ou...</p>
  {:else if collected.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p>Okenn kache ankò.</p>
      <a href={resolve("/")} class="inline-block mt-4 px-6 py-2 bg-card-white border border-haiti-blue text-haiti-blue rounded-full font-medium">🏠 Ale nan paj prensipal</a>
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-3">
      {#each collected as stamp (stamp.id)}
        <div class="bg-card-white rounded-xl overflow-hidden border border-border-light">
          {#if stamp.imageUrl}<img src={stamp.imageUrl} alt={stamp.title} class="w-full h-28 object-cover" />{/if}
          <div class="p-3">
            <h3 class="font-medium">{stamp.title}</h3>
            <p class="text-xs text-text-muted">{new Date(stamp.date).toLocaleDateString('ht-HT')}</p>
            <span class="inline-block mt-2 bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full">✅ Kolekte</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if !loading && total > 0 && $passportCount === total}
    <div class="mt-6 text-center p-4 bg-card-white border border-haiti-blue rounded-full text-haiti-blue font-semibold">🎉 Tout kache kolekte! Felisitasyon!</div>
  {/if}
</div>
