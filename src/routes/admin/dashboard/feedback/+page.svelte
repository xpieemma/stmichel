<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';

  type Feedback = {
    id: number; name: string | null; email: string | null;
    message: string; rating: number | null; created_at: number;
  };

  let items = $state<Feedback[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const r = await fetch('/api/admin/feedback');
    if (r.ok) { const d = await r.json(); items = d.items; }
    loading = false;
  });

  function fmt(ts: number) {
    return new Date(ts * 1000).toLocaleString('fr-HT');
  }
</script>

<svelte:head><title>Feedback | Admin</title></svelte:head>

<div class="p-4 max-w-5xl mx-auto pb-20">
  <header class="mb-6">
    <a href={resolve("/admin/dashboard")} class="text-sm text-text-muted hover:underline">← Dashboard</a>
    <h1 class="text-2xl font-bold mt-1">💬 Feedback</h1>
  </header>

  {#if loading}
    <p class="text-text-muted text-center py-10">Chajman...</p>
  {:else if items.length === 0}
    <div class="text-center py-16 bg-smoke-white rounded-2xl">
      <p class="text-4xl mb-3">💬</p>
      <p class="text-text-muted">Pa gen feedback ankò</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each items as fb (fb.id)}
        <div class="bg-card-white rounded-2xl border border-border-light p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <span class="font-semibold">{fb.name || 'Anonim'}</span>
              {#if fb.email}<span class="text-xs text-text-muted ml-2">{fb.email}</span>{/if}
            </div>
            {#if fb.rating}
              <span class="text-yellow-500">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
            {/if}
          </div>
          <p class="text-sm text-text-secondary">{fb.message}</p>
          <p class="text-xs text-text-muted mt-2">{fmt(fb.created_at)}</p>
        </div>
      {/each}
    </div>
  {/if}
   <!-- {#if data.recentFeedback?.length}
      <div>
        <h2 class="text-lg font-semibold mb-3">💬 Dènye Feedback</h2>
        <div class="space-y-3">
          {#each data.recentFeedback as fb: any (fb.id)}
            <div class="bg-card-white rounded-2xl border border-border-light p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-sm">{fb.event_title || 'Jeneral'}</span>
                {#if fb.rating}
                  <span class="text-yellow-500">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                {/if}
              </div>
              <p class="text-sm text-text-secondary line-clamp-2">{fb.comment}</p>
              <p class="text-xs text-text-muted mt-1">{formatDate(fb.created_at)}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if} -->
</div>


   