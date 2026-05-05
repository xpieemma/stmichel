<script lang="ts">
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
{/if}
