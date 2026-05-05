<script lang="ts">
  import { onMount } from 'svelte';

  type AdminRequest = {
    id: number;
    username: string;
    email: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: number;
    reviewed_by: string | null;
    reviewed_at: number | null;
    reject_reason: string | null;
  };

  let requests = $state<AdminRequest[]>([]);
  let loading = $state(true);
  let error = $state('');
  let actionLoading = $state<number | null>(null);

  onMount(loadRequests);

  async function loadRequests() {
    loading = true;
    try {
      const r = await fetch('/admin/api/requests');
      if (!r.ok) throw new Error('Failed to load');
      const data = await r.json();
      requests = data.requests;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function handleAction(id: number, action: 'approve' | 'reject') {
    const reason = action === 'reject'
      ? prompt('Rezon rejeksyon (opsyonèl):') ?? ''
      : '';

    actionLoading = id;
    try {
      const r = await fetch('/admin/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, reason })
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        alert(body.error || 'Erè');
        return;
      }
      // Reload list
      await loadRequests();
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
    rejected: 'bg-red-100 text-red-800'
  };

  const statusLabels: Record<string, string> = {
    pending: '⏳ An Atant',
    approved: '✅ Apwouve',
    rejected: '❌ Rejte'
  };
</script>

<svelte:head><title>Demann Admin | ST MICHEL</title></svelte:head>

<div class="p-6 max-w-5xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold">📋 Demann Aksè Admin</h1>
    <a href="/admin/dashboard" class="text-haiti-blue underline text-sm">← Retounen Dashboard</a>
  </div>

  {#if loading}
    <p class="text-text-muted">Chajman...</p>
  {:else if error}
    <p class="text-haiti-red">Erè: {error}</p>
  {:else if requests.length === 0}
    <div class="bg-smoke-white rounded-2xl p-8 text-center">
      <p class="text-text-muted text-lg">Pa gen demann pou kounye a 🎉</p>
    </div>
  {:else}
    <!-- Pending first -->
    {#each requests as req (req.id)}
      <div class="bg-card-white rounded-2xl p-5 mb-4 border border-border-light shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <!-- Left: info -->
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="font-semibold text-lg">{req.username}</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium {statusColors[req.status]}">
                {statusLabels[req.status]}
              </span>
            </div>
            <p class="text-sm text-text-secondary mb-1">📧 {req.email}</p>
            <p class="text-xs text-text-muted">
              Soumèt: {formatDate(req.requested_at)}
            </p>
            {#if req.reviewed_by}
              <p class="text-xs text-text-muted">
                Revize pa: {req.reviewed_by} — {formatDate(req.reviewed_at)}
              </p>
            {/if}
            {#if req.reject_reason}
              <p class="text-xs text-haiti-red mt-1">Rezon: {req.reject_reason}</p>
            {/if}
          </div>

          <!-- Right: actions (only for pending) -->
          {#if req.status === 'pending'}
            <div class="flex gap-2 shrink-0">
              <button
                onclick={() => handleAction(req.id, 'approve')}
                disabled={actionLoading === req.id}
                class="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium
                       hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === req.id ? '...' : '✅ Apwouve'}
              </button>
              <button
                onclick={() => handleAction(req.id, 'reject')}
                disabled={actionLoading === req.id}
                class="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium
                       hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === req.id ? '...' : '❌ Rejte'}
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>