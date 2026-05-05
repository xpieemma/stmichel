<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  type HistoryItem = {
    id: number; title: string; content: string | null;
    year: number | null; image_url: string | null;
    published: number; sort_order: number;
  };

  let items = $state<HistoryItem[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const r = await fetch('/api/admin/history');
    if (r.ok) { const d = await r.json(); items = d.items; }
    loading = false;
  });

  async function del(id: number) {
    if (!confirm('Efase istwa sa a?')) return;
    const r = await fetch(`/api/admin/history?id=${id}`, { method: 'DELETE' });
    if (r.ok) items = items.filter(i => i.id !== id);
  }
</script>

<svelte:head><title>Istwa | Admin</title></svelte:head>

<div class="p-4 max-w-5xl mx-auto pb-20">
  <header class="flex items-center justify-between mb-6">
    <div>
      <a href={resolve("/admin/dashboard")} class="text-sm text-text-muted hover:underline">← Dashboard</a>
      <h1 class="text-2xl font-bold mt-1">📜 Jere Istwa</h1>
    </div>
    <button onclick={() => goto(resolve('/admin/dashboard/history/new'))}
      class="bg-haiti-blue text-white px-4 py-2 rounded-full">+ Nouvo Istwa</button>
  </header>

  {#if loading}
    <p class="text-text-muted text-center py-10">Chajman...</p>
  {:else if items.length === 0}
    <div class="text-center py-16 bg-smoke-white rounded-2xl">
      <p class="text-4xl mb-3">📜</p>
      <p class="text-text-muted">Pa gen istwa ankò</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each items as h (h.id)}
        <div class="bg-card-white rounded-2xl border border-border-light p-4 flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-haiti-blue/10 flex items-center justify-center text-haiti-blue font-bold text-lg shrink-0">
            {h.year || '—'}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold truncate">{h.title}</h3>
            <p class="text-sm text-text-muted line-clamp-1">{h.content || 'Pa gen kontni'}</p>
            <span class="text-xs {h.published ? 'text-green-600' : 'text-gray-400'}">{h.published ? '✅ Pibliye' : '📝 Bouyon'}</span>
          </div>
          <div class="flex gap-2 shrink-0">
            <button onclick={() => goto(`/admin/dashboard/history/${h.id}`)}
              class="text-sm px-3 py-1.5 rounded-full border border-border-light">✏️</button>
            <button onclick={() => del(h.id)}
              class="text-sm px-3 py-1.5 rounded-full border border-red-200 text-haiti-red">🗑️</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>