<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getLocalDB } from '$lib/db/client';
  import { matchPhotos } from '$lib/db/schema';
  import { eq } from 'drizzle-orm';
  import ShareButton from '$components/ShareButton.svelte';
  import FeedbackButton from '$components/FeedbackButton.svelte';

   let {data} = $props();
  let match = $derived(data.match);
  let photos = $state<any[]>([]);

  onMount(async () => {
    const db = await getLocalDB();
    if (db) photos = await db.select().from(matchPhotos).where(eq(matchPhotos.matchId, match.id)).orderBy(matchPhotos.sortOrder).all();
  });

  let hasScore = $derived(match.homeScore !== null && match.homeScore !== undefined && match.awayScore !== null && match.awayScore !== undefined);
</script>

<svelte:head>
  <title>{match.homeTeam} vs {match.awayTeam} | Match</title>
  <meta property="og:title" content={`${match.homeTeam} vs ${match.awayTeam}`} />
  <meta property="og:image" content={match.coverImageUrl || '/og-default.png'} />
</svelte:head>

<article class="bg-card-white rounded-3xl overflow-hidden border border-border-light shadow-card">
  {#if match.coverImageUrl}<img src={match.coverImageUrl} alt={`${match.homeTeam} vs ${match.awayTeam}`} class="w-full max-h-56 object-cover" />{/if}
  <div class="p-5">
    <div class="flex items-center justify-between mb-4">
      <span class="text-xl font-bold flex-1 text-right">{match.homeTeam}</span>
      <div class="px-4 py-2 bg-smoke-white rounded-full mx-2">
        {#if hasScore}<span class="text-2xl font-bold text-haiti-blue">{match.homeScore}</span><span class="mx-1 text-text-muted">-</span><span class="text-2xl font-bold text-haiti-blue">{match.awayScore}</span>{:else}<span class="font-semibold text-text-muted">VS</span>{/if}
      </div>
      <span class="text-xl font-bold flex-1">{match.awayTeam}</span>
    </div>

    <div class="flex flex-wrap gap-x-4 gap-y-1 text-text-secondary mb-4">
      <span>📅 {new Date(match.matchDate).toLocaleDateString('ht-HT')}</span>{#if match.matchTime}<span>🕒 {match.matchTime}</span>{/if}{#if match.location}<span>📍 {match.location}</span>{/if}<span>🏁 {match.status === 'upcoming' ? 'A vini' : match.status === 'live' ? 'Ap jwe' : match.status === 'completed' ? 'Fini' : 'Anile'}</span>
    </div>

    {#if match.description}<p class="text-text-secondary mb-5">{match.description}</p>{/if}

    {#if photos.length}
      <div class="mt-4 pt-4 border-t border-border-light"><h3 class="text-lg font-semibold mb-3">📸 Foto match la</h3>
        <div class="grid grid-cols-2 gap-2">
          {#each photos as p}
            <div class="bg-smoke-white rounded-xl overflow-hidden"><img src={p.imageUrl} alt={p.caption || ''} class="w-full aspect-square object-cover" />{#if p.caption}<p class="p-2 text-xs text-text-secondary">{p.caption}</p>{/if}</div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="mt-6 flex justify-center gap-3 flex-wrap"><ShareButton title={`${match.homeTeam} vs ${match.awayTeam}`} text={match.description || `Match nan St Michel de l'Attalaye`} url={`https://stmichel.ht/match/${match.slug}`} /><FeedbackButton eventId={match.id} eventTitle={`${match.homeTeam} vs ${match.awayTeam}`} /></div>
  </div>
</article>
