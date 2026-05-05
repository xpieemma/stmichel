<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getLocalDB } from '$lib/db/client';
  import { albums } from '$lib/db/schema';
  import { desc, eq } from 'drizzle-orm';
  import { resolve } from '$app/paths';

  let list = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => { const db = await getLocalDB(); if (db) list = await db.select().from(albums).orderBy(desc(albums.createdAt)).all(); loading = false; });
  async function del(id: number) {
    if (!confirm('Efase albòm sa a?')) return;
    try {
      const res = await fetch(`/api/admin/albums?id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!res.ok) throw new Error('Server delete failed');
    } catch (e) {
      alert('Pa ka efase sou sèvè a. Tcheke koneksyon w.');
      return;
    }
    const db = await getLocalDB();
    if (db) await db.delete(albums).where(eq(albums.id, id));
    list = list.filter(a => a.id !== id);
  }
</script>
<svelte:head><title>Albòm yo | Admin</title></svelte:head>


<div class="p-4 bg-card-white rounded-2xl border border-border-light">

  <header class="flex justify-between mb-4">
    <div>
      <a href={resolve("/admin/dashboard")} class="text-sm text-text-muted hover:underline">← Dashboard</a>
      <h2 class="text-xl font-semibold">📸 Jere Albòm yo</h2>
    </div>
    <button onclick={() => goto(resolve('/admin/dashboard/albums/new'))} class="bg-haiti-blue text-white px-4 py-2 rounded-full">+ Nouvo Albòm</button>
  </header>
  {#if loading}<p>Chaje...</p>{:else}<div class="grid grid-cols-2 gap-4">{#each list as a (a.id)}<div class="border rounded-lg p-3"><img src={a.coverImageUrl || '/favicon.svg'} alt={`Cover for ${a.title}`} class="w-full h-32 object-cover rounded mb-2" /><h3 class="font-semibold">{a.title}</h3><div class="flex gap-2 mt-2"><button onclick={() => goto(resolve(`/admin/dashboard/albums/${a.id}`))} class="text-haiti-blue">Modifye</button><button onclick={() => del(a.id)} class="text-haiti-red">Efase</button></div></div>{/each}</div>{/if}
</div>
