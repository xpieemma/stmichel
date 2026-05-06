


<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { compressImage } from '$lib/media/compress';
  import { cropImageToCanvas, canvasToJpegBlob } from '$lib/media/crop';

  const ASPECT = 16 / 9;

  // Routing State
  let id = $derived($page.params.id);
  let isNew = $derived(id === 'new');
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');

  // Crop State
  let cropFile = $state<File | null>(null);
  let cropImg = $state<HTMLImageElement | null>(null);
  let cropScale = $state(1);
  let cropX = $state(0); 
  let cropY = $state(0);
  let cropping = $state(false);
  let cropCanvas = $state<HTMLCanvasElement | null>(null);
  let lastX = 0, lastY = 0;

  let form = $state({
    id: 0,
    title: '',
    description: '',
    location: '',
    image_url: '',
    event_date: '',
    event_time: '',
    category: 'general',
    published: 0,
    featured: 0
  });

  onMount(async () => {
    if (isNew) {
      loading = false;
      return;
    }
    try {
      const r = await fetch('/api/admin/events');
      if (!r.ok) throw new Error('Failed to load');
      const data = await r.json();
      const ev = data.items.find((e: any) => e.id === parseInt(id!, 10));
      if (ev) {
        form = { ...form, ...ev };
      } else {
        error = 'Evènman pa jwenn';
      }
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  });

  function onFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    
    if (!['image/jpeg', 'image/webp', 'image/png'].includes(file.type)) {
      alert('Sèlman JPG, PNG, ak WebP yo aksepte.');
      return;
    }
    
    cropFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => { 
        cropImg = img;
        cropScale = 1;

        // ✅ Corrected Aspect Ratio Initial Centering
        const w = img.width, h = img.height;
        const imageAspect = w / h;
        
        let baseCropW = w, baseCropH = h;
        if (imageAspect > ASPECT) {
          baseCropW = h * ASPECT; // Image is wider, constrain by height
        } else {
          baseCropH = w / ASPECT; // Image is taller, constrain by width
        }
        
        cropX = (w - baseCropW) / 2;
        cropY = (h - baseCropH) / 2;
        
        cropping = true;
        await tick(); // Wait for canvas to mount in DOM
        drawCropCanvas();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function drawCropCanvas() {
    if (!cropImg || !cropCanvas) return;
    const img = cropImg;
    const w = img.width, h = img.height;
    const imageAspect = w / h;

    // ✅ Corrected base crop dimensions
    let baseCropW = w, baseCropH = h;
    if (imageAspect > ASPECT) {
      baseCropW = h * ASPECT;
    } else {
      baseCropH = w / ASPECT;
    }

    // ✅ Apply scale correctly (zoom in means smaller source crop box)
    const cropW = baseCropW / cropScale;
    const cropH = baseCropH / cropScale;

    // Clamp panning to image boundaries
    cropX = Math.max(0, Math.min(cropX, w - cropW));
    cropY = Math.max(0, Math.min(cropY, h - cropH));

    const canvas = cropCanvas;
    const containerWidth = canvas.parentElement!.clientWidth;
    canvas.width = containerWidth;
    canvas.height = containerWidth / ASPECT;
    
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
  }

  // Pointer handlers for pan
  function cropPointerDown(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function cropPointerMove(e: PointerEvent) {
    if (e.buttons !== 1) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    
    const scaleInv = (cropImg!.width / cropScale) / cropCanvas!.offsetWidth;
    cropX -= dx * scaleInv;
    cropY -= dy * scaleInv;
    drawCropCanvas();
  }

  function cropPointerUp(e: PointerEvent) {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function cropWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    // ✅ Clamp zoom between 1x (fit) and 4x (zoom)
    cropScale = Math.max(1, Math.min(4, cropScale * delta));
    drawCropCanvas();
  }

  async function confirmCrop() {
    if (!cropImg || !cropCanvas) return;
    cropping = false;
    
    const img = cropImg;
    const w = img.width, h = img.height;
    const imageAspect = w / h;

    // ✅ Re-apply the exact same corrected math used in draw function
    let baseCropW = w, baseCropH = h;
    if (imageAspect > ASPECT) {
      baseCropW = h * ASPECT;
    } else {
      baseCropH = w / ASPECT;
    }

    const cropW = baseCropW / cropScale;
    const cropH = baseCropH / cropScale;

    const sx = Math.max(0, Math.min(cropX, w - cropW));
    const sy = Math.max(0, Math.min(cropY, h - cropH));

    const croppedCanvas = cropImageToCanvas(img, sx, sy, cropW, cropH);
    const croppedBlob = await canvasToJpegBlob(croppedCanvas, 0.8);
    const crushedBlob = await compressImage(new File([croppedBlob], cropFile!.name, { type: 'image/jpeg' }));
    
    form.image_url = URL.createObjectURL(crushedBlob); 
  }

  async function save() {
    if (!form.title.trim()) { error = 'Tit la obligatwa'; return; }
    saving = true;
    error = '';
    try {
      const method = isNew ? 'POST' : 'PUT';
      const payload = {
        id: isNew ? undefined : parseInt(id!, 10),
        title: form.title,
        description: form.description,
        location: form.location,
        date: form.event_date,
        time: form.event_time,
        imageUrl: form.image_url,
        type: form.category,
        published: form.published,
        lat: null, 
        lng: null 
      };
      
      const r = await fetch('/api/admin/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        throw new Error(b.error || 'Echwe sove');
      }
      goto(resolve('/admin/dashboard/events'));
    } catch (e) {
      error = (e as Error).message;
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head><title>{isNew ? 'Nouvo' : 'Modifye'} Evènman | Admin</title></svelte:head>

<div class="p-4 max-w-2xl mx-auto pb-20">
  <header class="mb-6">
    <a href={resolve("/admin/dashboard/events")} class="text-sm text-text-muted hover:underline">← Retounen</a>
    <h1 class="text-2xl font-bold mt-1">{isNew ? '🆕 Nouvo Evènman' : '✏️ Modifye Evènman'}</h1>
  </header>

  {#if loading}
    <p class="text-text-muted">Chajman...</p>
  {:else}
    <form onsubmit={(e) => { e.preventDefault(); save(); }} class="space-y-4">
      {#if error}
        <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-haiti-red text-sm">{error}</div>
      {/if}

      <label class="block">
        <span class="font-medium">Tit *</span>
        <input type="text" bind:value={form.title} required
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" />
      </label>

      <label class="block">
        <span class="font-medium">Deskripsyon</span>
        <textarea bind:value={form.description} rows="4"
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1"></textarea>
      </label>

      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <span class="font-medium">Dat</span>
          <input type="date" bind:value={form.event_date}
            class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" />
        </label>
        <label class="block">
          <span class="font-medium">Lè</span>
          <input type="time" bind:value={form.event_time}
            class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" />
        </label>
      </div>

      <label class="block">
        <span class="font-medium">Kote</span>
        <input type="text" bind:value={form.location} placeholder="eg. Legliz St Michel"
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" />
      </label>

      <label class="block">
        <span class="font-medium">Voye Imaj (16:9)</span>
        <input type="file" accept="image/jpeg, image/webp, image/png" onchange={onFileChange}
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1" />
      </label>

      {#if form.image_url && !cropping}
        <img src={form.image_url} alt="Preview" class="w-full aspect-video object-cover rounded-xl border" />
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <span class="font-medium">Kategori</span>
          <select bind:value={form.category}
            class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mt-1">
            <option value="general">Jeneral</option>
            <option value="religion">Relijyon</option>
            <option value="music">Mizik</option>
            <option value="culture">Kilti</option>
            <option value="food">Manje</option>
            <option value="sport">Espò</option>
          </select>
        </label>
        <div class="space-y-3 pt-7">
          <label class="flex items-center gap-2">
            <input type="checkbox" 
              checked={form.published === 1} 
              onchange={(e) => form.published = e.currentTarget.checked ? 1 : 0}
              class="w-5 h-5 rounded" />
            <span class="font-medium">Pibliye</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" 
              checked={form.featured === 1} 
              onchange={(e) => form.featured = e.currentTarget.checked ? 1 : 0}
              class="w-5 h-5 rounded" />
            <span class="font-medium">Featured ⭐</span>
          </label>
        </div>
      </div>

      {#if cropping && cropImg}
        <div class="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div class="bg-card-white rounded-2xl p-4 w-full max-w-lg">
            <h3 class="font-semibold mb-2">Kadraj imaj (16:9)</h3>
            <div class="relative overflow-hidden border rounded-xl bg-gray-100"
                 style="width:100%; aspect-ratio:{ASPECT}; touch-action:none; user-select:none;"
                 onpointerdown={cropPointerDown} onpointermove={cropPointerMove}
                 onpointerup={cropPointerUp} onpointercancel={cropPointerUp} onpointerleave={cropPointerUp} onwheel={cropWheel}>
              <canvas bind:this={cropCanvas} width="0" height="0" class="absolute top-0 left-0 w-full h-full"></canvas>
            </div>
            <p class="text-xs text-text-muted mt-1">Sèvi ak touch/sourit pou deplase. Woulet pou zoom.</p>
            <div class="flex gap-3 mt-3">
              <button type="button" onclick={confirmCrop} class="bg-haiti-blue text-white px-4 py-2 rounded-full">Konfime</button>
              <button type="button" onclick={() => cropping = false} class="border px-4 py-2 rounded-full">Anile</button>
            </div>
          </div>
        </div>
      {/if}

      <div class="flex gap-3 pt-4">
        <button type="submit" disabled={saving}
          class="bg-haiti-blue text-white px-6 py-3 rounded-full font-medium disabled:opacity-50">
          {saving ? 'Sove...' : (isNew ? '✅ Kreye Evènman' : '💾 Sove Chanjman')}
        </button>
        <button type="button" onclick={() => goto(resolve('/admin/dashboard/events'))}
          class="border border-border-light px-6 py-3 rounded-full">Anile</button>
      </div>
    </form>
  {/if}
</div>