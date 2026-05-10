<!-- <script lang="ts">
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
</style> -->


<script lang="ts">
  import confetti from 'canvas-confetti';
  import type { Snippet } from 'svelte';

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
    // Stage 1: The Main Burst
    confetti({ 
      particleCount: 100, 
      spread: 60, 
      origin: { y: 0.6 }, 
      colors: ['#00209F', '#F5F5F5', '#D21034', '#FFFFFF'],
      disableForReducedMotion: true
    });
    
    // Stage 2: The Side Bursts (Delayed for impact)
    setTimeout(() => {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6, x: 0.3 }, colors: ['#00209F', '#F5F5F5'] });
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6, x: 0.7 }, colors: ['#D21034', '#FFFFFF'] });
    }, 120);
    
    onstamp?.();
  }
</script>

<button 
  onclick={handleClick} 
  {disabled} 
  class="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-blue-600 bg-white px-8 py-3.5 font-sans text-[13px] font-black uppercase tracking-[0.15em] text-blue-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50/50 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:grayscale"
>
  <!-- Subtle Shine Effect on Hover -->
  <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-100/40 to-transparent transition-transform duration-500 ease-in-out group-hover:translate-x-full"></div>
  
  <span class="relative z-10 flex items-center justify-center gap-2">
    {#if children}{@render children()}{/if}
  </span>
</button>

<style>

  :global(.font-sans) {
    font-family: 'Inter', sans-serif;
  }
</style>