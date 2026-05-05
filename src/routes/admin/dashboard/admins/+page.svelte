<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';

  type Row = {
    username: string;
    email: string | null;
    note: string | null;
    added_by: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'bootstrap';
    requested_at: number | null;
    reviewed_at: number | null;
    reviewed_by: string | null;
    added_at: number | null;
  };

  let rows = $state<Row[]>([]);
  let me = $state('');
  let loading = $state(true);
  let error = $state('');

  async function load() {
    loading = true; error = '';
    try {
      const r = await fetch('/api/admin/allowlist');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      rows = data.items;
      me = data.me;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function review(username: string, action: 'approve' | 'reject') {
    const r = await fetch('/api/admin/allowlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, action })
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      alert(body.error || `HTTP ${r.status}`);
      return;
    }
    await load();
  }

  async function remove(username: string) {
    if (!confirm(`Retire ${username} nèt?`)) return;
    const r = await fetch(`/api/admin/allowlist?username=${encodeURIComponent(username)}`, { method: 'DELETE' });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      alert(body.error || `HTTP ${r.status}`);
      return;
    }
    await load();
  }

  function fmt(ts: number | null): string {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleString('ht-HT');
  }

  onMount(load);
</script>

<svelte:head><title>Administratè yo | Admin</title></svelte:head>

<div class="p-4 max-w-3xl mx-auto pb-20">
  <header class="mb-6 flex items-center justify-between">
    <h1 class="text-2xl font-semibold">👥 Administratè yo</h1>
    <a href={resolve("/admin/dashboard")} class="text-sm text-text-muted hover:underline">← Tounen</a>
  </header>

  {#if error}
    <p class="text-haiti-red mb-4 text-sm">{error}</p>
  {/if}

  {#if loading}
    <p class="text-text-muted">Chaje...</p>
  {:else}
    {#if rows.filter((r) => r.status === 'pending').length === 0}
      <p class="text-sm text-text-muted mb-4">Pa gen demann nouvo administratè ki ap tann.</p>
    {:else}
      <h2 class="text-lg font-medium mb-2">Demann ki ap tann</h2>
      <div class="flex flex-col gap-2 mb-6">
        {#each rows.filter((r) => r.status === 'pending') as row (row.username)}
          <div class="bg-card-white border border-border-light rounded-2xl p-4">
            <div class="flex items-center justify-between mb-2">
              <div>
                <p class="font-medium">{row.email || row.username}</p>
                <p class="text-xs text-text-muted">{row.note || ''}</p>
                <p class="text-xs text-text-muted">Mande: {fmt(row.requested_at)}</p>
              </div>
              <div class="flex gap-2">
                <button onclick={() => review(row.username, 'approve')}
                  class="px-3 py-1 bg-haiti-blue text-white rounded-full text-sm">Aksepte</button>
                <button onclick={() => review(row.username, 'reject')}
                  class="px-3 py-1 border border-border-light text-text-secondary rounded-full text-sm">Refize</button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <h2 class="text-lg font-medium mb-2">Tout administratè</h2>
    <div class="flex flex-col gap-2">
      {#each rows.filter((r) => r.status !== 'pending') as row (row.username)}
        <div class="bg-card-white border border-border-light rounded-xl p-3 flex items-center justify-between">
          <div class="min-w-0">
            <p class="font-medium truncate">{row.email || row.username}
              <span class="text-xs ml-2 px-2 py-0.5 rounded-full
                {row.status === 'approved' ? 'bg-green-50 text-green-700' :
                 row.status === 'bootstrap' ? 'bg-yellow-50 text-yellow-700' :
                 'bg-red-50 text-red-700'}">
                {row.status}
              </span>
            </p>
            <p class="text-xs text-text-muted truncate">{row.note || ''}</p>
          </div>
          {#if row.username !== me}
            <button onclick={() => remove(row.username)}
              class="px-3 py-1 border border-border-light text-haiti-red rounded-full text-xs">Retire</button>
          {:else}
            <span class="text-xs text-text-muted px-3">(ou)</span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
