
<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocalDB } from '$lib/db/client';
  import { cityInfo, events } from '$lib/db/schema';
  import { and, eq } from 'drizzle-orm';
  import { goto } from '$app/navigation';
 

 let zoomedImage = $state<string | null>(null);

  type Lang = 'fr' | 'ht' | 'es' | 'en';
  let active = $state<Lang>('ht');
  
const defaultLangs: Record<Lang, string> = { fr: '', ht: '', es: '', en: '' };
type HistoryRecord = {
  id: number;
  slug: string;
  title: string;
  imageUrl: string | null;
};

  // 1. UPDATE: Add the new keys from your Rich Content Seed
  let content = $state<Record<string, Record<Lang, string>>>({ 
    overview: { ...defaultLangs }, 
    geography: { ...defaultLangs },
    hydrography: { ...defaultLangs },
    economy: { ...defaultLangs },
    education: { ...defaultLangs },
    health: { ...defaultLangs },
    religion: { ...defaultLangs },
    tourism: { ...defaultLangs },
    culture: { ...defaultLangs },
    communication: { ...defaultLangs },
    administration: { ...defaultLangs },
    '888fest': { ...defaultLangs }
  });
  let images = $state<Record<string, string>>({});
  let histories = $state<HistoryRecord[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const db = await getLocalDB();
    if (db) {
      const rows = await db.select().from(cityInfo).all();
      for (const r of rows) {
        // NOTE: If your text is still blank after this fix, change `r.contentFr` to `r.content_fr` 
        // depending on how you named the properties in your Drizzle schema (camelCase vs snake_case).
        if (content[r.key]) {
          content[r.key] = { 
            fr: r.contentFr || '', 
            ht: r.contentHt || '', 
            es: r.contentEs || '', 
            en: r.contentEn || '' 
          };
          if (r.imageUrl) {
            images[r.key] = r.imageUrl;
          }
        }
      }
      histories = await db.select().from(events).where(and(eq(events.published, 1), eq(events.type, 'history'))).all();
    }
    loading = false;
  });

  const langs = [{ code: 'ht', label: 'Kreyòl' }, { code: 'fr', label: 'Français' }, { code: 'es', label: 'Español' }, { code: 'en', label: 'English' }] as const;
</script>

<svelte:head><title>Saint-Michel de l'Attalaye | Vil la</title></svelte:head>

<div class="space-y-5 pb-20">
  <header class="text-center"><h1 class="text-3xl font-semibold">SM Saint-Michel de l'Attalaye</h1><p class="text-text-muted">Komin nan Latibonit</p></header>

  <div class="flex justify-center gap-2 flex-wrap">
    {#each langs as { code, label } (code)}
      <button class="px-4 py-2 rounded-full border border-border-light {active === code ? 'bg-haiti-blue text-white border-haiti-blue' : 'text-text-secondary'}" onclick={() => active = code}>{label}</button>
    {/each}
  </div>

  {#if loading}
    <p class="text-center py-10 text-text-muted">Chaje enfòmasyon vil la...</p>
  {:else}
    <div class="space-y-4">
      
      <section class="bg-card-white rounded-2xl p-5 border border-border-light shadow-card">
        <h2 class="text-xl font-semibold mb-2">📜 Istwa ak Apèsi</h2>
        <p class="text-text-secondary">{content.overview[active]}</p>
        
        {#if histories.length}
          <div class="mt-4 pt-4 border-t border-border-light">
            <p class="text-sm text-text-muted mb-2">Li plis sou istwa St Michel:</p>
            <div class="flex flex-col gap-2">
              {#each histories as h (h.id)}
                <button
                  type="button"
                  class="text-left bg-smoke-white hover:bg-border-light transition rounded-xl p-3 flex items-center gap-3"
                  onclick={() => goto(`/history/${h.slug}`)}
                >
                  {#if h.imageUrl}<img src={h.imageUrl} alt={h.title} class="w-12 h-12 rounded-lg object-cover shrink-0" />{/if}
                  <span class="font-medium text-text-primary">{h.title}</span>
                  <span class="ml-auto text-text-muted">→</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </section>

      <details class="bg-card-white rounded-2xl border-l-4 border-gray-900 shadow-card group cursor-pointer">
        <summary class="p-5 font-semibold text-xl list-none flex justify-between items-center">
          👤 Administrasyon / Majistra
          <span class="text-border-light transition-transform group-open:rotate-180">▼</span>
        </summary>
        <div class="px-5 pb-5 text-text-secondary">
          
          {#if images['administration']}
            <div class="flex gap-4 overflow-x-auto mb-4 pb-2">
              {#each images['administration'].split(',') as imgUrl, index (index)}
                <img 
                  src={imgUrl.trim()} 
                  alt="Administrasyon" 
                  class="w-15 h-15 object-cover rounded-sm shadow-sm shrink-0" 
                />
              {/each}
            </div>
          {/if}

          <p>{content.administration[active]}</p>
        </div>
      </details>

      <details class="bg-card-white rounded-2xl border border-border-light shadow-card group cursor-pointer">
        <summary class="p-5 font-semibold text-xl list-none flex justify-between items-center">
          🎭 Fèt ak Kilti
          <span class="text-border-light transition-transform group-open:rotate-180">▼</span>
        </summary>
        <div class="px-5 pb-5 text-text-secondary space-y-3">
          {#if images['religion']}<img src={images['religion']} alt="Religion" class="w-full h-48 object-cover rounded-xl mb-3" />{/if}
          <p>{content.religion[active]}</p>
          {#if images['culture']}<img src={images['culture']} alt="Culture" class="w-full h-48 object-cover rounded-xl mb-3" />{/if}
          <p>{content.culture[active]}</p>
          
        </div>
      </details>

      <details class="bg-card-white rounded-2xl border-l-4 border-haiti-red shadow-card group cursor-pointer">
        <summary class="p-5 font-semibold text-xl list-none flex justify-between items-center">
          🎉 888 Fest
          <span class="text-border-light transition-transform group-open:rotate-180">▼</span>
        </summary>
        <div class="px-5 pb-5 text-text-secondary">
        {#if images['888fest']}
            <button 
    onclick={() => zoomedImage = images['888fest']}
    class="w-full mb-4 cursor-zoom-in"
  >
    <img 
      src={images['888fest']} 
      alt="888 Fest" 
      class="w-full h-48 md:h-64 object-cover rounded-xl shadow-sm hover:opacity-90 transition-opacity" 
    />
  </button>
          {/if}
          <p>{content['888fest'][active]}</p>
          <div class="mt-3 bg-smoke-white rounded-full py-1 px-3 text-center font-semibold text-haiti-blue w-max">
            8 Me
          </div>
        </div>
      </details>

      <details class="bg-card-white rounded-2xl border-1-4 border-haiti-blue shadow-card group cursor-pointer">
        <summary class="p-5 font-semibold text-xl list-none flex justify-between items-center">
          🥃 Ekonomi ak Kleren
          <span class="text-border-light transition-transform group-open:rotate-180">▼</span>
        </summary>
        <div class="px-5 pb-5 text-text-secondary">
          {#if images['economy']}<img src={images['economy']} alt="Economy" class="w-full h-48 object-cover rounded-xl mb-3" />{/if}
          <p>{content.economy[active]}</p>
        </div>
      </details>

      <details class="bg-card-white rounded-2xl border-1-4 border-b-blue-300 shadow-[12px_0_20px_2px_rgba(156,163,175,0.6)] shadow-card group cursor-pointer">
        <summary class="p-5 font-semibold text-xl list-none flex justify-between items-center">
          📻 Radyo / Radios
          <span class="text-border-light transition-transform group-open:rotate-180">▼</span>
        </summary>
        <div class="px-5 pb-5 text-text-secondary">
          {#if images['communication']}<img src={images['communication']} alt="Communication" class="w-full h-48 object-cover rounded-xl mb-3" />{/if}
          <p>{content.communication[active]}</p>
        </div>
      </details>

<details class="bg-card-white rounded-2xl border-l-4 border-green-500 shadow-card group cursor-pointer">
        <summary class="p-5 font-semibold text-xl list-none flex justify-between items-center">
          🗺️ Jewografi ak Anviwònman
          <span class="text-border-light transition-transform group-open:rotate-180">▼</span>
        </summary>
        <div class="px-5 pb-5 text-text-secondary space-y-3">
          {#if images['geography']}<img src={images['geography']} alt="Kat" class="w-full h-48 object-cover rounded-xl mb-3" />{/if}
          <p>{content.geography[active]}</p>
           {#if images['hydrography']}<img src={images['hydrography']} alt="Kat" class="w-full h-48 object-cover rounded-xl mb-3" />{/if}
          <p>{content.hydrography[active]}</p>
        </div>
      </details>

      <details class="bg-card-white rounded-2xl border-l-4 border-blue-400 shadow-card group cursor-pointer">
        <summary class="p-5 font-semibold text-xl list-none flex justify-between items-center">
          🏥 Sante ak Edikasyon
          <span class="text-border-light transition-transform group-open:rotate-180">▼</span>
        </summary>
        <div class="px-5 pb-5 text-text-secondary space-y-4">
          <div>
            <h3 class="font-bold text-text-primary mb-1">Sistèm Sante</h3>
             {#if images['health']}<img src={images['health']} alt="Health" class="w-full h-48 object-cover rounded-xl mb-3" />{/if}
            <p>{content.health[active]}</p>
          </div>
          <div class="border-t border-border-light pt-3">
            <h3 class="font-bold text-text-primary mb-1">Lekòl yo</h3>
            <p>{content.education[active]}</p>
             {#if images['education']}<img src={images['education']} alt="Education" class="w-full h-48 object-cover rounded-xl mb-3" />{/if}
          </div>
        
        </div>
      </details>

      <details class="bg-card-white rounded-2xl border-l-4 border-yellow-400 shadow-card group cursor-pointer">
        <summary class="p-5 font-semibold text-xl list-none flex justify-between items-center">
          🌴 Touris
          <span class="text-border-light transition-transform group-open:rotate-180">▼</span>
        </summary>
        <div class="px-5 pb-5 text-text-secondary">
          {#if images['tourism']}<img src={images['tourism']} alt="Touris" class="w-full h-48 object-cover rounded-xl mb-3" />{/if}
          <p>{content.tourism[active]}</p>
        </div>
      </details>


    </div>
  {/if}
</div>


{#if zoomedImage}
  <div 
    class="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4"
    role="presentation"
  >
    <button 
      type="button"
      class="absolute inset-0 w-full h-full cursor-zoom-out bg-transparent border-none"
      onclick={() => zoomedImage = null}
      aria-label="Close image"
    ></button>
    
    <div class="relative max-w-5xl max-h-[90vh] z-101">
      <button 
        type="button"
        class="absolute -top-12 right-0 text-white text-4xl font-bold hover:text-haiti-red transition-colors"
        onclick={() => zoomedImage = null}
        aria-label="Close"
      >
        888
      </button>
      
      <img 
        src={zoomedImage} 
        alt="Full size view" 
        class="rounded-lg shadow-2xl object-contain max-h-[85vh]"
      />
    </div>
  </div>
{/if}