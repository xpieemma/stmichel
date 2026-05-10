<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocalDB } from '$lib/db/client';
  import { events } from '$lib/db/schema';
  import { and, gte, lte, eq } from 'drizzle-orm';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { slide, fade } from 'svelte/transition';
  
  const WEEKDAYS = ['Dim', 'Lin', 'Mar', 'Mèk', 'Jed', 'Van', 'Sam'];
  const TODAY = new Date();
  const TODAY_STR = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`;

  // --- State ---
  let currentYear = $state(TODAY.getFullYear());
  let currentMonth = $state(TODAY.getMonth());
  let selectedDate = $state<string | null>(null); // Start null to hide agenda
  
  let dayEvents = $state<any[]>([]);
  let monthEvents = $state<any[]>([]);

  // --- Logic ---
  const calendarGrid = $derived.by(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    return {
      blanks: Array.from({ length: firstDayIndex }, (_, i) => i),
      days: Array.from({ length: lastDay }, (_, i) => ({
        day: i + 1,
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
      }))
    };
  });

  const eventLookup = $derived(
    monthEvents.reduce((acc, ev) => {
      if (!acc[ev.date]) acc[ev.date] = [];
      acc[ev.date].push(ev);
      return acc;
    }, {} as Record<string, any[]>)
  );

  const displayMonthYear = $derived(
    new Date(currentYear, currentMonth).toLocaleDateString('ht-HT', { month: 'long', year: 'numeric' })
  );

  const selectedDateLabel = $derived.by(() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('ht-HT', { weekday: 'long', day: 'numeric' });
  });

  // --- Actions ---
  async function loadMonthData() {
    const db = await getLocalDB();
    if (!db) return;
    const start = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const end = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`;
    
    monthEvents = await db.select().from(events)
      .where(and(gte(events.date, start), lte(events.date, end)))
      .orderBy(events.date).all();
  }

  async function handleSelect(dateStr: string) {
    if (selectedDate === dateStr) {
      selectedDate = null; // Toggle off if clicked again
      return;
    }
    selectedDate = dateStr;
    const db = await getLocalDB();
    if (!db) return;
    dayEvents = await db.select().from(events).where(eq(events.date, dateStr)).all();
  }

  function shiftMonth(offset: number) {
    const d = new Date(currentYear, currentMonth + offset, 1);
    currentYear = d.getFullYear();
    currentMonth = d.getMonth();
    selectedDate = null;
    loadMonthData();
  }

  onMount(loadMonthData);
</script>

<div class="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
  
  <!-- Header -->
  <div class="p-8 pb-6 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-2xl drop-shadow-sm">📅</span>
      <h2 class="text-2xl font-serif font-bold text-slate-800 capitalize tracking-tight leading-none">
        {displayMonthYear}
      </h2>
    </div>
    
    <div class="flex gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
      <button onclick={() => shiftMonth(-1)} class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white transition-all text-slate-400">&lsaquo;</button>
      <button onclick={() => shiftMonth(1)} class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white transition-all text-slate-400">&rsaquo;</button>
    </div>
  </div>

  <!-- Grid -->
  <div class="px-6 pb-6">
    <div class="grid grid-cols-7 mb-4">
      {#each WEEKDAYS as day (day)}
        <div class="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">{day}</div>
      {/each}
    </div>

    <div class="grid grid-cols-7 gap-2">
      {#each calendarGrid.blanks as _, index (index)}
        <div class="aspect-square"></div>
      {/each}

      {#each calendarGrid.days as { day, dateStr } (dateStr)}
        {@const count = eventLookup[dateStr]?.length || 0}
        {@const isSelected = selectedDate === dateStr}
        {@const isToday = TODAY_STR === dateStr}
        
        <button
          onclick={() => handleSelect(dateStr)}
          class="group relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-300
            {isSelected ? 'bg-slate-900 text-white shadow-lg scale-110 z-10' : 'hover:bg-slate-50 text-slate-600'}
            {isToday && !isSelected ? 'text-blue-600 font-black' : ''}"
        >
          <span class="text-sm font-bold">{day}</span>
          {#if count > 0}
            <div class="absolute bottom-2 flex gap-0.5">
              <div class="w-1 h-1 rounded-full {isSelected ? 'bg-blue-400' : 'bg-blue-500'}"></div>
            </div>
          {/if}
          {#if isToday && !isSelected}
            <div class="absolute top-2 right-2 w-1 h-1 bg-blue-500 rounded-full"></div>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Smart Agenda: Extends only on Selection -->
  {#if selectedDate}
    <div 
      transition:slide={{ duration: 400 }} 
      class="bg-slate-50 border-t border-slate-100"
    >
      <div class="p-8 pt-6 space-y-5" in:fade={{ delay: 200 }}>
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ajanda</h3>
            <span class="text-sm font-bold text-slate-800 capitalize">{selectedDateLabel}</span>
          </div>
          <button 
            onclick={() => selectedDate = null}
            class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm transition-all"
          >
            &times;
          </button>
        </div>

        <div class="space-y-3">
          {#each dayEvents as ev (ev.id)}
            <button
              onclick={() => goto(resolve(`/event/${ev.slug}`))}
              class="w-full group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div class="flex items-center gap-4 text-left">
                <div class="w-1 h-6 rounded-full bg-blue-500 group-hover:scale-y-125 transition-transform"></div>
                <div>
                  <p class="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors leading-tight">{ev.title}</p>
                  <p class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{ev.time || 'Tout jounen'}</p>
                </div>
              </div>
              <span class="text-slate-300 group-hover:text-blue-500 transition-all">&rarr;</span>
            </button>
          {:else}
            <div class="py-10 text-center opacity-40">
              <p class="text-[11px] font-bold text-slate-400 italic">Pa gen evènman pwograme...</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>

  :global(body) { font-family: 'Inter', sans-serif; }
  .font-serif { font-family: 'DM Serif Display', serif; }
</style>