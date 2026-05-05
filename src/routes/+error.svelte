<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Erè {$page.status} | ST MICHEL</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-smoke-white">
  <div class="bg-card-white rounded-3xl p-8 max-w-md w-full shadow-card border border-border-light text-center">
    <p class="text-6xl mb-4">🚧</p>
    <h1 class="text-3xl font-semibold mb-2">{$page.status}</h1>
    <p class="text-text-secondary mb-6">
      {$page.error?.message || 'Yon pwoblèm ki pa atandi rive.'}
    </p>
    <a
      href="/"
      class="inline-block bg-haiti-blue text-white px-6 py-3 rounded-full font-medium no-underline"
    >🏠 Tounen lakay</a>
  </div>
</div>
