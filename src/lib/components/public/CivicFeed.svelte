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

<script lang="ts">
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
</div>