<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getLocalDB } from '$lib/db/client';
  import { matches } from '$lib/db/schema';
  import { desc, eq } from 'drizzle-orm';
  import { resolve } from '$app/paths';

  let list = $state<any[]>([]);
  let loading = $state(true);
  onMount(async () => { const db = await getLocalDB(); if (db) list = await db.select().from(matches).orderBy(desc(matches.matchDate)).all(); loading = false; });
  async function del(id: number) {
    if (!confirm('Efase match sa a?')) return;
    try {
      const res = await fetch(`/api/admin/matches?id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!res.ok) throw new Error('Server delete failed');
    } catch (e) {
      alert('Pa ka efase sou sèvè a. Tcheke koneksyon w.');
      return;
    }
    const db = await getLocalDB();
    if (db) await db.delete(matches).where(eq(matches.id, id));
    list = list.filter(m => m.id !== id);
  }
</script>
<svelte:head><title>Match yo | Admin</title></svelte:head>


<div class="p-4 bg-card-white rounded-2xl border border-border-light">
  <header class="flex justify-between mb-4">
    
    <div>
      <a href={resolve("/admin/dashboard")} class="text-sm text-text-muted hover:underline">← Dashboard</a>
      <h2 class="text-xl font-semibold">⚽ Jere Match yo</h2>
    </div>
    <button onclick={() => goto(resolve ('/admin/dashboard/matches/new'))} class="bg-haiti-blue text-white px-4 py-2 rounded-full">+ Nouvo Match</button>
  </header>
  {#if loading}<p>Chaje...</p>{:else}<table class="w-full"><thead><tr><th>Dat</th><th>Ekip Lakay</th><th>Ekip Vizitè</th><th>Rezilta</th><th>Estati</th><th></th></tr></thead><tbody>{#each list as m}<tr><td>{new Date(m.matchDate).toLocaleDateString('ht-HT')}</td><td>{m.homeTeam}</td><td>{m.awayTeam}</td><td>{m.homeScore ?? '-'} - {m.awayScore ?? '-'}</td><td><span class="text-xs px-2 py-1 rounded-full {m.status === 'upcoming' ? 'bg-blue-50 text-haiti-blue' : 'bg-green-50 text-green-700'}">{m.status}</span></td><td><button onclick={() => goto(resolve(`/admin/dashboard/matches/${m.id}`))}>✏️</button><button onclick={() => del(m.id)}>🗑️</button></td></tr>{/each}</tbody></table>{/if}
</div>
