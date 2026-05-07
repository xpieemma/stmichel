<script lang="ts">
  let { 
    title = '',
    date = '',
    time = '',
    location = '',
    description = '',
    imageUrl = '',
    blurHash = '',
    compact = false
  }: {
    title: string;
    date?: string;
    time?: string;
    location?: string;
    description?: string;
    imageUrl?: string;
    blurHash?: string;
    compact?: boolean;
  } = $props();

  let formattedDate = $derived(date ? new Date(date).toLocaleDateString('ht-HT') : 'Dat pa presize');
  let previewText = $derived(description?.length > 120 ? description.substring(0, 120) + '...' : description);
</script>

<div class="bg-card-white rounded-3xl overflow-hidden border border-border-light shadow-card no-underline text-text-primary
            {compact ? 'max-w-xs' : ''}" style={compact ? 'pointer-events: none;' : ''}>
  {#if imageUrl}
    <div class="relative">
      <img src={imageUrl} alt={title} class="w-full h-44 object-cover" />
      {#if blurHash}
        <!-- we could render a tiny blurhash canvas here, but for preview it's optional -->
      {/if}
    </div>
  {/if}
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-1">{title || 'Tit evènman an...'}</h2>
    <div class="flex items-center gap-2 mb-2">
      <span class="w-1 h-4 bg-haiti-blue rounded-full"></span>
      <span class="text-sm text-text-secondary uppercase">{formattedDate}{time ? ' · ' + time : ''}</span>
    </div>
    {#if location}
      <p class="text-sm text-text-secondary mb-2">📍 {location}</p>
    {/if}
    <p class="text-text-secondary text-sm">{previewText}</p>
  </div>
</div>