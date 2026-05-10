<!-- <script lang="ts">
  import { browser } from '$app/environment';
  import { addToQueue } from '$lib/db/pending-sync';

 let { eventId, eventTitle }: { eventId: number; eventTitle: string } = $props();
 

  let showModal = $state(false);
  let rating = $state(0);
  let comment = $state('');
  let submitted = $state(false);
  let submitting = $state(false);
  let queuedOffline = $state(false);
let dialogEl: HTMLDivElement | undefined = $state();

    // Focus the dialog when it opens
  $effect(() => {
    if (showModal && dialogEl) {
      dialogEl.focus();
    }
  });

  async function submitFeedback() {
    if (rating === 0) return;
    submitting = true;
    queuedOffline = false;
    try {
      const payload = {
        eventId,
        eventTitle,
        rating,
        comment,
        timestamp: Math.floor(Date.now() / 1000)
      };

      if (browser && navigator.onLine) {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Server rejected feedback');
      } else {
        // Queue via the proper outbox so processPendingQueue() will
        // flush it next time the device is online.
        await addToQueue('feedback', payload);
        queuedOffline = true;
      }
      submitted = true;
      setTimeout(() => {
        showModal = false;
        submitted = false;
        queuedOffline = false;
        rating = 0;
        comment = '';
      }, 2200);
    } catch (e) {
      console.error('Feedback failed:', e);
      // Last-resort: queue it so we don't lose what the user typed.
      try {
        await addToQueue('feedback', { eventId, eventTitle, rating, comment, timestamp: Math.floor(Date.now() / 1000) });
        queuedOffline = true;
        submitted = true;
      } catch (innerError) {
        console.error('Failed to queue feedback as fallback:', innerError);
      }
    } finally {
      submitting = false;
    }
  }

   function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      showModal = false;
    }
  }
</script>

<button
  class="text-text-secondary text-sm border border-border-light rounded-full px-4 py-2"
  onclick={() => (showModal = true)}
>💬 Feedback</button>

{#if showModal}

  <div
    class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    role="presentation"
    onclick={() => (showModal = false)}
    onkeydown={handleKeydown}
  >
    <div
    bind:this={dialogEl}
     class="bg-card-white rounded-2xl p-6 max-w-md w-full outline-none" 
     role="dialog" 
     aria-modal="true"
     aria-labelledby="feedback-dialog-title"
     tabindex="-1"
     onclick = {(e) => e.stopPropagation()}
     onkeydown = {(e) => e.stopPropagation()}>
      {#if submitted}
        <div class="text-center">
          <span class="text-4xl mb-2 block">🙏</span>
          <h3 class="text-xl font-semibold">Mèsi anpil!</h3>
          {#if queuedOffline}
            <p class="text-sm text-text-muted mt-2">Sove lokalman. N ap voye li lè w gen koneksyon.</p>
          {/if}
        </div>
      {:else}
        <h3 class="text-lg font-semibold mb-4">Ki jan ou jwenn {eventTitle}?</h3>
        <div class="flex justify-center gap-2 mb-4">
          {#each [1, 2, 3, 4, 5] as s (s)}
            <button
            type="button"
              class="text-3xl {rating >= s ? 'text-haiti-blue' : 'text-gray-300'}"
              aria-label={`${s} zetwal`}
              onclick={() => (rating = s)}
            >★</button>
          {/each}
        </div>
        <textarea
          placeholder="Kòmantè opsyonèl..."
          bind:value={comment}
          rows="3"
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white mb-4"
        ></textarea>
        <div class="flex gap-3">
          <button 
          type="button"
          onclick={() => (showModal = false)} class="flex-1 border border-border-light rounded-full py-2">
            Anile
          </button>
          <button
            type="button"
            onclick={submitFeedback}
            disabled={rating === 0 || submitting}
            class="flex-1 bg-haiti-blue text-white rounded-full py-2 disabled:opacity-50"
          >{submitting ? '...' : 'Voye'}</button>
        </div>
      {/if}
    </div>
  </div>
{/if} -->


<script lang="ts">
  import { browser } from '$app/environment';
  import { addToQueue } from '$lib/db/pending-sync';
  import { fade, scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';

  let { eventId, eventTitle }: { eventId: number; eventTitle: string } = $props();

  let showModal = $state(false);
  let rating = $state(0);
  let comment = $state('');
  let submitted = $state(false);
  let submitting = $state(false);
  let queuedOffline = $state(false);
  let dialogEl: HTMLDivElement | undefined = $state();

  // Focus the dialog when it opens
  $effect(() => {
    if (showModal && dialogEl) {
      dialogEl.focus();
    }
  });

  async function submitFeedback() {
    if (rating === 0) return;
    submitting = true;
    queuedOffline = false;
    
    try {
      const payload = {
        eventId,
        eventTitle,
        rating,
        comment,
        timestamp: Math.floor(Date.now() / 1000)
      };

      if (browser && navigator.onLine) {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Server rejected feedback');
      } else {
        await addToQueue('feedback', payload);
        queuedOffline = true;
      }
      
      submitted = true;
      setTimeout(() => {
        showModal = false;
        submitted = false;
        queuedOffline = false;
        rating = 0;
        comment = '';
      }, 2500);
      
    } catch (e) {
      console.error('Feedback failed:', e);
      try {
        await addToQueue('feedback', { eventId, eventTitle, rating, comment, timestamp: Math.floor(Date.now() / 1000) });
        queuedOffline = true;
        submitted = true;
        
        setTimeout(() => {
          showModal = false;
          submitted = false;
          queuedOffline = false;
          rating = 0;
          comment = '';
        }, 2500);
      } catch (innerError) {
        console.error('Failed to queue feedback as fallback:', innerError);
      }
    } finally {
      submitting = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      showModal = false;
    }
  }
</script>

<!-- The Trigger Button (Matches the Share Button Elegance) -->
<button
  class="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full border border-slate-200 bg-white/50 px-5 py-2.5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-blue-500 hover:bg-white hover:shadow-md active:scale-95 active:bg-slate-50"
  onclick={() => (showModal = true)}
>
  <span class="text-lg transition-transform group-hover:-translate-y-0.5 group-hover:-rotate-12">💬</span>
  <span class="font-sans text-[11px] font-black uppercase tracking-[0.1em] text-slate-600 group-hover:text-slate-900">
    Feedback
  </span>
</button>

{#if showModal}
  <!-- The Overlay -->
  <div
    transition:fade={{ duration: 250 }}
    class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md"
    role="presentation"
    onclick={() => (showModal = false)}
    onkeydown={handleKeydown}
  >
    <!-- The Modal Card -->
    <div
      bind:this={dialogEl}
      transition:scale={{ start: 0.95, duration: 400, easing: backOut }}
      class="w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-900/20 outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-dialog-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      
      {#if submitted}
        <!-- Success State -->
        <div in:fade={{ delay: 150, duration: 300 }} class="flex flex-col items-center justify-center py-6 text-center">
          <div class="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl shadow-inner border border-blue-100/50">
            🙏
          </div>
          <h3 class="font-serif text-3xl font-bold text-slate-900 leading-none">Mèsi anpil!</h3>
          {#if queuedOffline}
            <p class="mt-3 rounded-full bg-slate-50 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-100">
              Sove lokalman. N ap voye l pita.
            </p>
          {/if}
        </div>
      {:else}
        <!-- Input State -->
        <div in:fade={{ duration: 200 }}>
          <h3 id="feedback-dialog-title" class="mb-1 font-serif text-2xl font-bold leading-tight text-slate-900">
            Kijan ou jwenn<br/>
            <span class="text-blue-600">{eventTitle}?</span>
          </h3>
          <p class="mb-6 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Pataje eksperyans ou
          </p>

          <!-- Interactive Stars -->
          <div class="mb-6 flex justify-between gap-1 px-2">
            {#each [1, 2, 3, 4, 5] as s (s)}
              <button
                type="button"
                class="group relative text-4xl transition-transform active:scale-75"
                aria-label={`${s} zetwal`}
                onclick={() => (rating = s)}
              >
                <!-- Active Star with Glow -->
                <span class="absolute inset-0 transition-opacity duration-300 {rating >= s ? 'opacity-100 drop-shadow-[0_4px_12px_rgba(37,99,235,0.5)]' : 'opacity-0'}">
                  <span class="text-blue-500">★</span>
                </span>
                <!-- Inactive Star -->
                <span class="text-slate-200 transition-opacity duration-300 {rating >= s ? 'opacity-0' : 'opacity-100 group-hover:text-slate-300'}">
                  ★
                </span>
              </button>
            {/each}
          </div>

          <!-- Refined Textarea -->
          <textarea
            placeholder="Kòmantè opsyonèl..."
            bind:value={comment}
            rows="3"
            class="mb-6 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm font-medium text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          ></textarea>

          <!-- Buttons -->
          <div class="flex gap-3">
            <button 
              type="button"
              onclick={() => (showModal = false)} 
              class="flex-1 rounded-full border border-slate-200 bg-white py-3.5 font-sans text-[11px] font-black uppercase tracking-widest text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
            >
              Anile
            </button>
            
            <button
              type="button"
              onclick={submitFeedback}
              disabled={rating === 0 || submitting}
              class="flex-1 rounded-full bg-blue-600 py-3.5 font-sans text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              {submitting ? 'A Pasiante...' : 'Voye'}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>


  :global(.font-serif) { font-family: 'DM Serif Display', serif; }
  :global(.font-sans) { font-family: 'Inter', sans-serif; }
</style>