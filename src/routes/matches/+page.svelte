<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocalDB } from '$lib/db/client';
  import { matches } from '$lib/db/schema';
  import { asc, desc, sql } from 'drizzle-orm';
  import { goto } from '$app/navigation';

  let upcoming = $state<any[]>([]);
  let past = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const db = await getLocalDB();
    if (!db) return;
    const today = new Date().toISOString().split('T')[0];
    upcoming = await db.select().from(matches).where(sql`match_date >= ${today} AND status = 'upcoming' AND published = 1`).orderBy(asc(matches.matchDate), asc(matches.matchTime)).all();
    past = await db.select().from(matches).where(sql`status = 'completed' AND published = 1`).orderBy(desc(matches.matchDate)).limit(10).all();
    loading = false;
  });
</script>
<svelte:head><title>Match yo | ST MICHEL</title></svelte:head>


<div class="space-y-6 pb-20">
  <header class="text-center"><h1 class="text-3xl font-semibold flex justify-center items-center gap-2">⚽ Match</h1><p class="text-text-muted">St Michel de l'Attalaye</p></header>

  {#if loading}<p class="text-center py-10 text-text-muted">Chaje...</p>{:else}
    <section><h2 class="flex items-center gap-2 text-xl font-semibold mb-3"><span class="w-1 h-5 bg-haiti-blue rounded-full"></span>Match kap vini</h2>
      {#if upcoming.length}
        <div class="space-y-3">
          {#each upcoming as m (m.id)}
            <div class="bg-card-white rounded-2xl p-4 border border-border-light shadow-card cursor-pointer active:scale-[0.99]" role="button" tabindex="0" onclick={() => goto(`/match/${m.slug}`)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && goto(`/match/${m.slug}`)}>
              <div class="flex justify-between items-center mb-2"><span class="font-semibold flex-1 text-right">{m.homeTeam}</span><span class="text-text-muted px-2">vs</span><span class="font-semibold flex-1">{m.awayTeam}</span></div>
              <div class="flex flex-wrap gap-x-3 text-sm text-text-secondary"><span>📅 {new Date(m.matchDate).toLocaleDateString('ht-HT')}</span>{#if m.matchTime}<span>🕒 {m.matchTime}</span>{/if}{#if m.location}<span>📍 {m.location}</span>{/if}</div>
              <div class="text-xs font-semibold uppercase text-haiti-blue mt-2">A vini</div>
            </div>
          {/each}
        </div>
      {:else}<p class="text-text-muted py-4">Pa gen match pwograme.</p>{/if}
    </section>

    <section><h2 class="flex items-center gap-2 text-xl font-semibold mb-3"><span class="w-1 h-5 bg-haiti-blue rounded-full"></span>Dènye rezilta</h2>
      {#if past.length}
        <div class="space-y-2">
          {#each past as m (m.id) }
            <div class="bg-card-white rounded-xl p-3 border border-border-light opacity-90 cursor-pointer" role="button" tabindex="0" onclick={() => goto(`/match/${m.slug}`)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && goto(`/match/${m.slug}`)}>
              <div class="flex justify-between items-center"><span class="font-medium">{m.homeTeam}</span><span class="font-bold text-haiti-blue">{m.homeScore ?? '?'} - {m.awayScore ?? '?'}</span><span class="font-medium">{m.awayTeam}</span></div>
              <div class="text-xs text-text-muted mt-1">{new Date(m.matchDate).toLocaleDateString('ht-HT')}</div>
            </div>
          {/each}
        </div>
      {:else}<p class="text-text-muted py-4">Pa gen rezilta ankò.</p>{/if}
    </section>
  {/if}
</div>
