<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  const id = $page.params.id;
  const isNew = id === 'new';

  let loading = $state(!isNew);
  let saving = $state(false);
  let error = $state('');

  let form = $state({
    id: 0,
    title: '',
    description: '',
    location: '',
    image_url: '',
    event_date: '',
    event_time: '',
    category: 'general',
    published: 0,
    featured: 0
  });

  onMount(async () => {
    if (!isNew) {
      try {
        const r = await fetch('/api/admin/events');
        if (!r.ok) throw new Error('Failed to load');
        const data = await r.json();
        const ev = data.items.find((e: any) => e.id === parseInt(id!, 10));
        if (ev) {
          form = { ...form, ...ev };
        } else {
          error = 'Evènman pa jwenn';
        }
      } catch (e) {
        error = (e as Error).message;
      } finally {
        loading = false;
      }
    }
  });

  async function save() {
    if (!form.title.trim()) { error = 'Tit la obligatwa'; return; }
    saving = true;
    error = '';
    try {
      const method = isNew ? 'POST' : 'PUT';
      // const body = isNew ? { ...form } : { ...form, id: parseInt(id) };

      const payload = {
        id: isNew ? undefined : parseInt(id!, 10),
        title: form.title,
        description: form.description,
        location: form.location,
        date: form.event_date,       // translated from event_date
        time: form.event_time,       // translated from event_time
        imageUrl: form.image_url,    // translated from image_url
        type: form.category,         // translated from category
        published: form.published,
        lat: null, // Placeholder for map coordinates
        lng: null  // Placeholder for map coordinates
      };
      const r = await fetch('/api/admin/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        throw new Error(b.error || 'Echwe sove');
      }
      goto(resolve('/admin/dashboard/events'));
    } catch (e) {
      error = (e as Error).message;
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head><title>{isNew ? 'Nouvo' : 'Modifye'} Evènman | Admin</title></svelte:head>

<div class="p-4 max-w-2xl mx-auto pb-20">
  <header class="mb-6">
    <a href={resolve("/admin/dashboard/events")} class="text-sm text-text-muted hover:underline">← Retounen</a>
    <h1 class="text-2xl font-bold mt-1">{isNew ? '🆕 Nouvo Evènman' : '✏️ Modifye Evènman'}</h1>
  </header>

  {#if loading}
    <p class="text-text-muted">Chajman...</p>
  {:else}
    <form onsubmit={(e) => { e.preventDefault(); save(); }} class="space-y-4">
      {#if error}
        <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-haiti-red text-sm">{error}</div>
      {/if}

      <label class="block">
        <span class="font-medium">Tit *</span>
        <input type="text" bind:value={form.title} required
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" />
      </label>

      <label class="block">
        <span class="font-medium">Deskripsyon</span>
        <textarea bind:value={form.description} rows="4"
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1"></textarea>
      </label>

      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <span class="font-medium">Dat</span>
          <input type="date" bind:value={form.event_date}
            class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" />
        </label>
        <label class="block">
          <span class="font-medium">Lè</span>
          <input type="time" bind:value={form.event_time}
            class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" />
        </label>
      </div>

      <label class="block">
        <span class="font-medium">Kote</span>
        <input type="text" bind:value={form.location} placeholder="eg. Legliz St Michel"
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" />
      </label>

      <label class="block">
        <span class="font-medium">URL Imaj</span>
        <input type="url" bind:value={form.image_url} placeholder="https://..."
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" />
      </label>
      {#if form.image_url}
        <img src={form.image_url} alt="Preview" class="w-24 h-24 object-cover rounded-xl border" />
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <span class="font-medium">Kategori</span>
          <select bind:value={form.category}
            class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1">
            <option value="general">Jeneral</option>
            <option value="religion">Relijyon</option>
            <option value="music">Mizik</option>
            <option value="culture">Kilti</option>
            <option value="food">Manje</option>
            <option value="sport">Espò</option>
          </select>
        </label>
        <div class="space-y-3 pt-7">
          <label class="flex items-center gap-2">
            <input type="checkbox" bind:checked={() => form.published, (v) => form.published = v ? 1 : 0}
              class="w-5 h-5 rounded" />
            <span class="font-medium">Pibliye</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" bind:checked={() => form.featured, (v) => form.featured = v ? 1 : 0}
              class="w-5 h-5 rounded" />
            <span class="font-medium">Featured ⭐</span>
          </label>
        </div>
      </div>

      <div class="flex gap-3 pt-4">
        <button type="submit" disabled={saving}
          class="bg-haiti-blue text-white px-6 py-3 rounded-full font-medium disabled:opacity-50">
          {saving ? 'Sove...' : (isNew ? '✅ Kreye Evènman' : '💾 Sove Chanjman')}
        </button>
        <button type="button" onclick={() => goto(resolve('/admin/dashboard/events'))}
          class="border border-border-light px-6 py-3 rounded-full">Anile</button>
      </div>
    </form>
  {/if}
</div>