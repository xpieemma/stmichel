<script lang="ts">
  import { resolve } from '$app/paths';
  import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
  import type {
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON
  } from '@simplewebauthn/browser';
  import { sendBroadcast } from '$lib/auth/broadcast';
  
  import { hashPassword, FIXED_SALT_U8, FIXED_SALT_B64 } from '$lib/auth/crypto';
  import { checkLocalLogin, storeMasterHash, getTotpSecret } from '$lib/auth/vault';
  import { verifyTOTP } from '$lib/auth/totp';
  import { login } from '$lib/auth/session';
  import { startHeartbeat } from '$lib/auth/heartbeat'; // ✅ Imported startHeartbeat
  import { goto } from '$app/navigation';

  // --- UI State ---
  let loading = $state(false);
  let error = $state('');
  let successMsg = $state('');
  let mode = $state<'register' | 'login'>('login');
  let method = $state<'passkey' | 'password'>('passkey');

  // --- Form State ---
  let username = $state('');
  let password = $state('');

  // --- TOTP State ---
  let showTotp = $state(false);
  let totpInput = $state('');
  let totpError = $state('');
  let authenticatedUser = $state('');

  // ------------------------------------------------------
  // Passkey flow
  // ------------------------------------------------------
  async function handlePasskey() {
    if (!username) {
      error = 'Antre non itilizatè ou';
      return;
    }
    loading = true;
    error = '';
    successMsg = '';
    
    try {
      const resp = await fetch(
        `/admin/api/webauthn?username=${encodeURIComponent(username)}&mode=${mode}`
      );
      const options = (await resp.json()) as
        | PublicKeyCredentialCreationOptionsJSON
        | PublicKeyCredentialRequestOptionsJSON;

      const result = mode === 'register'
          ? await startRegistration({
              optionsJSON: options as PublicKeyCredentialCreationOptionsJSON
            })
          : await startAuthentication({
              optionsJSON: options as PublicKeyCredentialRequestOptionsJSON
            });

      const verifyResp = await fetch('/admin/api/webauthn/verify', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: result, mode })
      });

      if (verifyResp.ok) {
        login(username, 'admin'); // Ensure session state is set
        startHeartbeat(username); // ✅ Start the inactivity timer
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

  // ------------------------------------------------------
  // Demo login
  // ------------------------------------------------------
  async function handleDemo() {
    loading = true;
    error = '';
    successMsg = '';
    try {
      const r = await fetch('/admin/api/demo-login', {
        method: 'POST',
        credentials: 'include'
      });
      if (r.ok) {
        login('demo', 'admin'); 
        startHeartbeat('demo'); // ✅ Start the timer for demo user too
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

  // ------------------------------------------------------
  // Password flow (with local vault + TOTP)
  // ------------------------------------------------------
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

      // 1. Check local vault first (decoy / offline admin)
      const localRole = await checkLocalLogin(username, password);
      if (localRole === 'decoy') {
        sendBroadcast({ type: 'DECOY_ACTIVE', username });
        login(username, 'decoy');
        startHeartbeat(username); // ✅ Start inactivity timer for decoy
        goto(resolve('/admin/dashboard'));
        return;
      }

      // 2. Network authentication
      const endpoint = mode === 'register'
          ? '/admin/api/password/register'
          : '/admin/api/password/login';

      // sendBroadcast({ type: 'DECOY_ACTIVE', username });
      const resp = await fetch(endpoint, {
        credentials: 'include',
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

        // Server login successful
        await storeMasterHash(username, hashed);
        authenticatedUser = username;

        // 3. Check if TOTP is required
        const secret = await getTotpSecret(username);
        if (secret) {
          showTotp = true; // switch to TOTP prompt
          loading = false;
          return;
        }

        login(username, 'admin');
        startHeartbeat(username); // ✅ Start inactivity timer for standard password login
        goto(resolve('/admin/dashboard'));
      } else {
        // Error handling
        const body = res as { error?: string; pending?: boolean; rejected?: boolean };
        if (body.pending) {
          error = '⏳ Kont ou ap tann apwobasyon. Yon admin dwe apwouve l anvan.';
        } else if (body.rejected) {
          error = '❌ Demann aksè ou te rejte. Kontakte administratè a.';
        } else {
          error = body.error || 'Koneksyon echwe';
        }
      }
    } catch (e: unknown) {
      error = 'Erè: ' + (e as Error).message;
    } finally {
      loading = false;
    }
  }

  // ------------------------------------------------------
  // TOTP verification
  // ------------------------------------------------------
  async function handleTotpVerify() {
    if (!totpInput || totpInput.length !== 6) {
      totpError = 'Antre yon kòd 6 chif';
      return;
    }
    
    loading = true;
    try {
      const secret = await getTotpSecret(authenticatedUser);
      if (!secret) {
        login(authenticatedUser, 'admin');
        startHeartbeat(authenticatedUser); // ✅ Fallback heartbeat trigger
        goto(resolve('/admin/dashboard'));
        return;
      }
      
      const valid = await verifyTOTP(secret, totpInput);
      if (valid) {
        login(authenticatedUser, 'admin');
        startHeartbeat(authenticatedUser); // ✅ Start inactivity timer after TOTP success
        goto(resolve('/admin/dashboard'));
      } else {
        totpError = 'Kòd TOTP pa kòrèk';
      }
    } catch (e: unknown) {
      totpError = 'Erè verifikasyon TOTP';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function cancelTotp() {
    showTotp = false;
    totpInput = '';
    totpError = '';
    authenticatedUser = '';
  }
</script>

<svelte:head><title>Aksè Administratè | ST MICHEL</title></svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-smoke-white">
  <div class="bg-card-white rounded-3xl p-8 max-w-md w-full shadow-card border border-border-light">
    <h1 class="text-2xl font-semibold text-center mb-2">SM Aksè Administratè</h1>

    {#if showTotp}
      <p class="text-text-muted text-center mb-6">Verifikasyon dezyèm faktè</p>
      
      <form onsubmit={(e) => { e.preventDefault(); handleTotpVerify(); }}>
        <div class="mb-4">
          <label for="totp-input" class="block mb-1 font-medium">
            Kòd TOTP
          </label>
          <input
            id="totp-input"
            type="text"
            bind:value={totpInput}
            maxlength="6"
            class="w-full p-3 border border-border-light rounded-xl bg-smoke-white focus:ring-2 focus:ring-haiti-blue focus:outline-none"
            placeholder="123456"
            disabled={loading}
            autocomplete="one-time-code"
          />
        </div>

        {#if totpError}
          <div class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-haiti-red text-sm">
            {totpError}
          </div>
        {/if}

        <button
          type="submit"
          disabled={loading}
          class="w-full bg-haiti-blue text-white py-3 rounded-full font-medium disabled:opacity-50 mb-3 transition-opacity"
        >
          {loading ? 'Verifikasyon...' : 'Verifikasyon TOTP'}
        </button>

        <button
          type="button"
          onclick={cancelTotp}
          disabled={loading}
          class="w-full text-sm text-text-muted underline"
        >
          ← Retounen
        </button>
      </form>

    {:else}
      <p class="text-text-muted text-center mb-6">
        {method === 'passkey'
          ? 'Itilize kle sekirite oswa anprent'
          : 'Itilize modpas'}
      </p>

      <div class="flex gap-1 bg-smoke-white p-1 rounded-full mb-4">
        <button
          type="button"
          class="flex-1 py-2 rounded-full transition-colors {mode === 'login'
            ? 'bg-haiti-blue text-white'
            : 'text-text-secondary'}"
          onclick={() => { mode = 'login'; error = ''; successMsg = ''; }}
        >
          Konekte
        </button>
        <button
          type="button"
          class="flex-1 py-2 rounded-full transition-colors {mode === 'register'
            ? 'bg-haiti-blue text-white'
            : 'text-text-secondary'}"
          onclick={() => { mode = 'register'; error = ''; successMsg = ''; }}
        >
          Anrejistre
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); if (method === 'password') handlePassword(); }}>
        <div class="mb-4">
          <label class="block mb-1 font-medium" for="username-input">
            Email oswa non itilizatè
          </label>
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

        {#if method === 'password'}
          <div class="mb-4">
            <label class="block mb-1 font-medium" for="password-input">
              Modpas
            </label>
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

        {#if successMsg}
          <div class="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
            {successMsg}
          </div>
        {/if}

        {#if error}
          <div class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-haiti-red text-sm">
            {error}
          </div>
          <a href={resolve("/admin/recovery")} class="text-sm text-haiti-blue underline mt-2 block text-center">Bliye Modpas?</a>
        {/if}

        {#if mode === 'register' && method === 'password'}
          <div class="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
            ℹ️ Apre enskripsyon, yon administratè dwe apwouve kont ou anvan ou ka konekte.
          </div>
        {/if}

        {#if method === 'passkey'}
          <button
            type="button"
            onclick={handlePasskey}
            disabled={loading}
            class="w-full bg-haiti-blue text-white py-3 rounded-full font-medium disabled:opacity-50 mb-3 transition-opacity"
          >
            {loading ? 'Chaje...' : mode === 'register' ? '🔐 Anrejistre Passkey' : '🔑 Konekte ak Passkey'}
          </button>
        {:else}
          <button
            type="submit"
            disabled={loading}
            class="w-full bg-haiti-blue text-white py-3 rounded-full font-medium disabled:opacity-50 mb-3 transition-opacity"
          >
            {loading ? 'Chaje...' : mode === 'register' ? '📝 Mande Aksè ak Modpas' : '🔓 Konekte ak Modpas'}
          </button>
        {/if}
      </form>

      <button
        type="button"
        onclick={handleDemo}
        disabled={loading}
        class="w-full mb-3 border border-border-light text-text-secondary py-2 rounded-full text-sm hover:bg-smoke-white transition-colors"
      >
        👀 Gade demo (read-only)
      </button>

      <button
        type="button"
        onclick={() => {
          method = method === 'passkey' ? 'password' : 'passkey';
          error = '';
          successMsg = '';
          password = '';
        }}
        class="w-full text-sm text-text-muted underline"
      >
        {method === 'passkey'
          ? 'Pa ka itilize passkey? Klike la pou itilize modpas'
          : 'Retounen nan passkey'}
      </button>

      <p class="text-xs text-text-muted text-center mt-6">
        {#if method === 'passkey'}
          {mode === 'register'
            ? 'W ap kreye yon nouvo kle pou aksè administratè.'
            : 'Itilize anprent ou oswa PIN aparèy la.'}
        {:else}
          {mode === 'register'
            ? 'Soumèt yon demann aksè. Yon admin dwe apwouve l.'
            : 'Konekte ak modpas si w pa ka itilize passkey ou.'}
        {/if}
      </p>
    {/if}
  </div>
</div>