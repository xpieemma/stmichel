<script lang="ts">
  import { onDestroy } from 'svelte';
  import { generateDelegationToken } from '$lib/auth/offline-tokens';
  import { renderQRCode } from '$lib/components/qrcode';
  import { getDeviceId } from '$lib/db/sync';  // we already have this helper

  let password = $state('');
  let qrSvg = $state('');
  let error = $state('');
  let loading = $state(false);

  // Store the password hash temporarily for signing – cleared on destroy
  let passwordHash: string | null = null;

  async function handleGenerate() {
    if (!password) {
      error = 'Please enter your password';
      return;
    }
    loading = true;
    error = '';
    qrSvg = '';
    try {
      // The admin's username is available via the session — we retrieve it from
      // a store or from the server. For offline use, we'll assume it's known; we
      // can hard-code a temporary value or read from localStorage.  In a real
      // implementation, you would pull it from the admin session (cookies/server).
      // For now, we'll allow the admin to type their username (or we could read it
      // from hidden field).  I'll add a username input.
      // Actually, the admin is already logged in, so we know their username.
      // We'll import the session store.  But to keep it simple, we ask them to
      // re-enter their username as well, since they are offline and cannot fetch
      // from server.  We'll include a text input for username.
      // Wait, the user is already on the delegation page, they are logged in.
      // We can get the username from localStorage (it was saved at login).
      // Or we can require it as input.  I'll add a readonly username field that
      // reads from a store.  Since we haven't set up such a store, I'll just
      // require them to type it.  We'll add a `username` binding.
      // Let's add a username input.

      const username = (document.getElementById('deleg-username') as HTMLInputElement).value;
      if (!username) {
        error = 'Username is required';
        loading = false;
        return;
      }

      const token = await generateDelegationToken(password, username, getDeviceId());
      qrSvg = renderQRCode(`https://stmichel.ht/admin/onboard?token=${encodeURIComponent(token)}`);
    } catch (e: any) {
      error = e.message || 'Failed to generate QR';
    } finally {
      password = '';  // clear from memory
      loading = false;
    }
  }

  onDestroy(() => {
    password = '';
  });
</script>

<svelte:head><title>Delegate Access | Admin</title></svelte:head>

<div class="p-4 max-w-md mx-auto pb-20">
  <a href="/admin/dashboard" class="text-sm text-text-muted hover:underline">← Dashboard</a>
  <h1 class="text-2xl font-bold mt-2 mb-6">👥 Delegate Admin Access</h1>
  <p class="text-sm text-text-secondary mb-4">
    Generate a QR code that another person can scan to become an administrator – no internet required.
  </p>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-haiti-red p-3 rounded-xl mb-4 text-sm">{error}</div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); handleGenerate(); }} class="space-y-4">
    <label class="block">
      <span class="font-medium">Your Username</span>
      <input id="deleg-username" type="text" required class="w-full p-3 border rounded-xl mt-1 bg-smoke-white" />
    </label>
    <label class="block">
      <span class="font-medium">Your Password (to sign)</span>
      <input type="password" bind:value={password} required class="w-full p-3 border rounded-xl mt-1 bg-smoke-white" />
    </label>
    <button type="submit" disabled={loading}
      class="bg-haiti-blue text-white px-6 py-3 rounded-full font-medium disabled:opacity-50">
      {loading ? 'Generating...' : 'Generate Delegation QR'}
    </button>
  </form>

  {#if qrSvg}
    <div class="mt-6">
      <h2 class="text-lg font-semibold mb-2">Delegation QR Code</h2>
      <div class="bg-white p-4 rounded-2xl border inline-block">
        {@html qrSvg}
      </div>
      <p class="text-xs text-text-muted mt-2">
        Have the new admin scan this QR code with their device’s camera app. They will be taken to the onboarding page.
      </p>
    </div>
  {/if}
</div>