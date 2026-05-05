<!-- <script lang="ts">
  let { feedItems = [] } = $props();
  
  // Simulated dynamic feed for the "Circle" effect
  let displayItems = $derived([...feedItems, ...feedItems]); // Duplicate for seamless looping
</script>

<div class="relative overflow-hidden bg-haiti-red py-3 border-y border-white/10 shadow-lg">
  <div class="absolute left-0 top-0 bottom-0 z-10 bg-haiti-red px-4 flex items-center shadow-r-xl">
    <span class="flex h-2 w-2 mr-2">
      <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-haiti-blue opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2 w-2 bg-haiti-blue"></span>
    </span>
    <span class="text-[10px] font-black uppercase tracking-tighter text-white">Live Pulse</span>
  </div>

  <div class="flex whitespace-nowrap animate-marquee hover:pause">
    {#each displayItems as item (item.id)}
      <div class="inline-flex items-center mx-8 gap-3">
        <div class="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-lg border border-white/30">
          {item.avatar || '🔥'}
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-bold text-white leading-none">
             {item.user_name || 'Anonyme'} 
             <span class="font-normal text-white/60 ml-1">{item.msg}</span>
          </span>
          <span class="text-[9px] uppercase font-bold text-haiti-red/80">{item.time}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee {
    display: inline-flex;
    animation: marquee 30s linear infinite;
  }
 .marquee-content:hover {
    animation-play-state: paused;
    cursor: pointer;
  }
</style> -->


<script lang="ts">
  // 1. Accept feedItems from the parent
  let { feedItems = [] } = $props();
  
  // 2. Fallback: If the DB is empty, show a welcoming message
  let items = $derived(feedItems.length > 0 
    ? feedItems 
    : [{ id: 'f1', msg: "Byenveni  Sen Michèl! 🌴", user_name: "VIBE", avatar: "🎉" },
      { id: 'f2', msg: "Bon fèt St Michel! 🌴", user_name: "888", avatar: "💕" }
    ]
  );

  // 3. Duplicate for the infinite loop effect
  let displayItems = $derived([...items.map(it => ({ ...it, uniqueKey: `${it.id}-a` })),
  ...items.map(it => ({ ...it, uniqueKey: `${it.id}-b` }))]);
</script>

<div class="mx-4 mt-2 relative overflow-hidden bg-haiti-red py-3 rounded-l-full border border-white/20 shadow-lg min-h-[50px]">
  
  <div class="absolute left-0 top-0 bottom-0 z-10 bg-haiti-red px-4 flex items-center shadow-[10px_0_15px_rgba(0,0,0,0.2)]">
    <span class="flex h-2 w-2 mr-2">
      <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-haiti-blue opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2 w-2 bg-haiti-blue"></span>
    </span>
    <span class="text-[10px] font-black uppercase tracking-tighter text-white">Live Pulse</span>
  </div>

  <div class="flex whitespace-nowrap marquee-content">
    {#each displayItems as item (item.uniqueKey)}
      <div class="inline-flex items-center mx-8 gap-3">
        <div class="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-lg border border-white/30">
          {item.avatar || '🔥'}
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-bold text-white leading-none">
             {item.user_name || 'Anonyme'} 
             <span class="font-normal text-white/80 ml-1">{item.msg}</span>
          </span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .marquee-content {
    display: inline-flex;
    animation: marquee 19s linear infinite;
    padding-left: 100px;
  }
  .marquee-content:hover {
    animation-play-state: paused;
    cursor: pointer;
  }
</style>