<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  // ✅ Unified type to support both Drizzle's camelCase and legacy snake_case
  type EventRecord = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    location: string | null;
    imageUrl?: string | null;
    image_url?: string | null; 
    date?: string | null; 
    event_date?: string | null;
    time?: string | null; 
    event_time?: string | null;
    type?: string; 
    category?: string;
    published: number;
    featured?: number;
  };

  // ✅ FIXED: Uncommented the events state so reactivity actually works!
  let events = $state<EventRecord[]>([]);
  let loading = $state(true);
  let error = $state('');

  onMount(loadEvents);

  async function loadEvents() {
    loading = true;
    try {
      const r = await fetch('/api/admin/events');
      if (!r.ok) throw new Error('Echwe chaje evènman yo');
      const data = await r.json();
      events = data.items || data.events || []; // fallback for different API wrappers
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function togglePublish(ev: EventRecord) {
    const newVal = ev.published ? 0 : 1;
    const r = await fetch('/api/admin/events', {
      method: 'POST', // Using POST since your backend handles both Create/Update via POST
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ev, published: newVal })
    });
    
    if (r.ok) {
      // ✅ Svelte 5 deeply tracks arrays of objects, so mutating the property directly updates the UI
      ev.published = newVal; 
    } else {
      alert('Pa ka chanje estati piblikasyon an');
    }
  }

  async function del(id: number) {
    if (!confirm('Efase evènman sa a?')) return;
    const r = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
    if (r.ok) {
      events = events.filter(e => e.id !== id);
    } else {
      alert('Pa ka efase');
    }
  }

  // ✅ Refactored to use the API. Mixing direct OPFS DB inserts with Server API fetches 
  // causes the newly duplicated item to not show up until a background sync occurs.
  async function duplicate(ev: EventRecord) {
    loading = true;
    try {
      const newRecord = { 
        ...ev, 
        title: `(Kopi) ${ev.title}`,
        published: 0, // Force drafts for copies
        id: undefined // Strip ID so the API knows it's an INSERT, not an UPDATE
      };
      
      const r = await fetch('/api/admin/events', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord) 
      });
      
      if (!r.ok) throw new Error('Echwe kopye evènman an');
      
      await loadEvents(); // Refresh the list to get the new ID and Slug
    } catch (e) {
      alert((e as Error).message);
      loading = false; // loadEvents resets loading to false, but we need it here on fail
    }
  }

  function formatDate(d: string | null | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-HT', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head><title>Evènman | Admin</title></svelte:head>

<div class="p-4 max-w-5xl mx-auto pb-20">
  <header class="flex items-center justify-between mb-6">
    <div>
      <a href={resolve("/admin/dashboard")} class="text-sm text-text-muted hover:underline">← Dashboard</a>
      <h1 class="text-2xl font-bold mt-1">🎉 Jere Evènman</h1>
    </div>
    <button
      onclick={() => goto(resolve('/admin/dashboard/events/new'))}
      class="bg-haiti-blue text-white px-4 py-2 rounded-full font-medium"
    >+ Nouvo Evènman</button>
  </header>

  {#if loading}
    <p class="text-text-muted text-center py-10">Chajman...</p>
  {:else if error}
    <p class="text-haiti-red text-center">{error}</p>
  {:else if events.length === 0}
    <div class="text-center py-16 bg-smoke-white rounded-2xl border border-border-light">
      <p class="text-4xl mb-3">🎉</p>
      <p class="text-text-muted text-lg">Pa gen evènman ankò</p>
      <button onclick={() => goto(resolve('/admin/dashboard/events/new'))}
        class="mt-4 bg-haiti-blue text-white px-6 py-2 rounded-full font-medium shadow-sm hover:opacity-90">Kreye Premye a</button>
    </div>
  {:else}
    <div class="space-y-3">
      {#each events as ev (ev.id)}
        <div class="bg-card-white rounded-2xl border border-border-light p-4 flex items-center gap-4 transition-shadow hover:shadow-sm">
          {#if ev.imageUrl || ev.image_url}
            <img src={ev.imageUrl || ev.image_url} alt="" class="w-16 h-16 rounded-xl object-cover shrink-0 border border-border-light" />
          {:else}
            <div class="w-16 h-16 rounded-xl bg-smoke-white flex items-center justify-center text-2xl shrink-0 border border-border-light">🎉</div>
          {/if}

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-semibold truncate text-lg">{ev.title}</h3>
              
              {#if ev.featured}
                <span class="text-[10px] uppercase tracking-wide bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">⭐ Featured</span>
              {/if}
            </div>
            
            <p class="text-sm text-text-muted mb-2">
              📅 {formatDate(ev.date || ev.event_date)}
              {#if ev.time || ev.event_time} · 🕐 {ev.time || ev.event_time}{/if}
              {#if ev.location} · 📍 {ev.location}{/if}
            </p>
            
            <span class="text-xs px-2.5 py-1 rounded-full font-medium {ev.published ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}">
              {ev.published ? '✅ Pibliye' : '📝 Bouyon'}
            </span>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button onclick={() => togglePublish(ev)}
              class="text-sm px-3 py-1.5 rounded-full border transition-colors {ev.published ? 'border-gray-200 hover:bg-gray-50' : 'border-green-200 text-green-700 hover:bg-green-50'}"
              title={ev.published ? 'Retire nan piblikasyon' : 'Pibliye kounye a'}>
              {ev.published ? '📝 Fè l tounen bouyon' : '✅ Pibliye l'}
            </button>
            
            <button onclick={() => goto(resolve(`/admin/dashboard/events/${ev.id}`))}
              class="text-sm px-3 py-1.5 rounded-full border border-border-light hover:bg-smoke-white transition-colors">
              ✏️ Modifye
            </button>
            
            <button onclick={() => duplicate(ev)}
              class="text-sm px-3 py-1.5 rounded-full border border-border-light hover:bg-blue-50 transition-colors text-blue-700"
              title="Kopye evènman sa a">
              📋 Kopi
            </button>
            
            <button onclick={() => del(ev.id)}
              class="text-sm px-3 py-1.5 rounded-full border border-red-200 text-haiti-red hover:bg-red-50 transition-colors"
              title="Efase">
              🗑️
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>