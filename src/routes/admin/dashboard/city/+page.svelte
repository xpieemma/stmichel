<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocalDB } from '$lib/db/client';
  import { cityInfo } from '$lib/db/schema';
  import { eq } from 'drizzle-orm';
  import { syncToServer } from '$lib/db/sync';
  import { resolve } from '$app/paths';

  let sections = $state(['history', 'mayor', '888fest', 'clairin', 'radio']);
  let content = $state<any>({});
  let loading = $state(true);

  onMount(async () => {
    const db = await getLocalDB();
    if (db) {
      for (const key of sections) {
        const row = await db.select().from(cityInfo).where(eq(cityInfo.key, key)).get();
        if (row) content[key] = { fr: row.contentFr || '', ht: row.contentHt || '', es: row.contentEs || '', en: row.contentEn || '' };
        else content[key] = { fr: '', ht: '', es: '', en: '' };
      }
      loading = false;
    }
  });

  async function save(key: string) {
    const db = await getLocalDB();
    if (!db) return;
    await db.update(cityInfo).set({ contentFr: content[key].fr, contentHt: content[key].ht, contentEs: content[key].es, contentEn: content[key].en, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(cityInfo.key, key));
    await syncToServer('city', { key, ...content[key] });
    alert('Sove!');
  }
</script>
<svelte:head><title>Enfòmasyon Vil | Admin</title></svelte:head>


<div class="p-4">
  <header class="flex items-center justify-between mb-6">
    <div>
      <a href={resolve("/admin/dashboard")} class="text-sm text-text-muted hover:underline">← Dashboard</a>
      <h1 class="text-2xl font-bold mt-1">🏙️ Jere Enfòmasyon Vil la</h1>
    </div>
  </header>
  {#if loading}<p>Chaje...</p>{:else}
    {#each sections as key (key)}
      <div class="bg-card-white rounded-2xl p-4 border border-border-light mb-6">
        <h2 class="text-xl font-semibold mb-2 capitalize">{key}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block font-medium">Kreyòl<textarea bind:value={content[key].ht} rows="4" class="w-full p-2 border rounded"></textarea></label></div>
          <div><label class="block font-medium">Français<textarea bind:value={content[key].fr} rows="4" class="w-full p-2 border rounded"></textarea></label></div>
          <div><label class="block font-medium">Español<textarea bind:value={content[key].es} rows="4" class="w-full p-2 border rounded"></textarea></label></div>
          <div><label class="block font-medium">English<textarea bind:value={content[key].en} rows="4" class="w-full p-2 border rounded"></textarea></label></div>
        </div>
        <button onclick={() => save(key)} class="mt-3 bg-haiti-blue text-white px-4 py-2 rounded">Sove {key}</button>
      </div>
    {/each}
  {/if}
</div>
