<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getLocalDB } from '$lib/db/client';
  import { albums, albumPhotos } from '$lib/db/schema';
  import { eq } from 'drizzle-orm';
  import { syncToServer } from '$lib/db/sync';
  import { resolve } from '$app/paths';
  import { compressImage } from '$lib/media/compress';


const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024; // 10 MB limit before compression
const ALLOWED_TYPES = ['image/jpeg', 'image/webp'];

  let id = $page.params.id;
  let isNew = $derived(id === 'new');
  let form = $state({ title: '', description: '', coverImageUrl: '', published: 1 });
  let photos: any[] = $state([]);
  let loading = $state(!$page.params.id || $page.params.id === 'new' ? false : true);

  let fileInput: HTMLInputElement | null = $state(null);
  let uploading = $state(false);

  async function addPhotoFromUrl() {
    const url = prompt('Kole URL foto a:');
    if (!url) return;
    await savePhotoToDatabase(url);
  }

  async function handleFileUpload(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
    alert('Sèlman imaj JPG ak WebP yo aksepte. Pa gen PNG oswa lòt fòma.');
    target.value = '';
    return;
  }

  if (file.size > MAX_ORIGINAL_SIZE) {
    alert('Fichye a twò gwo. Diminye gwosè a avan ou telechaje.');
    target.value = '';
    return;
  }
    // Client-side validation
    if (!['image/jpeg', 'image/webp'].includes(file.type)) {
      alert('Tanpri chwazi yon imaj JPG oswa WebP (Pa gen PNG).');
      target.value = ''; // Reset input
      return;
    }

    uploading = true;
    try {

      // 1. Compress the image before uploading
    const compressedBlob = await compressImage(file);
    // 2. Create a new File from the Blob with original name
    const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', compressedFile);

      // Send to our new R2 endpoint
      const r = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (!r.ok) throw new Error((await r.json()).error || 'Echwe chaje imaj la');
      
      const { url } = await r.json();
      
      // Once uploaded, save it to the DB just like the URL method!
      await savePhotoToDatabase(url);
      
    } catch (err) {
      alert((err as Error).message);
    } finally {
      uploading = false;
      target.value = ''; // Reset input so they can upload the same file again if needed
    }
  }

  async function savePhotoToDatabase(imageUrl: string) {
    const caption = prompt('Deskripsyon (opsyonèl):') || '';
    try {
      const resp = await fetch('/api/admin/album-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: parseInt(id!, 10), imageUrl, caption, sortOrder: photos.length
        })
      });
      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || 'Echwe');
      const saved = await resp.json();
      photos = [...photos, { id: saved.id, imageUrl, caption }];
    } catch (err) { alert((err as Error).message); }
  }

  onMount(async () => {
    if (!isNew) {
      const db = await getLocalDB();
      if (db) {
        const album = await db.select().from(albums).where(eq(albums.id, parseInt(id!, 10))).get();
        if (album) {
          form = { ...album };
          photos = await db.select().from(albumPhotos).where(eq(albumPhotos.albumId, album.id)).all();
        }
        loading = false;
      }
    }
  });

  async function save() {
    const db = await getLocalDB();
    if (!db) return;
    if (isNew) {
      const slug = form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const result = await db.insert(albums)
        .values({ ...form, slug, createdAt: Math.floor(Date.now() / 1000), updatedAt: Math.floor(Date.now() / 1000) })
        .returning({ id: albums.id }).get();
      id = result.id.toString();
      isNew = false;
      goto(resolve(`/admin/dashboard/albums/${id}`));
    } else {
      await db.update(albums)
        .set({ ...form, updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(albums.id, parseInt(id!, 10)));
    }
    await syncToServer('albums', form);
  }

  async function removePhoto(photoId: number, i: number) {
    if (!confirm('Efase foto sa a?')) return;
    const resp = await fetch('/api/admin/album-photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photoId })
    });
    if (resp.ok) photos = photos.filter((_, idx) => idx !== i);
    else alert('Pa ka efase foto a');
  }

  function setAsCover(url: string) { form.coverImageUrl = url; }
</script>

<svelte:head><title>{isNew ? 'Nouvo' : 'Modifye'} Albòm | Admin</title></svelte:head>

<div class="p-4 max-w-2xl mx-auto pb-20">
  <header class="mb-4 flex items-center justify-between">
    <h1 class="text-2xl font-semibold">{isNew ? 'Nouvo Albòm' : 'Modifye Albòm'}</h1>
    <a href={resolve("/admin/dashboard/albums")} class="text-sm text-text-muted hover:underline">← Tounen</a>
  </header>

  {#if loading}
    <p class="text-text-muted">Chaje...</p>
  {:else}
    <form onsubmit={(e) => { e.preventDefault(); save(); }} class="space-y-4">
      <label class="block"><span class="font-medium">Tit</span>
        <input type="text" bind:value={form.title} class="w-full p-2 border rounded mt-1" required /></label>
      <label class="block"><span class="font-medium">Deskripsyon</span>
        <textarea bind:value={form.description} rows="3" class="w-full p-2 border rounded mt-1"></textarea></label>
      <label class="block"><span class="font-medium">URL Kouvèti</span>
        <input type="url" bind:value={form.coverImageUrl} class="w-full p-2 border rounded mt-1" /></label>
      {#if form.coverImageUrl}
        <img src={form.coverImageUrl} alt="Cover" class="w-24 h-24 object-cover rounded-xl border" />
      {/if}
      <div class="flex gap-2">
        <button type="submit" class="bg-haiti-blue text-white px-4 py-2 rounded-full">Sove</button>
        <button type="button" onclick={() => goto(resolve('/admin/dashboard/albums') )} class="border px-4 py-2 rounded-full">Anile</button>
      </div>
    </form>

    {#if !isNew}
      <section class="mt-8 border-t pt-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-semibold">📷 Foto yo ({photos.length})</h2>
          
          <div class="flex gap-2 items-center">
            {#if uploading}
              <span class="text-sm text-text-muted animate-pulse">Ap chaje...</span>
            {:else}
              <input 
                type="file" 
                accept="image/jpeg, image/webp" 
                bind:this={fileInput} 
                onchange={handleFileUpload} 
                class="hidden" 
              />
              
              <button onclick={() => fileInput.click()} class="bg-haiti-blue text-white px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-90">
                + Chaje Foto
              </button>
              
              <button onclick={addPhotoFromUrl} class="border border-border-light text-text-secondary px-3 py-1.5 rounded-full text-sm hover:bg-smoke-white">
                🔗 Mete URL
              </button>
            {/if}
          </div>
        </div>

        {#if photos.length}
          <div class="grid grid-cols-3 gap-3">
            {#each photos as p, i (p.id)}
              <div class="relative group rounded-xl overflow-hidden border border-border-light">
                <img src={p.imageUrl} alt={p.caption || ''} class="w-full h-28 object-cover" />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onclick={() => setAsCover(p.imageUrl)} class="bg-white text-haiti-blue rounded-full px-2 py-1 text-xs shadow">🖼️</button>
                  <button onclick={() => removePhoto(p.id, i)} class="bg-white text-haiti-red rounded-full px-2 py-1 text-xs shadow">✕</button>
                </div>
                {#if form.coverImageUrl === p.imageUrl}
                  <span class="absolute top-1 left-1 bg-haiti-blue text-white text-[10px] px-1.5 py-0.5 rounded-full">Kouvèti</span>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-text-muted text-sm text-center py-6">Pa gen foto ankò.</p>
        {/if}
      </section>
    {:else}
      <p class="text-sm text-text-muted mt-6 text-center">💡 Sove albòm nan anvan pou ka ajoute foto.</p>
    {/if}
  {/if}
</div>