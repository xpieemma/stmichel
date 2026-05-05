<script lang="ts">
  import confetti from 'canvas-confetti';
  import type {Snippet} from 'svelte';

    let {
    disabled = false,
    onstamp,
    children
  }: {
    disabled?: boolean;
    onstamp?: () => void;
    children?: Snippet;
  } = $props();


  function handleClick() {
    confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 }, colors: ['#00209F', '#F5F5F5', '#D21034', '#FFFFFF'] });
    setTimeout(() => {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6, x: 0.3 }, colors: ['#00209F', '#F5F5F5'] });
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6, x: 0.7 }, colors: ['#D21034', '#FFFFFF'] });
    }, 120);
        onstamp?.();

  }
</script>

<button onclick={handleClick} {disabled} class="confetti-btn">
   {#if children}{@render children()}{/if}
</button>

<style>
  .confetti-btn {
    background: var(--bg-card);
    color: var(--text-primary);
    border: 1.2px solid var(--accent-blue);
    border-radius: 60px;
    padding: 12px 24px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.15s cubic-bezier(0.2, 0.9, 0.4, 1);
  }
  .confetti-btn:active { transform: scale(0.97); background: var(--bg-primary); }
  .confetti-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
