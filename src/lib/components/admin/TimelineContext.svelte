<script lang="ts">
  // Props
  let {
    date,
    startTime,
    endTime = '',
    otherEvents = []
  }: {
    date: string;
    startTime: string;
    endTime?: string;
    otherEvents?: Array<{
      title: string;
      startTime: string;
      endTime: string;
    }>;
  } = $props();

  const START_HOUR = 6;        // 6:00 AM
  const END_HOUR = 24;         // midnight next day
  const SLOT_MINUTES = 30;
  const GRID_COLUMNS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

  /**
   * Convert HH:mm to column index (0-based).
   * Returns -1 if invalid.
   */
  function timeToColumn(time: string): number {
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return -1;
    const totalMinutes = (h - START_HOUR) * 60 + m;
    if (totalMinutes < 0) return -1;
    return Math.floor(totalMinutes / SLOT_MINUTES);
  }

  // Derived columns for the active event
  let activeStartCol = $derived(timeToColumn(startTime));
  let activeEndCol = $derived(endTime ? timeToColumn(endTime) : activeStartCol + 2); // default 1 hour

  // Generate time labels
  let timeSlots = $state<string[]>([]);
  $: {
    const slots: string[] = [];
    for (let i = 0; i < GRID_COLUMNS; i++) {
      const totalMinutes = (START_HOUR * 60) + i * SLOT_MINUTES;
      const h = Math.floor(totalMinutes / 60) % 24;
      const m = totalMinutes % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
    timeSlots = slots;
  }

  // Derived collision detection
  let collisions = $derived(
    otherEvents.filter(ev => {
      const s = timeToColumn(ev.startTime);
      const e = timeToColumn(ev.endTime);
      return s >= 0 && e >= s &&
             activeStartCol < e && activeEndCol > s;
    })
  );
  let hasCollision = $derived(collisions.length > 0);
</script>

<div class="bg-card-white rounded-2xl p-4 border border-border-light overflow-x-auto">
  <h3 class="text-lg font-semibold mb-2">🗓️ Vizyalizasyon Orè {date}</h3>

  <!-- Timeline grid -->
  <div class="grid gap-0" style="grid-template-columns: repeat({GRID_COLUMNS}, minmax(24px, 1fr));">
    <!-- Time labels row -->
    {#each timeSlots as slot, i (i)}
      <div class="text-[10px] text-text-muted text-center border-r border-gray-200 pb-1">
        {slot}
      </div>
    {/each}

    <!-- Static other events (as muted blocks) -->
    {#each otherEvents as ev (ev.title + ev.startTime)}
      {@const sCol = timeToColumn(ev.startTime)}
      {@const eCol = timeToColumn(ev.endTime)}
      {#if sCol >= 0 && eCol >= sCol}
        <div
          class="h-8 rounded bg-gray-200 border border-gray-300 text-xs px-1 truncate flex items-center"
          style="grid-column-start: {sCol + 1}; grid-column-end: {eCol + 1};"
          title={ev.title}
        >
          {ev.title}
        </div>
      {/if}
    {/each}

    <!-- Active event (editable) block -->
    {#if activeStartCol >= 0 && activeEndCol >= activeStartCol}
      <div
        class="h-8 rounded border-2 text-xs font-semibold text-white px-1 truncate flex items-center relative {hasCollision ? 'bg-haiti-red border-red-700' : 'bg-haiti-blue border-blue-700'}"
        style="grid-column-start: {activeStartCol + 1}; grid-column-end: {activeEndCol + 1}; margin-top: 4px;"
      >
        Evènman sa a
        {#if hasCollision}
          <span class="absolute -top-2 -right-2 text-[10px] bg-yellow-300 text-black px-1 rounded">⚠️ Kolizyon</span>
        {/if}
      </div>
    {/if}
  </div>

  {#if hasCollision}
    <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-haiti-red">
      ⚠️ Kolizyon avèk: {collisions.map(c => c.title).join(', ')}
    </div>
  {/if}
</div>