<script lang="ts">
  import { onMount } from 'svelte';

  type AllowlistItem = {
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

  let items = $state<AllowlistItem[]>([]);
  let me = $state<string | null>(null);
  let loading = $state(true);
  let error = $state('');
  let actionLoading = $state<string | null>(null);
  let actionError = $state('');

  const pendingCount = $derived(
    items.filter((i) => i.status === 'pending').length
  );

  onMount(load);

  async function load() {
    loading = true;
    error = '';
    try {
      const r = await fetch('/api/admin/allowlist', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!r.ok) throw new Error(`Failed to load (${r.status})`);
      const data = await r.json();
      items = data.items ?? [];
      me = data.me ?? null;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function review(username: string, action: 'approve' | 'reject') {
    if (!confirm(`${action === 'approve' ? 'Apwouve' : 'Rejte'} ${username}?`)) {
      return;
    }

    actionLoading = username;
    actionError = '';
    try {
      const r = await fetch('/api/admin/allowlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ username, action })
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        actionError = body.error || `Erè (${r.status})`;
        return;
      }
      await load();
    } catch (e) {
      actionError = (e as Error).message;
    } finally {
      actionLoading = null;
    }
  }

  async function remove(username: string) {
    if (username === me) {
      alert('Ou pa ka retire pwòp tèt ou.');
      return;
    }
    if (!confirm(`Retire ${username} nèt? Sa ap fèmen tout sesyon yo tou.`)) {
      return;
    }

    actionLoading = username;
    actionError = '';
    try {
      const r = await fetch(
        `/api/admin/allowlist?username=${encodeURIComponent(username)}`,
        {
          method: 'DELETE',
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        }
      );
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        actionError = body.error || `Erè (${r.status})`;
        return;
      }
      await load();
    } catch (e) {
      actionError = (e as Error).message;
    } finally {
      actionLoading = null;
    }
  }

  function formatDate(ts: number | null) {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleString('fr-HT');
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    bootstrap: 'bg-purple-100 text-purple-800'
  };

  const statusLabels: Record<string, string> = {
    pending: '⏳ An Atant',
    approved: '✅ Apwouve',
    rejected: '❌ Rejte',
    bootstrap: '🌱 Bootstrap'
  };
</script>

<svelte:head><title>Allowlist Admin | ST MICHEL</title></svelte:head>

<div class="p-6 max-w-5xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold">
      🔐 Allowlist Admin
      {#if pendingCount > 0}
        <span class="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
          {pendingCount} an atant
        </span>
      {/if}
    </h1>
    <a href="/admin/dashboard" class="text-haiti-blue underline text-sm">
      ← Retounen Dashboard
    </a>
  </div>

  {#if actionError}
    <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 flex justify-between">
      <span>⚠️ {actionError}</span>
      <button onclick={() => (actionError = '')} aria-label="Fèmen">✕</button>
    </div>
  {/if}

  {#if loading}
    <p class="text-text-muted">Chajman...</p>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
      <p>Erè: {error}</p>
      <button type="button" onclick={load} class="mt-2 text-sm underline">
        Eseye ankò
      </button>
    </div>
  {:else if items.length === 0}
    <div class="bg-smoke-white rounded-2xl p-8 text-center">
      <p class="text-text-muted text-lg">Allowlist la vid 🎉</p>
    </div>
  {:else}
    {#each items as item (item.username)}
      <div class="bg-card-white rounded-2xl p-5 mb-4 border border-border-light shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2 flex-wrap">
              <span class="font-semibold text-lg">{item.username}</span>
              {#if item.username === me}
                <span class="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                  Ou
                </span>
              {/if}
              <span class="px-2 py-0.5 rounded-full text-xs font-medium {statusColors[item.status]}">
                {statusLabels[item.status] ?? item.status}
              </span>
            </div>
            {#if item.email}
              <p class="text-sm text-text-secondary mb-1">📧 {item.email}</p>
            {/if}
            {#if item.note}
              <p class="text-xs text-text-muted">📝 {item.note}</p>
            {/if}
            {#if item.requested_at}
              <p class="text-xs text-text-muted mt-1">
                Soumèt: {formatDate(item.requested_at)}
              </p>
            {/if}
            {#if item.reviewed_by}
              <p class="text-xs text-text-muted">
                Revize pa {item.reviewed_by} — {formatDate(item.reviewed_at)}
              </p>
            {:else if item.added_by}
              <p class="text-xs text-text-muted">
                Ajoute pa {item.added_by} — {formatDate(item.added_at)}
              </p>
            {/if}
          </div>

          <div class="flex flex-col gap-2 shrink-0">
            {#if item.status === 'pending'}
              <button
                type="button"
                onclick={() => review(item.username, 'approve')}
                disabled={actionLoading === item.username}
                class="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === item.username ? '...' : '✅ Apwouve'}
              </button>
              <button
                type="button"
                onclick={() => review(item.username, 'reject')}
                disabled={actionLoading === item.username}
                class="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === item.username ? '...' : '❌ Rejte'}
              </button>
            {/if}

            {#if item.username !== me}
              <button
                type="button"
                onclick={() => remove(item.username)}
                disabled={actionLoading === item.username}
                class="px-4 py-2 border border-red-300 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                🗑️ Retire
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>