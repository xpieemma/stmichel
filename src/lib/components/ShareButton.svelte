<script lang="ts">
   let { title, text, url }: { title: string; text: string; url: string } = $props();

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Share failed', err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Lyen kopye!');
    }
  }
</script>

<button onclick={share} class="share-btn">📤 Pataje</button>

<style>
  .share-btn {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-light);
    border-radius: 60px;
    padding: 12px 20px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
  }
  .share-btn:active { background: var(--bg-primary); border-color: var(--accent-blue); }
</style>
