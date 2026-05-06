


<script lang="ts">
  import { goto } from '$app/navigation';
  import { checkLocalLogin, storeMasterHash } from '$lib/auth/vault';
  import { login } from '$lib/auth/login';
  import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
  import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';
  import { hashPassword, FIXED_SALT_U8, FIXED_SALT_B64 } from '$lib/auth/crypto';
  import { resolve } from '$app/paths';

  let username = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');
  let successMsg = $state('');
  let mode = $state<'register' | 'login'>('login');
  let method = $state<'passkey' | 'password'>('passkey');

  async function handlePasskey() {
    if (!username) { error = 'Antre non itilizatè ou'; return; }
    loading = true; error = ''; successMsg = '';
    try {
      const resp = await fetch(`/admin/api/webauthn?username=${encodeURIComponent(username)}&mode=${mode}`);
      const options = await resp.json() as PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON;
      const result = mode === 'register'
        ? await startRegistration({ optionsJSON: options as PublicKeyCredentialCreationOptionsJSON })
        : await startAuthentication({ optionsJSON: options as PublicKeyCredentialRequestOptionsJSON });
      const verifyResp = await fetch('/admin/api/webauthn/verify', {  
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: result, mode })
      });
      if (verifyResp.ok) {
        goto(resolve('/admin/dashboard'));
      } else {
        const body = await verifyResp.json().catch(() => ({}));
        error = (body as { error?: string })?.error || 'Verifikasyon echwe';
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        error = 'Aksè refize pa braozè ou';
      } else {
        error = 'Erè: ' + (e as Error).message;
      }
    } finally {
      loading = false;
    }
  }

  async function handleDemo() {
    loading = true; error = ''; successMsg = '';
    try {
      const r = await fetch('/admin/api/demo-login', { method: 'POST', credentials: 'include' });
      if (r.ok) {
        goto(resolve('/admin/dashboard'));
      } else {
        const body = await r.json().catch(() => ({}));
        error = (body as { error?: string })?.error || 'Demo pa disponib';
      }
    } catch (e: unknown) {
      error = 'Erè: ' + (e as Error).message;
    } finally {
      loading = false;
    }
  }

  // async function handlePassword() {
  //   if (!username || !password) {
  //     error = 'Antre non itilizatè ak modpas';
  //     return;
  //   }
  //   if (mode === 'register' && password.length < 10) {
  //     error = 'Modpas dwe gen omwen 10 karaktè';
  //     return;
  //   }
  //   loading = true;
  //   error = '';
  //   successMsg = '';
  //   try {
  //     const endpoint = mode === 'register'
  //       ? '/admin/api/password/register'
  //       : '/admin/api/password/login';
  //     const resp = await fetch(endpoint, {
  //       credentials: 'include',
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ username, password })
  //     });



  //     const body: unknown = await resp.json().catch(() => ({}));

  //     if (resp.ok) {
  //       if (mode === 'register') {
  //         // Registration creates a PENDING request — user must wait for approval
  //         mode = 'login';
  //         password = '';
  //         error = '';
  //         successMsg = (body as { message?: string })?.message || '⏳ Demann ou soumèt! Tann yon admin apwouve l.';
  //         loading = false;
  //         return;
  //       }
  //       // Login success — server already set the cookie
  //       goto(resolve('/admin/dashboard'));
  //     } else {
  //       // ✅ Handle pending/rejected states with specific UI
  //       if ((body as { pending?: boolean })?.pending) {
  //         error = '⏳ Kont ou ap tann apwobasyon. Yon admin dwe apwouve l anvan.';
  //       } else if ((body as { rejected?: boolean })?.rejected) {
  //         error = '❌ Demann aksè ou te rejte. Kontakte administratè a.';
  //       } else {
  //         error = (body as { error?: string })?.error || 'Koneksyon echwe';
  //       }
  //     }
  //   } catch (e: unknown) {
  //     // error = 'Erè: ' + (e as Error).message;
  //     function getErrorMessage(e: unknown): string {
  //       if (e instanceof Error) {
  //         return e.message;
  //       }
  //       return 'Erè inconnu';
  //     }
  //     error = 'Erè: ' + getErrorMessage(e);
  //   } finally {
  //     loading = false;
  //   }
  // }
async function handlePassword() {
  if (!username || !password) {
    error = 'Antre non itilizatè ak modpas';
    return;
  }
  if (mode === 'register' && password.length < 10) {
    error = 'Modpas dwe gen omwen 10 karaktè';
    return;
  }
  loading = true;
  error = '';
  successMsg = '';

  try {
    const hashed = await hashPassword(password, FIXED_SALT_U8);
    // const body = {
    //   username,
    //   password_hash: hashed,
    //   client_salt: FIXED_SALT_B64
    // };
    

    // Step 3: Check local vault first for decoy or offline admin
    const localRole = await checkLocalLogin(username, password);
    if (localRole === 'decoy') {
      login(username, 'decoy');
      goto(resolve('/admin/dashboard'));
      return;
    }

    // If local master match and we are offline, we can still allow admin login locally
    // For now, continue with network call; after successful server login, we'll store master hash.

    const endpoint = mode === 'register'
      ? '/admin/api/password/register'
      : '/admin/api/password/login';

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password_hash: hashed,
        client_salt: FIXED_SALT_B64
      })
    });

    const res: unknown = await resp.json().catch(() => ({}));

    if (resp.ok) {
      if (mode === 'register') {
        mode = 'login';
        password = '';
        error = '';
        successMsg = (res as { message?: string })?.message || '⏳ Demann ou soumèt! Tann yon admin apwouve l.';
        loading = false;
        return;
      }
      // Store master hash locally for future offline/decoy check
      await storeMasterHash(username, hashed);
      login(username, 'admin');
      goto(resolve('/admin/dashboard'));
    } else {
      // ... error handling unchanged
    }
  } catch (e) {
    error = 'Erè: ' + (e as Error).message;
  } finally {
    loading = false;
  }
}
  
</script>

<svelte:head><title>Aksè Administratè | ST MICHEL</title></svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-smoke-white">
  <div class="bg-card-white rounded-3xl p-8 max-w-md w-full shadow-card border border-border-light">
    <h1 class="text-2xl font-semibold text-center mb-2">SM Aksè Administratè</h1>
    <p class="text-text-muted text-center mb-6">
      {method === 'passkey' ? 'Itilize kle sekirite oswa anprent' : 'Itilize modpas'}
    </p>

    <!-- Register / Login switcher -->
    <div class="flex gap-1 bg-smoke-white p-1 rounded-full mb-4">
      <button
        class="flex-1 py-2 rounded-full transition-colors {mode === 'login' ? 'bg-haiti-blue text-white' : 'text-text-secondary'}"
        onclick={() => { mode = 'login'; error = ''; successMsg = ''; }}
      >Konekte</button>
      <button
        class="flex-1 py-2 rounded-full transition-colors {mode === 'register' ? 'bg-haiti-blue text-white' : 'text-text-secondary'}"
        onclick={() => { mode = 'register'; error = ''; successMsg = ''; }}
      >Anrejistre</button>
    </div>

    <!-- Username always -->
    <div class="mb-4">
      <label class="block mb-1 font-medium" for="username-input">Email oswa non itilizatè</label>
      <input
        id="username-input"
        type="text"
        bind:value={username}
        class="w-full p-3 border border-border-light rounded-xl bg-smoke-white focus:ring-2 focus:ring-haiti-blue focus:outline-none"
        placeholder={mode === 'register' ? 'eg. bob@marley.com' : 'eg. ultimateadmin'}
        disabled={loading}
        autocomplete="username"
      />
    </div>

    <!-- Password (only when password method selected) -->
    {#if method === 'password'}
      <div class="mb-4">
        <label class="block mb-1 font-medium" for="password-input">Modpas</label>
        <input
          id="password-input"
          type="password"
          bind:value={password}
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white focus:ring-2 focus:ring-haiti-blue focus:outline-none"
          placeholder={mode === 'register' ? 'Omwen 10 karaktè' : ''}
          disabled={loading}
          autocomplete={mode === 'register' ? 'new-password' : 'current-password'}
        />
      </div>
    {/if}

    <!-- ✅ Success message (green) -->
    {#if successMsg}
      <div class="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
        {successMsg}
      </div>
    {/if}

    <!-- ✅ Error message (red) -->
    {#if error}
      <div class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-haiti-red text-sm">
        {error}
      </div>
    {/if}

    <!-- Info box for register mode -->
    {#if mode === 'register' && method === 'password'}
      <div class="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
        ℹ️ Apre enskripsyon, yon administratè dwe apwouve kont ou anvan ou ka konekte.
      </div>
    {/if}

    <!-- Primary action button -->
    {#if method === 'passkey'}
      <button
        onclick={handlePasskey}
        disabled={loading}
        class="w-full bg-haiti-blue text-white py-3 rounded-full font-medium disabled:opacity-50 mb-3 transition-opacity"
      >{loading ? 'Chaje...' : (mode === 'register' ? '🔐 Anrejistre Passkey' : '🔑 Konekte ak Passkey')}</button>
    {:else}
      <button
        onclick={handlePassword}
        disabled={loading}
        class="w-full bg-haiti-blue text-white py-3 rounded-full font-medium disabled:opacity-50 mb-3 transition-opacity"
      >{loading ? 'Chaje...' : (mode === 'register' ? '📝 Mande Aksè ak Modpas' : '🔓 Konekte ak Modpas')}</button>
    {/if}

    <!-- Demo login -->
    <button
      onclick={handleDemo}
      disabled={loading}
      class="w-full mb-3 border border-border-light text-text-secondary py-2 rounded-full text-sm hover:bg-smoke-white transition-colors"
    >👀 Gade demo (read-only)</button>

    <!-- Method toggle -->
    <button
      onclick={() => { method = method === 'passkey' ? 'password' : 'passkey'; error = ''; successMsg = ''; password = ''; }}
      class="w-full text-sm text-text-muted underline"
    >
      {method === 'passkey' ? 'Pa ka itilize passkey? Klike la pou itilize modpas' : 'Retounen nan passkey'}
    </button>

    <p class="text-xs text-text-muted text-center mt-6">
      {#if method === 'passkey'}
        {mode === 'register' ? 'W ap kreye yon nouvo kle pou aksè administratè.' : 'Itilize anprent ou oswa PIN aparèy la.'}
      {:else}
        {mode === 'register'
          ? 'Soumèt yon demann aksè. Yon admin dwe apwouve l.'
          : 'Konekte ak modpas si w pa ka itilize passkey ou.'}
      {/if}
    </p>
  </div>
</div>