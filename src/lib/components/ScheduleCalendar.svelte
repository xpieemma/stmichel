
<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocalDB } from '$lib/db/client';
  import { events } from '$lib/db/schema';
  import { and, gte, lte, eq } from 'drizzle-orm';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  
  // 1. Nou defini ane ak mwa n ap gade a (pa defo ane ak mwa jodi a)
  let now = new Date();
  let currentYear = $state(now.getFullYear());
  let currentMonth = $state(now.getMonth()); // 0 = Janvye, 11 = Desanm

  let selectedDate = $state<string | null>(null);
  let dayEvents = $state<any[]>([]);
  let monthEvents = $state<any[]>([]);
  let daysInMonth = $state<number[]>([]);

  // Function from old code needed for click events
  function navigateToEvent(slug: string) {
    goto(resolve(`/event/${slug}`));
  }

  // 2. Jenere jou yo pou mwa ak ane ki chwazi a
  function generateCalendar() {
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    daysInMonth = Array.from({ length: lastDay }, (_, i) => i + 1);
  }

  onMount(async () => {
    generateCalendar();
    await loadMonthEvents();
  });

  async function loadMonthEvents() {
    const db = await getLocalDB();
    if (!db) return;

    // Kreye string pou kòmansman ak fen mwa a (YYYY-MM-DD)
    const monthStart = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthEnd = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    monthEvents = await db
      .select()
      .from(events)
      .where(and(gte(events.date, monthStart), lte(events.date, monthEnd)))
      .orderBy(events.date)
      .all();
  }

  async function selectDay(day: number) {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
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
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return monthEvents.filter((e) => e.date === dateStr).length;
  }

  // Fonksyon pou chanje mwa
  async function changeMonth(offset: number) {
    let newDate = new Date(currentYear, currentMonth + offset, 1);
    currentYear = newDate.getFullYear();
    currentMonth = newDate.getMonth();
    generateCalendar();
    await loadMonthEvents();
    selectedDate = null;
  }

  // Helper to display the current month nicely
  let displayMonthYear = $derived(
    new Date(currentYear, currentMonth).toLocaleDateString('ht-HT', { month: 'long', year: 'numeric' })
  );
</script>

<div class="bg-card-white rounded-2xl p-4 border border-border-light">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold">📅 Kalandriye Evènman</h2>
    
    <div class="flex items-center space-x-2 text-sm">
      <button 
        class="p-2 bg-smoke-white rounded-lg hover:bg-border-light transition" 
        onclick={() => changeMonth(-1)}>
        &larr;
      </button>
      <span class="font-medium text-text-primary capitalize">{displayMonthYear}</span>
      <button 
        class="p-2 bg-smoke-white rounded-lg hover:bg-border-light transition" 
        onclick={() => changeMonth(1)}>
        &rarr;
      </button>
    </div>
  </div>

  <div class="grid grid-cols-7 gap-1">
    {#each daysInMonth as day (day.toString())}
      {@const count = getDayEventCount(day)}
      {@const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`}
      
      <button
        class="aspect-square rounded-xl border {count > 0
          ? 'border-haiti-blue bg-blue-50/30'
          : 'border-border-light'} flex flex-col items-center justify-center {selectedDate === dateStr
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
      <h3 class="font-semibold mb-2 capitalize">
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