<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocalDB } from '$lib/db/client';
  import { events, cityInfo } from '$lib/db/schema';
  import { gte, lte, and, eq } from 'drizzle-orm';
  import { goto } from '$app/navigation';
	import { SvelteDate } from 'svelte/reactivity';
  import { resolve } from '$app/paths';
  
  function navigateToEvent(slug: string) {
    goto(resolve(`/event/${slug}`));
  }

  let selectedDate = $state<string | null>(null);
  let dayEvents = $state<any[]>([]);
  let monthEvents = $state<any[]>([]);
  // Sensible defaults; overridden from city_info if present.
  let festivalStart = $state('2026-05-01');
  let festivalEnd = $state('2026-05-11');
  let festivalDays = $state<number[]>([]);

  onMount(async () => {
    const db = await getLocalDB();
    if (!db) return;

    const startRow = await db
      .select()
      .from(cityInfo)
      .where(eq(cityInfo.key, 'festival_start'))
      .get();
    const endRow = await db
      .select()
      .from(cityInfo)
      .where(eq(cityInfo.key, 'festival_end'))
      .get();
    if (startRow?.contentEn) festivalStart = startRow.contentEn;
    if (endRow?.contentEn) festivalEnd = endRow.contentEn;

 const [sy, sm, sd] = festivalStart.split('-').map(Number);
    const [ey, em, ed] = festivalEnd.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);
    const endDate = new Date(ey, em - 1, ed);

    // const startDate = new Date(festivalStart);
    // const endDate = new Date(festivalEnd);
    const days: number[] = [];
    for (let d = new SvelteDate(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(d.getDate());
    }
    festivalDays = days;
    await loadMonthEvents();
  });

  async function loadMonthEvents() {
    const db = await getLocalDB();
    if (!db) return;
    monthEvents = await db
      .select()
      .from(events)
      .where(and(gte(events.date, festivalStart), lte(events.date, festivalEnd)))
      .orderBy(events.date)
      .all();
  }

  async function selectDay(day: number) {
    const dateStr = `${festivalStart.slice(0, 8)}${day.toString().padStart(2, '0')}`;
    selectedDate = dateStr;
    const db = await getLocalDB();
    if (!db) return;
    dayEvents = await db
      .select()
      .from(events)
      .where(eq(events.date, dateStr))
      .orderBy(events.date)
      .all();
  }

  function getDayEventCount(day: number): number {
    const dateStr = `${festivalStart.slice(0, 8)}${day.toString().padStart(2, '0')}`;
    return monthEvents.filter((e) => e.date === dateStr).length;
  }
</script>

<div class="bg-card-white rounded-2xl p-4 border border-border-light">
  <h2 class="text-xl font-semibold mb-1">📅 Kalandriye Festen ST MICHEL la</h2>
  <p class="text-sm text-text-muted mb-3">{festivalStart.slice(5)} – {festivalEnd.slice(5)}</p>
  <div class="grid grid-cols-7 gap-1">
    {#each festivalDays as day (day.toString())}
      {@const count = getDayEventCount(day)}
      {@const dateStr = `${festivalStart.slice(0, 8)}${day.toString().padStart(2, '0')}`}
      <button
        class="aspect-square rounded-xl border {count > 0
          ? 'border-haiti-blue bg-blue-50/30'
          : 'border-border-light'} flex flex-col items-center justify-center {selectedDate ===
        dateStr
          ? 'bg-haiti-blue text-white'
          : ''}"
        onclick={() => selectDay(day)}
      >
        <span class="text-lg font-bold">{day}</span>
        {#if count > 0}
          <span class="text-xs {selectedDate === dateStr ? 'text-white' : 'text-haiti-red'}">
            {count}
          </span>
        {/if}
      </button>
    {/each}
  </div>
  {#if selectedDate}
    <div class="mt-4 pt-3 border-t border-border-light">
      <h3 class="font-semibold mb-2">
       {(() => {
         const [y, m, d] = selectedDate.split('-').map(Number);
         return new Date(y, m - 1, d).toLocaleDateString('ht-HT', {
           weekday: 'long',
           day: 'numeric',
           month: 'long'
         });
       })()}
      </h3>
      {#if dayEvents.length}
        <div class="space-y-2">
          {#each dayEvents as ev (ev.id)}
            <div
              class="p-2 bg-smoke-white rounded-lg cursor-pointer"
              onclick={() => navigateToEvent(ev.slug)}
              onkeydown={(e) => e.key === 'Enter' && navigateToEvent(ev.slug)}
              role="button"
              tabindex="0"
            >
              <span class="font-medium">{ev.title}</span>
              <span class="text-xs text-text-muted ml-2">{ev.time || 'Tout jounen'}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-text-muted text-sm">Pa gen evènman pwograme.</p>
      {/if}
    </div>
  {/if}
</div>
