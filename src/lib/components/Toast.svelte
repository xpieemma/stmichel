<script lang="ts">
  import { toasts } from '$lib/stores/toasts';
</script>

<div class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 space-y-2 pointer-events-none">
  {#each $toasts as toast (toast.id)}
    <div class="bg-haiti-blue text-white px-4 py-2 rounded-full text-sm shadow-lg">
      {toast.message}
    </div>
  {/each}
</div>