<!-- src/lib/components/public/VerticalTicker.svelte -->
<script lang="ts">
  import { resolve } from '$app/paths';
  type Event = {
    id: number;
    slug: string;
    title: string;
    date: string;       // 'YYYY-MM-DD'
    time?: string;
    location?: string;
  };

  let { items = [] }: { items: Event[] } = $props();

  // duplicate the items for seamless looping
  let doubled = $derived([...items, ...items]);
</script>

<div class="relative bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm" style="height: 160px;">
  <div class="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent z-10"></div>
  <div class="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent z-10"></div>
  <div class="h-full overflow-hidden group">
    <div class="animate-ticker p-4 space-y-3 group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused]">
      {#each doubled as item, idx (idx)}
        <a href={resolve(`/event/${item.slug}`)} class="flex items-center gap-3 no-underline text-text-primary hover:bg-smoke-white rounded-lg p-2 transition-colors">
          <span class="w-2 h-2 rounded-full {item.date === new Date().toISOString().slice(0,10) ? 'bg-haiti-red' : 'bg-haiti-blue'}"></span>
          <div class="min-w-0">
            <p class="font-medium text-sm truncate">{item.title}</p>
            <p class="text-xs text-text-muted">{item.date} {item.time ?? ''} {item.location ? '@ ' + item.location : ''}</p>
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>

<style>
  @keyframes ticker {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  .animate-ticker {
    animation: ticker 20s linear infinite;
  }
  .group:hover .animate-ticker,
  .group:active .animate-ticker {
    animation-play-state: paused;
  }
</style>