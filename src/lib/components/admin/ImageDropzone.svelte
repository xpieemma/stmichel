


<script lang="ts">
  import { compressImage } from '$lib/media/compress';

  let {
    handleFile,
    accept = 'image/jpeg,image/webp',
    maxSize = 10 * 1024 * 1024,
    doCompress = true
  }: {
    handleFile: (file: File) => void;
    accept?: string;
    maxSize?: number;
    doCompress?: boolean;
  } = $props();

  let dragging = $state(false);
  let previewUrl = $state<string | null>(null);
  let originalSize = $state('');
  let compressedSize = $state('');
  let processing = $state(false);
  let error = $state('');

  let fileInput: HTMLInputElement;

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    dragging = true;
  }
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragging = false;
  }
  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) processFile(file);
  }

  async function processFile(file: File) {
    if (!['image/jpeg', 'image/webp'].includes(file.type)) {
      error = 'Sèlman imaj JPG ak WebP yo aksepte.';
      return;
    }
    if (file.size > maxSize) {
      error = `Fichye a twò gwo (max ${formatBytes(maxSize)}).`;
      return;
    }
    error = '';
    originalSize = formatBytes(file.size);
    previewUrl = null;
    compressedSize = '';

    if (doCompress) {
      processing = true;
      try {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File(
          [compressedBlob],
          file.name.replace(/\.[^.]+$/, '') + '.jpg',
          { type: 'image/jpeg' }
        );
        compressedSize = formatBytes(compressedFile.size);
        previewUrl = URL.createObjectURL(compressedFile);
        processing = false;
        handleFile(compressedFile);
      } catch (err) {
        error = 'Pwoblèm pandan konpresyon.';
        processing = false;
        console.error(err);
      }
    } else {
      previewUrl = URL.createObjectURL(file);
      handleFile(file);
    }
  }

  function openFileDialog() {
    fileInput?.click();
  }
</script>

<div
  class="relative border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer
         {dragging ? 'border-haiti-blue bg-blue-50/30' : 'border-border-light hover:border-haiti-blue/50'}"
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onclick={openFileDialog}
  onkeydown={(e) => e.key === 'Enter' && openFileDialog()}
  role="button"
  tabindex="0"
>
  <input type="file" accept={accept} class="hidden" bind:this={fileInput} onchange={handleFileChange} />

  {#if processing}
    <div class="space-y-2">
      <div class="animate-pulse text-haiti-blue font-medium">Ap optimize imaj la…</div>
      <p class="text-sm text-text-muted">Diminye gwosè pou ekonomize done itilizatè yo.</p>
    </div>
  {:else if error}
    <div class="text-haiti-red text-sm">{error}</div>
    <button type="button" class="mt-2 text-xs underline" onclick={openFileDialog}>Eseye ankò</button>
  {:else if previewUrl}
    <div class="space-y-2">
      <img src={previewUrl} alt="Preview" class="max-h-40 mx-auto rounded-lg shadow-sm" />
      <p class="text-sm">
        <span class="text-text-muted">Original: {originalSize}</span>
        {#if compressedSize}
          <span class="mx-1 text-haiti-blue font-semibold">→</span>
          <span class="text-haiti-blue font-semibold">Optimizé: {compressedSize}</span>
          <span class="text-green-600 text-xs ml-1">
            ({Math.round((1 - parseFloat(compressedSize) / parseFloat(originalSize)) * 100)}% redui)
          </span>
        {/if}
      </p>
      <p class="text-xs text-text-muted">Klike pou chanje imaj la.</p>
    </div>
  {:else}
    <div class="space-y-2">
      <span class="text-4xl">📁</span>
      <p class="font-medium">Glise yon imaj isit</p>
      <p class="text-xs text-text-muted">Osnon klike pou chwazi yon fichye</p>
      {#if doCompress}
        <p class="text-xs text-haiti-blue">Imaj la ap optimize otomatikman pou sove espas.</p>
      {/if}
    </div>
  {/if}
</div>