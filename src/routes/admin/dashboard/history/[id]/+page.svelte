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
    id: 0, title: '', content: '', year: null as number | null,
    image_url: '', published: 0, sort_order: 0
  });

  onMount(async () => {
    if (!isNew) {
      const r = await fetch('/api/admin/history');
      if (r.ok) {
        const data = await r.json();
        const item = data.items.find((x: any) => x.id === parseInt(id));
        if (item) form = { ...form, ...item };
        else error = 'Pa jwenn';
      }
      loading = false;
    }
  });

  async function save() {
    if (!form.title.trim()) { error = 'Tit la obligatwa'; return; }
    saving = true; error = '';
    try {
      const method = isNew ? 'POST' : 'PUT';
      const body = isNew ? form : { ...form, id: parseInt(id) };
      const r = await fetch('/api/admin/history', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error('Echwe sove');
      goto(resolve('/admin/dashboard/history'));
    } catch (e) { error = (e as Error).message; }
    finally { saving = false; }
  }
</script>

<svelte:head><title>{isNew ? 'Nouvo' : 'Modifye'} Istwa | Admin</title></svelte:head>

<div class="p-4 max-w-2xl mx-auto pb-20">
  <header class="mb-6">
    <a href={resolve("/admin/dashboard/history")} class="text-sm text-text-muted hover:underline">← Retounen</a>
    <h1 class="text-2xl font-bold mt-1">{isNew ? '🆕 Nouvo Istwa' : '✏️ Modifye Istwa'}</h1>
  </header>

  {#if loading}<p class="text-text-muted">Chajman...</p>
  {:else}
    <form onsubmit={(e) => { e.preventDefault(); save(); }} class="space-y-4">
      {#if error}<div class="p-3 rounded-xl bg-red-50 text-haiti-red text-sm">{error}</div>{/if}

      <label class="block"><span class="font-medium">Tit *</span>
        <input type="text" bind:value={form.title} required
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" /></label>

      <label class="block"><span class="font-medium">Kontni</span>
        <textarea bind:value={form.content} rows="8"
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1"></textarea></label>

      <div class="grid grid-cols-2 gap-4">
        <label class="block"><span class="font-medium">Ane</span>
          <input type="number" bind:value={form.year} min="1500" max="2030"
            class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" /></label>
        <label class="block"><span class="font-medium">Lòd</span>
          <input type="number" bind:value={form.sort_order} min="0"
            class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" /></label>
      </div>

      <label class="block"><span class="font-medium">URL Imaj</span>
        <input type="url" bind:value={form.image_url}
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" /></label>

      <label class="flex items-center gap-2">
        <input type="checkbox" checked={form.published === 1}
          onchange={(e) => form.published = e.currentTarget.checked ? 1 : 0} class="w-5 h-5 rounded" />
        <span class="font-medium">Pibliye</span></label>

      <div class="flex gap-3 pt-4">
        <button type="submit" disabled={saving}
          class="bg-haiti-blue text-white px-6 py-3 rounded-full font-medium disabled:opacity-50">
          {saving ? 'Sove...' : (isNew ? '✅ Kreye' : '💾 Sove')}</button>
        <button type="button" onclick={() => goto(resolve('/admin/dashboard/history'))}
          class="border border-border-light px-6 py-3 rounded-full">Anile</button>
      </div>
    </form>
  {/if}
</div>