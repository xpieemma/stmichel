<script lang="ts">
  import type { PageData } from './$types';
   let {data}: {data:PageData} = $props();
</script>
<svelte:head><title>Analitik | Admin</title></svelte:head>


<div class="p-4">
  <h1 class="text-2xl font-semibold mb-4">📊 Analytics</h1>

  {#if data.degraded}
    <div class="mb-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm">
      ⚠️ Database binding unavailable — showing zeros. Check D1 binding in <code>wrangler.toml</code>.
    </div>
  {/if}

  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-card-white rounded-2xl p-4 text-center border border-border-light">
      <h2 class="text-4xl font-bold text-haiti-blue">{data.stats.totalEvents}</h2>
      <p class="text-sm text-text-muted mt-1">Evènman</p>
    </div>
    <div class="bg-card-white rounded-2xl p-4 text-center border border-border-light">
      <h2 class="text-4xl font-bold text-haiti-blue">{data.stats.totalMatches}</h2>
      <p class="text-sm text-text-muted mt-1">Match</p>
    </div>
    <div class="bg-card-white rounded-2xl p-4 text-center border border-border-light">
      <h2 class="text-4xl font-bold text-haiti-blue">{data.stats.totalStamps}</h2>
      <p class="text-sm text-text-muted mt-1">Kache Kolekte</p>
    </div>
    <div class="bg-card-white rounded-2xl p-4 text-center border border-border-light">
      <h2 class="text-4xl font-bold text-haiti-blue">{data.stats.totalFeedback}</h2>
      <p class="text-sm text-text-muted mt-1">Feedback</p>
    </div>
  </div>

  <p class="text-xs text-text-muted mt-6">
    Estatistik yo soti dirèkteman nan baz done D1 sou bò sèvè a (pa OPFS lokal).
  </p>
</div>
