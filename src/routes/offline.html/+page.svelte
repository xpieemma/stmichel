
<svelte:head><title>Pa gen rezo | ST MICHEL</title></svelte:head>
<div class="min-h-screen flex items-center justify-center p-4">
  <div class="bg-card-white rounded-3xl p-8 text-center max-w-md shadow-card border border-border-light">
    <div class="text-5xl mb-4">📡</div>
    <h1 class="text-2xl font-semibold mb-2">Ou pa konekte</h1>
    <p class="text-text-secondary mb-6">Done lokal yo toujou disponib.</p>
    <div class="flex flex-col gap-3">
      <a href="/" class="bg-haiti-blue text-white py-3 px-6 rounded-full font-medium">🏠 Paj Prensipal</a>
      <a href="/map" class="border border-border-light py-3 px-6 rounded-full font-medium text-text-secondary">🗺️ Kat la</a>
      <button onclick={() => window.location.reload()} class="text-haiti-blue font-medium">🔄 Eseye Rekonekte</button>
    </div>
    <p class="text-xs text-text-muted mt-6">Evènman ki deja chaje yo disponib menm offline.</p>
  </div>
</div>
