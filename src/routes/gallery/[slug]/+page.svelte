<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getLocalDB } from '$lib/db/client';
  import { albums, albumPhotos } from '$lib/db/schema';
  import { eq } from 'drizzle-orm';
  import ShareButton from '$components/ShareButton.svelte';

  let album = $state<any | null>(null);
  let photos = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const db = await getLocalDB();
    if (db) {
      album = await db.select().from(albums).where(eq(albums.slug, $page.params.slug)).get();
      if (album) photos = await db.select().from(albumPhotos).where(eq(albumPhotos.albumId, album.id)).orderBy(albumPhotos.sortOrder).all();
    }
    loading = false;
  });
</script>

<svelte:head><title>{album?.title || 'Album'} | Galeri</title></svelte:head>

<div class="pb-20">
  {#if loading}<p class="text-center py-10">Chaje...</p>{:else if !album}<p class="text-center py-10">Album pa jwenn.</p>{:else}
    <header class="mb-5"><h1 class="text-2xl font-semibold">{album.title}</h1>{#if album.description}<p class="text-text-secondary">{album.description}</p>{/if}</header>
    {#if photos.length === 0}<p class="text-text-muted">Pa gen foto nan album sa a.</p>{:else}
      <div class="columns-2 gap-3 space-y-3">
        {#each photos as p}
          <div class="break-inside-avoid bg-card-white rounded-xl overflow-hidden border border-border-light"><img src={p.imageUrl} alt={p.caption || ''} class="w-full" />{#if p.caption}<p class="p-2 text-xs text-text-secondary">{p.caption}</p>{/if}</div>
        {/each}
      </div>
    {/if}
    <div class="mt-6 flex justify-center"><ShareButton title={album.title} text={album.description || ''} url={`https://stmichel.ht/gallery/${album.slug}`} /></div>
  {/if}
</div>
