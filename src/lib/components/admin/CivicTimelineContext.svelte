<script lang="ts">
  type CivicEvent = {
    title: string;
    startTime: string;
    endTime: string;
    category: 'community' | 'public_works' | 'transit' | 'emergency';
  };

  let {
    date,
    startTime = '',
    endTime = '',
    otherEvents = []
  }: {
    date: string;
    startTime?: string;
    endTime?: string;
    otherEvents?: CivicEvent[];
  } = $props();

  const START_HOUR = 6;
  const END_HOUR = 24;
  const SLOT_MINUTES = 30;
  const GRID_COLUMNS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

  const categoryColors: Record<string, string> = {
    community: 'bg-haiti-blue border-blue-700',
    public_works: 'bg-gray-500 border-gray-700',
    transit: 'bg-yellow-600 border-yellow-800',
    emergency: 'bg-haiti-red border-red-700'
  };

  function timeToColumn(time: string): number {
    if (!time) return -1; // Safety check in case of empty input
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return -1;
    const totalMinutes = (h - START_HOUR) * 60 + m;
    return totalMinutes < 0 ? -1 : Math.floor(totalMinutes / SLOT_MINUTES);
  }

  let activeStartCol = $derived(timeToColumn(startTime));
  let activeEndCol = $derived(endTime ? timeToColumn(endTime) : activeStartCol + 2);

  // ✅ FIXED: Statically initialize timeSlots since they never change. 
  // No need for $: or $state.
  const timeSlots = Array.from({ length: GRID_COLUMNS }, (_, i) => {
    const totalMinutes = (START_HOUR * 60) + i * SLOT_MINUTES;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  });

  // Cross-domain collisions: active event overlaps with any other event
  let collisions = $derived(
    otherEvents.filter(ev => {
      const s = timeToColumn(ev.startTime);
      const e = timeToColumn(ev.endTime);
      return s >= 0 && e >= s && activeStartCol < e && activeEndCol > s;
    })
  );
  
  let hasCollision = $derived(collisions.length > 0);
</script>

<div class="bg-card-white rounded-2xl p-4 border border-border-light overflow-x-auto shadow-sm">
  <h3 class="text-lg font-semibold mb-4">🏙️ Vizyalizasyon Sivik {date}</h3>

  <div class="grid gap-y-1" style="grid-template-columns: repeat({GRID_COLUMNS}, minmax(32px, 1fr));">
    {#each timeSlots as slot (slot)}
      <div class="text-[10px] text-text-muted text-center border-r border-border-light pb-2">
        {slot}
      </div>
    {/each}

    {#each otherEvents as ev (ev.title + ev.startTime)}
      {@const sCol = timeToColumn(ev.startTime)}
      {@const eCol = timeToColumn(ev.endTime)}
      {#if sCol >= 0 && eCol >= sCol}
        <div
          class="h-7 rounded border text-[10px] text-white px-1.5 truncate flex items-center shadow-sm {categoryColors[ev.category] ?? 'bg-gray-400'}"
          style="grid-column-start: {sCol + 1}; grid-column-end: {eCol + 1};"
          title="{ev.title} ({ev.category})"
        >
          {ev.title}
        </div>
      {/if}
    {/each}

    {#if activeStartCol >= 0 && activeEndCol > activeStartCol}
      <div
        class="h-7 rounded border-2 text-[10px] font-semibold text-white px-1.5 truncate flex items-center relative transition-colors shadow-sm {hasCollision ? 'bg-haiti-red border-red-700 warning-stripes z-10' : 'bg-haiti-blue border-blue-700 z-10'}"
        style="grid-column-start: {activeStartCol + 1}; grid-column-end: {activeEndCol + 1}; margin-top: 2px;"
      >
        Evènman sa a
        {#if hasCollision}
          <span class="absolute -top-3 -right-2 text-[9px] bg-yellow-300 text-yellow-900 font-bold px-1.5 py-0.5 rounded shadow">⚠️ Konfli</span>
        {/if}
      </div>
    {/if}
  </div>

  {#if hasCollision}
    <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-haiti-red">
      <div class="flex items-start gap-2">
        <span class="text-lg leading-none">⚠️</span>
        <div>
          <span class="font-semibold block mb-1">Konfli sivik avèk:</span>
          <ul class="list-disc list-inside text-xs space-y-1">
            {#each collisions as c (c.title + c.startTime)}
              <li><strong>{c.title}</strong> <span class="opacity-75">({c.category})</span> – {c.startTime} a {c.endTime}</li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .warning-stripes {
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 5px,
      rgba(255,255,255,0.2) 5px,
      rgba(255,255,255,0.2) 10px
    );
  }
</style>