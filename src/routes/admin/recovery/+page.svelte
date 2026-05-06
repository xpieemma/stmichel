<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { requestHint, unlockHint } from '$lib/auth/recovery';

  let username = $state('');
  let pin = $state('');
  let step = $state<'input' | 'waiting' | 'hint'>('input');
  let error = $state('');
  let hint = $state('');
  let countdown = $state(300); // 5 minutes in seconds
  let timerId: number;

  // On mount, if a request was already made, resume countdown
  onMount(async () => {
    const storedUser = sessionStorage.getItem('recovery_username');
    if (storedUser) {
      username = storedUser;
      const requestedAt = await requestHint(username);
      startCountdown(requestedAt);
    }
  });

  function startCountdown(requestedAt: number) {
    step = 'waiting';
    const update = () => {
      const now = Date.now();
      const elapsed = now - requestedAt;
      const remaining = Math.max(0, 300 - Math.floor(elapsed / 1000));
      countdown = remaining;
      if (remaining <= 0) {
        clearInterval(timerId);
        // Don't auto-reveal, wait for user to click check button
      }
    };
    update();
    timerId = setInterval(update, 1000);
  }

  async function handleRequest() {
    if (!username) {
      error = 'Antre non itilizatè a';
      return;
    }
    error = '';
    sessionStorage.setItem('recovery_username', username);
    const requestedAt = await requestHint(username);
    startCountdown(requestedAt);
  }

  async function handleUnlock() {
    if (!pin) {
      error = 'Antre PIN rekiperasyon an';
      return;
    }
    try {
      const result = await unlockHint(username, pin);
      if (result) {
        hint = result;
        step = 'hint';
        clearInterval(timerId);
      } else {
        error = 'PIN pa bon oswa tan an poko pase';
      }
    } catch (e) {
      error = 'Erè: ' + (e as Error).message;
    }
  }

  onDestroy(() => {
    clearInterval(timerId);
  });
</script>

<svelte:head><title>Rekiperasyon Modpas | ST MICHEL</title></svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-smoke-white">
  <div class="bg-card-white rounded-3xl p-8 max-w-md w-full shadow-card border border-border-light">
    <h1 class="text-2xl font-semibold mb-4">Rekiperasyon Modpas</h1>

    {#if step === 'input'}
      <p class="text-text-secondary mb-4">Antre non itilizatè ou pou kòmanse.</p>
      <input bind:value={username} placeholder="Username" class="w-full p-3 border rounded-xl mb-3" />
      <button onclick={handleRequest} class="w-full bg-haiti-blue text-white py-3 rounded-full">Kòmanse</button>
    {:else if step === 'waiting'}
      <p class="text-text-secondary mb-2">Tan rete: <strong>{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</strong></p>
      <progress value={300 - countdown} max="300" class="w-full h-2 mb-4"></progress>
      <input bind:value={pin} type="password" placeholder="PIN rekiperasyon" class="w-full p-3 border rounded-xl mb-2" disabled={countdown > 0} />
      <button onclick={handleUnlock} disabled={countdown > 0} class="w-full bg-haiti-blue text-white py-3 rounded-full disabled:opacity-50">Verify PIN & Show Hint</button>
    {:else}
      <p class="font-medium mb-2">Indis modpas ou:</p>
      <div class="bg-smoke-white p-4 rounded-xl text-text-primary">{hint}</div>
      <button onclick={() => window.location.href = '/admin/login'} class="w-full mt-4 bg-haiti-blue text-white py-3 rounded-full">Retounen nan Login</button>
    {/if}

    {#if error}
      <p class="text-haiti-red mt-3 text-sm">{error}</p>
    {/if}
  </div>
</div>