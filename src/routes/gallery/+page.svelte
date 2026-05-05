<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocalDB } from '$lib/db/client';
  import { albums } from '$lib/db/schema';
  import { desc, eq } from 'drizzle-orm';
  import { resolve } from '$app/paths';

  let list = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const db = await getLocalDB();
    if (db) list = await db.select().from(albums).where(eq(albums.published, 1)).orderBy(desc(albums.createdAt)).all();
    loading = false;
  });
</script>
<svelte:head><title>Galeri | ST MICHEL</title></svelte:head>


<div class="pb-20">
  <header class="text-center mb-6"><h1 class="text-3xl font-semibold">📸 Galeri</h1><p class="text-text-muted">St Michel de l'Attalaye</p></header>
  {#if loading}<p class="text-center py-10 text-text-muted">Chaje album yo...</p>{:else if list.length === 0}<p class="text-center py-10 text-text-muted">Pa gen album piblik ankò.</p>{:else}
    <div class="grid grid-cols-2 gap-4">
      {#each list as album (album.id)}
        <a href={resolve(`/gallery/${album.slug}`)} class="block bg-card-white rounded-2xl overflow-hidden border border-border-light active:scale-[0.98] no-underline text-text-primary">
          {#if album.coverImageUrl}<img src={album.coverImageUrl} alt={album.title} class="w-full aspect-square object-cover" />{:else}<div class="w-full aspect-square bg-smoke-white flex items-center justify-center text-5xl">📷</div>{/if}
          <div class="p-3"><h3 class="font-semibold">{album.title}</h3>{#if album.description}<p class="text-xs text-text-secondary mt-1">{album.description}</p>{/if}</div>
        </a>
      {/each}
    </div>
  {/if}
</div>
