


<script lang="ts">
  let { feedItems = [] } = $props();
  
  let items = $derived(feedItems.length > 0 
    ? feedItems 
    : [
        { id: 'f1', msg: "Byenveni Sen Michèl! 🌴", user_name: "VIBE", avatar: "🎉" },
        { id: 'f2', msg: "Bonjou nan bouk! 🌴", user_name: "888", avatar: "💕" },
        { id: 'f3', msg: "Nap boule! 🔥", user_name: "STAFF", avatar: "🛡️" }
      ]
  );

  // Seamless duplication
  let displayItems = $derived([
    ...items.map(it => ({ ...it, uniqueKey: `${it.id}-a` })),
    ...items.map(it => ({ ...it, uniqueKey: `${it.id}-b` }))
  ]);
</script>

<div class="relative mx-4 mt-4 overflow-hidden rounded-full border border-white/20 bg-red-600 py-3 shadow-xl shadow-red-900/30">
  
  <!-- Fixed Badge -->
  <div class="absolute left-0 top-0 bottom-0 z-20 flex items-center bg-red-600 pl-5 pr-10 [mask-image:linear-gradient(to_right,black_70%,transparent)]">
    <div class="mr-2 flex h-2 w-2 items-center justify-center">
      <span class="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-blue-400 opacity-75"></span>
      <span class="relative inline-flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
    </div>
    <span class="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">Live Pulse</span>
  </div>

  <!-- THE MOVEMENT -->
  <div class="marquee-container flex whitespace-nowrap">
    <div class="marquee-content flex items-center gap-12 pl-[140px]">
      {#each displayItems as item (item.uniqueKey)}
        <div class="group flex items-center gap-3 transition-transform active:scale-95 cursor-pointer">
          <div class="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-lg shadow-inner">
            {item.avatar || '🔥'}
          </div>
          <div class="flex flex-col leading-none">
            <div class="flex items-baseline gap-1.5">
              <span class="font-serif text-[14px] font-bold text-white tracking-wide">{item.user_name}</span>
              <span class="font-sans text-[12px] font-medium text-white/90">{item.msg}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>


  .font-serif { font-family: 'DM Serif Display', serif; }
  .font-sans { font-family: 'Inter', sans-serif; }

  /* Guaranteed Movement Logic */
  .marquee-container {
    width: 100%;
    display: flex;
    overflow: hidden;
  }

  .marquee-content {
    display: flex;
    white-space: nowrap;
    animation: scroll 20s linear infinite;
  }

  .marquee-content:hover {
    animation-play-state: paused;
  }

  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
</style>