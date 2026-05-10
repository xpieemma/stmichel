<!-- <script lang="ts">
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
</div> -->


<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getLocalDB } from '$lib/db/client';
  import { matches } from '$lib/db/schema';
  import { addToQueue } from '$lib/db/pending-sync';
  import { desc, eq } from 'drizzle-orm';

  // Strict typing from your schema
  type MatchRecord = typeof matches.$inferSelect;

  let list = $state<MatchRecord[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const db = await getLocalDB();
    if (db) {
      // ⚡ Instant local read
      list = await db.select().from(matches).orderBy(desc(matches.matchDate)).all();
    }
    loading = false;
  });

  async function del(id: number) {
    if (!confirm('Èske ou sèten ou vle efase match sa a?')) return;

    // 1. OPTIMISTIC UI: Remove from the screen immediately
    const originalList = [...list];
    list = list.filter(m => m.id !== id);

    try {
      const db = await getLocalDB();
      if (db) {
        // 2. Persist deletion in local SQLite
        await db.delete(matches).where(eq(matches.id, id)).run();
        
        // 3. Queue the deletion for Cloudflare D1 sync
        // Note: We pass the ID so the sync worker knows what to kill on the server
        await addToQueue('matches', { id, _method: 'DELETE' });
      }
    } catch (e) {
      console.error('Local delete failed:', e);
      list = originalList; // Rollback if local DB fails
      alert('Erè nan baz done lokal la.');
    }
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-700 animate-pulse';
      case 'completed': return 'bg-slate-100 text-slate-600';
      case 'cancelled': return 'bg-gray-100 text-gray-400 line-through';
      default: return 'bg-blue-50 text-haiti-blue'; // upcoming
    }
  }
</script>

<svelte:head><title>Jere Match | Admin</title></svelte:head>

<!-- The White Smoke Canvas -->
<div class="min-h-screen bg-smoke-white p-4 pb-24 pt-8">
  <div class="mx-auto max-w-5xl">
    
    <header class="mb-10 flex items-center justify-between">
      <div>
        <a href={resolve("/admin/dashboard")} class="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-haiti-blue transition-colors">← Sant Kontwòl</a>
        <h1 class="mt-2 font-serif text-3xl font-bold text-slate-900">⚽ Jere Match yo</h1>
      </div>
      <button 
        onclick={() => goto(resolve('/admin/dashboard/matches/new'))} 
        class="rounded-full bg-haiti-blue px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-transform hover:scale-105 active:scale-95"
      >
        + Nouvo Match
      </button>
    </header>

    {#if loading}
      <div class="flex h-64 items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50">
        <p class="font-sans text-sm font-medium text-slate-400">Chajman match yo...</p>
      </div>
    {:else if list.length === 0}
      <div class="flex flex-col items-center justify-center rounded-[2.5rem] border border-slate-200 bg-white py-24 text-center shadow-sm">
        <span class="mb-4 text-5xl opacity-20">⚽</span>
        <h2 class="font-serif text-xl font-bold text-slate-800">Pa gen match nan list la</h2>
        <p class="mt-2 text-slate-500">Kòmanse ajoute match pou sezon an.</p>
      </div>
    {:else}
      <div class="grid gap-4">
        {#each list as m (m.id)}
          <div class="group relative flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5 sm:flex-row sm:items-center">
            
            <!-- Date Badge -->
            <div class="flex flex-col items-center justify-center rounded-2xl bg-smoke-white px-4 py-3 text-center sm:w-24">
              <span class="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                {new Date(m.matchDate).toLocaleDateString('ht-HT', { month: 'short' })}
              </span>
              <span class="font-serif text-2xl font-bold text-haiti-blue">
                {new Date(m.matchDate).toLocaleDateString('ht-HT', { day: 'numeric' })}
              </span>
            </div>

            <!-- Matchup Details -->
            <div class="flex-1">
              <div class="mb-3 flex items-center gap-2">
                <span class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest {getStatusStyle(m.status || '')}">
                  {m.status || 'upcoming'}
                </span>
                {#if m.matchTime}
                   <span class="text-xs font-bold text-slate-400">🕐 {m.matchTime}</span>
                {/if}
              </div>

              <div class="flex items-center gap-4 text-lg font-bold text-slate-900">
                <span class="truncate">{m.homeTeam}</span>
                <span class="text-slate-300">vs</span>
                <span class="truncate">{m.awayTeam}</span>
              </div>

              {#if m.status === 'completed' || m.status === 'live'}
                <p class="mt-1 font-serif text-2xl font-black text-haiti-blue">
                  {m.homeScore ?? 0} — {m.awayScore ?? 0}
                </p>
              {/if}
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 border-t border-slate-50 pt-4 sm:border-t-0 sm:pt-0">
              <button 
                onclick={() => goto(resolve(`/admin/dashboard/matches/${m.id}`))}
                class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-haiti-blue hover:text-white"
                title="Modifye"
              >
                ✏️
              </button>
              <button 
                onclick={() => del(m.id)}
                class="flex h-10 w-10 items-center justify-center rounded-full border border-red-100 bg-white text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                title="Efase"
              >
                🗑️
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>