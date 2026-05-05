<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  type Event = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    location: string | null;
    image_url: string | null;
    event_date: string | null;
    event_time: string | null;
    category: string;
    published: number;
    featured: number;
  };

  let events = $state<Event[]>([]);
  let loading = $state(true);
  let error = $state('');

  onMount(loadEvents);

  async function loadEvents() {
    loading = true;
    try {
      const r = await fetch('/api/admin/events');
      if (!r.ok) throw new Error('Echwe chaje evènman yo');
      const data = await r.json();
      events = data.events || [];
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function togglePublish(ev: Event) {
    const newVal = ev.published ? 0 : 1;
    await fetch('/api/admin/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ev, published: newVal })
    });
    ev.published = newVal;
    events = [...events]; // trigger reactivity
  }

  async function del(id: number) {
    if (!confirm('Efase evènman sa a?')) return;
    const r = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
    if (r.ok) events = events.filter(e => e.id !== id);
    else alert('Pa ka efase');
  }

  function formatDate(d: string | null) {
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
    <p class="text-haiti-red">{error}</p>
  {:else if events.length === 0}
    <div class="text-center py-16 bg-smoke-white rounded-2xl">
      <p class="text-4xl mb-3">🎉</p>
      <p class="text-text-muted text-lg">Pa gen evènman ankò</p>
      <button onclick={() => goto(resolve('/admin/dashboard/events/new'))}
        class="mt-4 bg-haiti-blue text-white px-6 py-2 rounded-full">Kreye Premye a</button>
    </div>
  {:else}
    <div class="space-y-3">
      {#each events as ev (ev.id)}
        <div class="bg-card-white rounded-2xl border border-border-light p-4 flex items-center gap-4">
          <!-- Image -->
          {#if ev.image_url}
            <img src={ev.image_url} alt="" class="w-16 h-16 rounded-xl object-cover shrink-0" />
          {:else}
            <div class="w-16 h-16 rounded-xl bg-smoke-white flex items-center justify-center text-2xl shrink-0">🎉</div>
          {/if}

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold truncate">{ev.title}</h3>
              {#if ev.featured}
                <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">⭐ Featured</span>
              {/if}
            </div>
            <p class="text-sm text-text-muted">
              📅 {formatDate(ev.event_date)}
              {#if ev.event_time} · 🕐 {ev.event_time}{/if}
              {#if ev.location} · 📍 {ev.location}{/if}
            </p>
            <span class="text-xs px-2 py-0.5 rounded-full {ev.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
              {ev.published ? '✅ Pibliye' : '📝 Bouyon'}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0">
            <button onclick={() => togglePublish(ev)}
              class="text-sm px-3 py-1.5 rounded-full border {ev.published ? 'border-gray-200' : 'border-green-200 text-green-700'}"
              title={ev.published ? 'Depibliye' : 'Pibliye'}>
              {ev.published ? '📝' : '✅'}
            </button>
            <button onclick={() => goto(resolve(`/admin/dashboard/events/${ev.id}`))}
              class="text-sm px-3 py-1.5 rounded-full border border-border-light hover:bg-smoke-white">
              ✏️ Modifye
            </button>
            <button onclick={() => del(ev.id)}
              class="text-sm px-3 py-1.5 rounded-full border border-red-200 text-haiti-red hover:bg-red-50">
              🗑️
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>