<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getLocalDB } from '$lib/db/client';
  import { matches, matchPhotos } from '$lib/db/schema';
  import { eq } from 'drizzle-orm';
  import { resolve } from '$app/paths';
  import { syncToServer } from '$lib/db/sync';

type MatchStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
  let id = $page.params.id as string;
  let isNew = $derived(id === 'new');
  let form =$state ({id: undefined as number|undefined, homeTeam: '', awayTeam: '', matchDate: '', matchTime: '', location: '', description: '', homeScore: null as number|null, awayScore: null as number|null, status: 'upcoming' as MathStatus, coverImageUrl: '', published: 1 });
  let photos = $state<any[]>([]);
  let saving = $state(false);
 let loading = $derived(!isNew);

  onMount(async () => {
    if (!isNew) {
      const db = await getLocalDB();
      if (db) {
        const cleanId = parseInt(id!, 10);
       
       const results = await db.select().from(matches).where(eq(matches.id, parseInt(id!, 10))).limit(1).all();
const m = results[0];
  
        if (m) { 
        
          form = { 
            id: m.id,
            homeTeam: m.homeTeam|| m.homeTeam || '',
            awayTeam: m.awayTeam|| m.awayTeam || '',
            matchDate: m.matchDate|| m.matchDate || '',
            matchTime: m.matchTime || m.matchTime || '',
            location: m.location || m.location || '',
            description: m.description || m.description || '',
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            status: 'upcoming' as MatchStatus,
            coverImageUrl: m.coverImageUrl || '',
            published: m.published ?? 1
          }; 
          photos = await db.select().from(matchPhotos).where(eq(matchPhotos.matchId, cleanId)).all(); 
        }
        loading = false;
      }
    }
  });

  async function save() {
    saving = true;

    try {
    const db = await getLocalDB();
    if (!db) return;
    
    const rawForm = $state.snapshot(form);
    
    const dataToSave = { ...rawForm };
    delete dataToSave.id;

    if (isNew) {
      const baseSlug = `${dataToSave.homeTeam}-vs-${dataToSave.awayTeam}-${dataToSave.matchDate}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const uniqueId = Math.random().toString(36).substring(2, 6);
      const finalSlug = `${baseSlug}-${uniqueId}`;
      
      const now = Math.floor(Date.now() / 1000);
      
      const result = await db.insert(matches)
        .values({ ...dataToSave, slug: finalSlug, createdAt: now, updatedAt: now })
        .returning({ id: matches.id })
        .get();
        
      id = result.id.toString();
      isNew = false;
    
     
    } else {
      const now = Math.floor(Date.now() / 1000);
      
      await db.update(matches)
        .set({ ...dataToSave, updatedAt: now })
        .where(eq(matches.id, parseInt(id!, 10)));

        await syncToServer('matches', rawForm);

     
    }
 goto(resolve(`/admin/dashboard/matches`));
    } catch (error) {
      console.error('Error saving match:', error);
     
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head><title>{isNew ? 'Nouvo Match' : 'Modifye Match'} | Admin</title></svelte:head>

<div class="p-4 max-w-2xl mx-auto">
<header class="mb-6">
    <a href={resolve("/admin/dashboard/matches")} class="text-sm text-text-muted hover:underline">← Retounen</a>
  <h1 class="text-2xl font-semibold mb-4">{isNew ? 'Nouvo Match' : 'Modifye Match'}</h1>
  </header>
  
  {#if loading}
    <div class="py-10 text-center text-text-muted animate-pulse">Ap chaje match la...</div>
  {:else}
    <form onsubmit={(e) => { e.preventDefault(); save(); }} class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <label>Ekip Lakay <input type="text" bind:value={form.homeTeam} class="w-full p-2 border rounded" required /></label>
        <label>Ekip Vizitè <input type="text" bind:value={form.awayTeam} class="w-full p-2 border rounded" required /></label>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <label>Dat <input type="date" bind:value={form.matchDate} class="w-full p-2 border rounded" required /></label>
        <label>Lè <input type="time" bind:value={form.matchTime} class="w-full p-2 border rounded" /></label>
      </div>
      
      <label>Kote <input type="text" bind:value={form.location} class="w-full p-2 border rounded" /></label>
      <label>Deskripsyon <textarea bind:value={form.description} rows="3" class="w-full p-2 border rounded"></textarea></label>
      
      <div class="grid grid-cols-2 gap-4">
        <label>Nòt Lakay <input type="number" bind:value={form.homeScore} class="w-full p-2 border rounded" /></label>
        <label>Nòt Vizitè <input type="number" bind:value={form.awayScore} class="w-full p-2 border rounded" /></label>
      </div>
      
      <label>Estati 
        <select bind:value={form.status} class="w-full p-2 border rounded">
          <option value="upcoming">A vini</option>
          <option value="live">Ap jwe</option>
          <option value="completed">Fini</option>
          <option value="cancelled">Anile</option>
        </select>
      </label>
      
      <label>URL Imaj Kouvèti <input type="url" bind:value={form.coverImageUrl} class="w-full p-2 border rounded" /></label>
      
      <!-- <div class="flex gap-2">
        <button type="submit" class="bg-haiti-blue text-white px-4 py-2 rounded">Sove</button>
        <button type="button" onclick={() => goto('/admin/dashboard/matches')} class="border px-4 py-2 rounded">Anile</button>
      </div> -->

      <div class="flex gap-2">
        <button 
          type="submit" 
          disabled={saving} 
          class="bg-haiti-blue text-white px-4 py-2 rounded disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Ap sove...' : 'Sove'}
        </button>
        <button type="button" onclick={() => goto(resolve('/admin/dashboard/matches'))} class="border px-4 py-2 rounded">Anile</button>
      </div>
    </form>
    
    {#if !isNew && photos.length}
      <h2 class="text-xl mt-6">Foto match yo</h2>
      <div class="grid grid-cols-3 gap-2 mt-2">
        {#each photos as p (p.id)}
         <img src={p.imageUrl} alt="{form.homeTeam} kont {form.awayTeam}" class="w-full h-24 object-cover rounded" />
        {/each}
      </div>
    {/if}
  {/if}
</div>