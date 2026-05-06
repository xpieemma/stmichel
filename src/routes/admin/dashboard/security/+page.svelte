<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { currentAdmin } from '$lib/auth/session';
  import { generateSecret, verifyTOTP } from '$lib/auth/totp';
  import { setTotpSecret, getTotpSecret } from '$lib/auth/vault';
  import { renderQRCode } from '$lib/components/qrcode';
  import { fakeToast } from '$lib/stores/toasts';

  let username = $state('');
  let totpSecret = $state<string | null>(null);
  let qr = $state('');
  let showSecret = $state(false);
  let testCode = $state('');
  let error = $state('');
  let success = $state('');

  function injectQR(node: HTMLElement, svgContent: string) {
  node.innerHTML = svgContent;
}

  onMount(async () => {
    currentAdmin.subscribe(s => {
      if (s) username = s.username;
    });
    // Check if TOTP already set
    const existing = await getTotpSecret(username);
    if (existing) totpSecret = existing;
  });

  async function enableTotp() {
    if (!username) return;
    const secret = generateSecret();
    totpSecret = secret;
    await setTotpSecret(username, secret);
    // Generate QR
    const label = `ST MICHEL (${username})`;
    const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=ST%20MICHEL`;
    qr = renderQRCode(otpauth);
    fakeToast('TOTP enabled. Scan the QR with your authenticator app.');
  }

  async function disableTotp() {
    if (!confirm('Disable two-factor authentication?')) return;
    await setTotpSecret(username, '');
    totpSecret = null;
    qr = '';
    testCode = '';
    fakeToast('TOTP disabled.');
  }

  async function testTotp() {
    error = '';
    success = '';
    if (!totpSecret) return;
    const valid = await verifyTOTP(totpSecret, testCode);
    if (valid) {
      success = 'Code valid! TOTP is working.';
    } else {
      error = 'Invalid code. Check your device clock and try again.';
    }
  }
</script>

<svelte:head><title>Security | Admin</title></svelte:head>

<div class="p-4 max-w-md mx-auto pb-20">
  <a href={resolve("/admin/dashboard")} class="text-sm text-text-muted hover:underline">← Dashboard</a>
  <h1 class="text-2xl font-bold mt-2 mb-6">🛡️ Security</h1>

  <h2 class="text-lg font-semibold mb-3">Two-Factor Authentication (TOTP)</h2>

  {#if totpSecret}
    <div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
      <p class="font-medium">TOTP is enabled</p>
      {#if qr}
        <div class="my-3" use:injectQR={qr}></div>
      {/if}
      <button onclick={() => showSecret = !showSecret} class="text-sm underline mt-1">
        {showSecret ? 'Hide' : 'Show'} secret key
      </button>
      {#if showSecret}
        <p class="text-xs font-mono break-all mt-1">{totpSecret}</p>
      {/if}
      <div class="mt-4 space-y-2">
        <label class="block">
          <span class="text-sm">Test your code</span>
          <input type="text" bind:value={testCode} maxlength="6" class="w-full p-2 border rounded mt-1" placeholder="123456" />
        </label>
        <button onclick={testTotp} class="bg-haiti-blue text-white px-4 py-1.5 rounded-full text-sm">Verify</button>
        {#if error}<p class="text-haiti-red text-sm mt-1">{error}</p>{/if}
        {#if success}<p class="text-green-700 text-sm mt-1">{success}</p>{/if}
      </div>
      <button onclick={disableTotp} class="mt-4 text-haiti-red underline text-sm">Disable TOTP</button>
    </div>
  {:else}
    <p class="text-sm text-text-secondary mb-4">Add an extra layer of security that works completely offline.</p>
    <button onclick={enableTotp} class="bg-haiti-blue text-white px-5 py-2.5 rounded-full font-medium">
      Enable TOTP
    </button>
  {/if}
</div>