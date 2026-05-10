<!-- src/lib/components/public/CivicFeed.svelte -->
<!-- <script lang="ts"> 
// import { resolve } from '$app/paths';
//   type Event = {
//     id: number;
//     slug: string;
//     title: string;
//     description: string;
//     date: string;       // 'YYYY-MM-DD'
//     time?: string;
//     location?: string;
//     imageUrl?: string;
//   };

//   let { events = [] }: { events: Event[] } = $props();

//   // today’s date string in local time (YYYY-MM-DD)
//   let todayStr = $derived(new Date().toISOString().slice(0, 10));

//   // filter out past events (date < today)
//   let upcoming = $derived(events.filter(e => e.date >= todayStr));

//   // group by date, sorted ascending
//   let grouped = $derived.by(upcoming, me => me.date, (date, group) => ({ date, items: group.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')) }));
//   let groups = $derived(Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date)));

//   function formatDateParts(dateStr: string) {
//     const d = new Date(dateStr + 'T00:00:00'); // avoid timezone shifts
//     const weekdays = ['Dim', 'Len', 'Mad', 'Mèk', 'Jed', 'Van', 'Sam'];
//     const months = ['Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen', 'Jiyè', 'Out', 'Sep', 'Okt', 'Nov', 'Des'];
//     return {
//       month: months[d.getMonth()],
//       day: d.getDate(),
//       weekday: weekdays[d.getDay()],
//       date: dateStr
//     };
//   }
// </script>

// <div class="space-y-6">
//   {#each groups as group (group.date)}
//     <div class="bg-card-white rounded-3xl p-4 border border-border-light shadow-sm">
//       <div class="flex items-center gap-4 mb-3">
//         <!-- Sports-style calendar badge -->
<!-- //         <div class="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-smoke-white border border-border-light">
//           <span class="text-xs font-semibold uppercase text-text-muted">{formatDateParts(group.date).month}</span>
//           <span class="text-2xl font-bold text-haiti-blue">{formatDateParts(group.date).day}</span>
//           <span class="text-[10px] font-medium text-text-secondary">{formatDateParts(group.date).weekday}</span>
//         </div>
//         <div>
//           <h2 class="text-lg font-semibold">{new Date(group.date).toLocaleDateString('ht-HT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
//           <p class="text-sm text-text-muted">{group.items.length} evènman{group.items.length > 1 ? '' : ''}</p>
//         </div>
//       </div>
//       <div class="space-y-3">
//         {#each group.items as event (event.id)}
//           <a href={resolve(`/event/${event.slug}`)} class="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-smoke-white transition-colors no-underline text-text-primary">
//             {#if event.imageUrl}
//               <img src={event.imageUrl} alt="" class="w-12 h-12 rounded-lg object-cover shrink-0" />
//             {:else}
//               <div class="w-12 h-12 rounded-lg bg-smoke-white flex items-center justify-center text-lg shrink-0">🎉</div>
//             {/if}
//             <div class="min-w-0">
//               <h3 class="font-medium truncate">{event.title}</h3>
//               <p class="text-sm text-text-secondary truncate">
//                 {event.time ? event.time + ' ' : ''}{event.location ?? ''}
//               </p>
//             </div>
//           </a>
//         {/each}
//       </div>
//     </div>
//   {:else}
//     <p class="text-center text-text-muted py-10">Pa gen evènman pwograme.</p>
//   {/each}
// </div> -->

<!-- <script lang="ts">
  import { resolve } from '$app/paths';
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  type Event = {
    id: number;
    slug: string;
    title: string;
    description: string;
    date: string;       // 'YYYY-MM-DD'
    time?: string;
    location?: string;
    imageUrl?: string;
  };

  let { events = [] }: { events: Event[] } = $props();

  // today’s date string in local time (YYYY-MM-DD)
  let todayStr = $derived(new Date().toISOString().slice(0, 10));

  // filter out past events
  let upcoming = $derived(events.filter(e => e.date >= todayStr));

  // FIXED: $derived.by strictly takes one function block.
  let groups = $derived.by(() => {
    const map = new Map<string, Event[]>();
    for (const e of upcoming) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    
    // Sort items within each date, then sort the dates themselves
    const groupedArray = Array.from(map.entries()).map(([date, items]) => ({
      date,
      items: items.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
    }));

    return groupedArray.sort((a, b) => a.date.localeCompare(b.date));
  });

  function formatDateParts(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00'); // avoid timezone shifts
    const weekdays = ['Dim', 'Len', 'Mad', 'Mèk', 'Jed', 'Van', 'Sam'];
    const months = ['Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen', 'Jiyè', 'Out', 'Sep', 'Okt', 'Nov', 'Des'];
    return {
      month: months[d.getMonth()],
      day: d.getDate(),
      weekday: weekdays[d.getDay()],
      date: dateStr
    };
  }
</script>

<div class="space-y-6">
  {#each groups as group (group.date)}
    <div animate:flip={{ duration: 300 }} class="bg-card-white rounded-3xl p-4 border border-border-light shadow-sm">
      <div class="flex items-center gap-4 mb-3">
        <div class="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-smoke-white border border-border-light">
          <span class="text-xs font-semibold uppercase text-text-muted">{formatDateParts(group.date).month}</span>
          <span class="text-2xl font-bold text-haiti-blue">{formatDateParts(group.date).day}</span>
          <span class="text-[10px] font-medium text-text-secondary">{formatDateParts(group.date).weekday}</span>
        </div>
        <div>
          <h2 class="text-lg font-semibold">{new Date(group.date + 'T00:00:00').toLocaleDateString('ht-HT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
          <p class="text-sm text-text-muted">{group.items.length} evènman{group.items.length > 1 ? 's' : ''}</p>
        </div>
      </div>
      <div class="space-y-3">
        {#each group.items as event (event.id)}
          <a href={resolve(`/event/${event.slug}`)} 
             animate:flip={{ duration: 300 }} 
             in:fly={{ y: 20, duration: 300 }} 
             out:fade={{ duration: 150 }}
             class="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-smoke-white transition-colors no-underline text-text-primary block">
            {#if event.imageUrl}
              <img src={event.imageUrl} alt="" class="w-12 h-12 rounded-lg object-cover shrink-0" />
            {:else}
              <div class="w-12 h-12 rounded-lg bg-smoke-white flex items-center justify-center text-lg shrink-0">🏛️</div>
            {/if}
            <div class="min-w-0">
              <h3 class="font-medium truncate">{event.title}</h3>
              <p class="text-sm text-text-secondary truncate">
                {event.time ? event.time + ' ' : ''}{event.location ?? ''}
              </p>
            </div>
          </a>
        {/each}
      </div>
    </div>
  {:else}
    <p class="text-center text-text-muted py-10">Pa gen evènman pwograme.</p>
  {/each}
</div> -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { backOut } from 'svelte/easing';

  type Event = {
    id: number;
    slug: string;
    title: string;
    description: string;
    date: string;       // 'YYYY-MM-DD'
    time?: string;
    location?: string;
    imageUrl?: string;
  };

  let { events = [] }: { events: Event[] } = $props();

  // Today’s date string in local time (YYYY-MM-DD)
  let todayStr = $derived(new Date().toISOString().slice(0, 10));

  // Filter out past events
  let upcoming = $derived(events.filter(e => e.date >= todayStr));

  // Group and sort
  let groups = $derived.by(() => {
    const map = new Map<string, Event[]>();
    for (const e of upcoming) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    
    const groupedArray = Array.from(map.entries()).map(([date, items]) => ({
      date,
      items: items.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
    }));

    return groupedArray.sort((a, b) => a.date.localeCompare(b.date));
  });

  function formatDateParts(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00'); 
    const weekdays = ['Dim', 'Len', 'Mad', 'Mèk', 'Jed', 'Van', 'Sam'];
    const months = ['Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen', 'Jiyè', 'Out', 'Sep', 'Okt', 'Nov', 'Des'];
    return {
      month: months[d.getMonth()],
      day: d.getDate(),
      weekday: weekdays[d.getDay()],
      date: dateStr
    };
  }
</script>

<div class="space-y-8">
  {#each groups as group (group.date)}
    {@const isToday = group.date === todayStr}
    {@const parts = formatDateParts(group.date)}
    
    <div 
      animate:flip={{ duration: 400, easing: backOut }} 
      class="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50 transition-all duration-300"
    >
      <!-- Premium Group Header -->
      <div class="border-b border-slate-100 bg-slate-50/50 p-6 sm:px-8">
        <div class="flex items-center gap-5">
          
          <!-- Editorial Calendar Badge -->
          <div class="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[1.25rem] border bg-white shadow-sm transition-colors duration-300
                      {isToday ? 'border-red-100 shadow-red-500/10' : 'border-slate-200'}">
            <span class="font-sans text-[9px] font-black uppercase tracking-widest {isToday ? 'text-red-500' : 'text-slate-400'}">
              {parts.month}
            </span>
            <span class="font-serif text-[26px] font-bold leading-none {isToday ? 'text-red-600' : 'text-blue-600'}">
              {parts.day}
            </span>
            <span class="font-sans text-[8px] font-bold uppercase tracking-wider text-slate-400">
              {parts.weekday}
            </span>
          </div>
          
          <!-- Date Title & Count -->
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-serif text-xl font-bold capitalize text-slate-900 sm:text-2xl">
                {isToday ? 'Jodi a' : new Date(group.date + 'T00:00:00').toLocaleDateString('ht-HT', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              {#if isToday}
                <!-- Live Pulse Dot for Today -->
                <span class="relative flex h-2 w-2">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                </span>
              {/if}
            </div>
            <p class="mt-1 font-sans text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              {group.items.length} {group.items.length > 1 ? 'Evènman' : 'Evènman'}
            </p>
          </div>
        </div>
      </div>

      <!-- Events List -->
      <div class="p-4 sm:p-6">
        <div class="space-y-2">
          {#each group.items as event (event.id)}
            <a 
              href={resolve(`/event/${event.slug}`)} 
              animate:flip={{ duration: 400, easing: backOut }} 
              in:fly={{ y: 20, duration: 400, easing: backOut }} 
              out:fade={{ duration: 200 }}
              class="group flex items-center justify-between gap-4 rounded-[1.5rem] border border-transparent p-3 transition-all duration-300 hover:border-slate-100 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
            >
              <div class="flex items-center gap-4 min-w-0">
                <!-- Avatar / Image -->
                {#if event.imageUrl}
                  <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-[1rem] bg-slate-100">
                    <img src={event.imageUrl} alt={event.title} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div class="absolute inset-0 rounded-[1rem] ring-1 ring-inset ring-black/5"></div>
                  </div>
                {:else}
                  <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] border border-slate-100 bg-white text-2xl shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:bg-slate-50">
                    🏛️
                  </div>
                {/if}
                
                <!-- Event Data -->
                <div class="min-w-0 flex-1">
                  <h3 class="truncate font-serif text-[17px] font-bold leading-tight text-slate-800 transition-colors group-hover:text-blue-600">
                    {event.title}
                  </h3>
                  <div class="mt-1 flex items-center gap-1.5">
                    <span class="font-sans text-[10px] font-black uppercase tracking-wider text-blue-500">
                      {event.time || 'Tout jounen'}
                    </span>
                    {#if event.location}
                      <span class="text-slate-300">•</span>
                      <span class="truncate font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {event.location}
                      </span>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Action Indicator -->
              <div class="pr-2 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-500">
                &rsaquo;
              </div>
            </a>
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <!-- Elegant Empty State -->
    <div class="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center transition-all">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
        🕊️
      </div>
      <h3 class="font-serif text-xl font-bold text-slate-700">Poko gen anyen</h3>
      <p class="mt-2 font-sans text-[11px] font-bold uppercase tracking-widest text-slate-400">
        Pa gen evènman pwograme.
      </p>
    </div>
  {/each}
</div>

<style>
 

  :global(.font-serif) { font-family: 'DM Serif Display', serif; }
  :global(.font-sans) { font-family: 'Inter', sans-serif; }
</style>