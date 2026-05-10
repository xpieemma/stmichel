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
    otherEvents = [] as CivicEvent[]
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
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return -1;
    const totalMinutes = (h - START_HOUR) * 60 + m;
    return totalMinutes < 0 ? -1 : Math.floor(totalMinutes / SLOT_MINUTES);
  }

  let activeStartCol = $derived(timeToColumn(startTime));
  let activeEndCol = $derived(endTime ? timeToColumn(endTime) : activeStartCol + 2);

  let timeSlots = $derived(
  Array.from({ length: GRID_COLUMNS }, (_, i) => {
    const totalMinutes = (START_HOUR * 60) + i * SLOT_MINUTES;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  })
);

  // Cross‑domain collisions: active event overlaps with any other event
  let collisions = $derived(
    otherEvents.filter(ev => {
      const s = timeToColumn(ev.startTime);
      const e = timeToColumn(ev.endTime);
      return s >= 0 && e >= s && activeStartCol < e && activeEndCol > s;
    })
  );
  let hasCollision = $derived(collisions.length > 0);
</script>

<div class="bg-card-white rounded-2xl p-4 border border-border-light overflow-x-auto">
  <h3 class="text-lg font-semibold mb-2">🏙️ Vizyalizasyon Sivik {date}</h3>

  <div class="grid gap-0" style="grid-template-columns: repeat({GRID_COLUMNS}, minmax(24px, 1fr));">
    <!-- Time labels -->
    {#each timeSlots as slot, i (i)}
      <div class="text-[10px] text-text-muted text-center border-r border-gray-200 pb-1">
        {slot}
      </div>
    {/each}

    <!-- Other civic events -->
    {#each otherEvents as ev (ev.title + ev.startTime)}
      {@const sCol = timeToColumn(ev.startTime)}
      {@const eCol = timeToColumn(ev.endTime)}
      {#if sCol >= 0 && eCol >= sCol}
        <div
          class="h-8 rounded border text-xs text-white px-1 truncate flex items-center {categoryColors[ev.category] ?? 'bg-gray-400'}"
          style="grid-column-start: {sCol + 1}; grid-column-end: {eCol + 1};"
          title="{ev.title} ({ev.category})"
        >
          {ev.title}
        </div>
      {/if}
    {/each}

    <!-- Active event (editable) -->
    {#if activeStartCol >= 0 && activeEndCol >= activeStartCol}
      <div
        class="h-8 rounded border-2 text-xs font-semibold text-white px-1 truncate flex items-center relative {hasCollision ? 'bg-haiti-red border-red-700 warning-stripes' : 'bg-haiti-blue border-blue-700'}"
        style="grid-column-start: {activeStartCol + 1}; grid-column-end: {activeEndCol + 1}; margin-top: 4px;"
      >
        Evènman sa a
        {#if hasCollision}
          <span class="absolute -top-2 -right-2 text-[10px] bg-yellow-300 text-black px-1 rounded">⚠️ Konfli</span>
        {/if}
      </div>
    {/if}
  </div>

  {#if hasCollision}
    <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-haiti-red">
      ⚠️ Konfli sivik avèk:
      <ul class="list-disc list-inside">
        {#each collisions as c (c.title + c.startTime)}
          <li><strong>{c.title}</strong> ({c.category}) – {c.startTime}-{c.endTime}</li>
        {/each}
      </ul>
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