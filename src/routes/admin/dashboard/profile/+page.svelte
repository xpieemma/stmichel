<script lang="ts">
  import { get } from 'svelte/store';
  import { currentAdmin } from '$lib/auth/session';
  import { setDecoyPassword, setAdminPin } from '$lib/auth/vault';
  import { fakeToast } from '$lib/stores/toasts';
	import { startHeartbeat } from '$lib/auth/heartbeat';
  import { setRecoveryHint } from '$lib/auth/vault';
  import {encryptHint} from '$lib/auth/recovery';



  // --- Decoy State ---
  let decoyPassword = $state('');
  let loadingDecoy = $state(false);
  let decoyError = $state('');

  // --- PIN State ---
  let pin = $state('');
  let loadingPin = $state(false);
  let pinError = $state('');

  //
 let recoveryHint = $state('');
  let recoveryPin = $state('');
  let loadingRecovery = $state(false);
  let recoveryError = $state('');

  async function handleSetDecoy(e: SubmitEvent) {
    e.preventDefault();
    const session = get(currentAdmin);
    
    if (!session?.username) {
      decoyError = 'Pa gen itilizatè aktif';
      return;
    }

    loadingDecoy = true;
    decoyError = '';
    
    try {
      await setDecoyPassword(session.username, decoyPassword);
      fakeToast('Modpas decoy anrejistre avèk siksè');
      decoyPassword = '';
    } catch (err) {
      decoyError = (err as Error).message;
    } finally {
      loadingDecoy = false;
    }
  }

  async function handleSetPin(e: SubmitEvent) {
    e.preventDefault();
    const session = get(currentAdmin);
    
    if (!session?.username) {
      pinError = 'Pa gen itilizatè aktif';
      return;
    }
    if (pin.length < 4) {
      pinError = 'PIN dwe genyen omwen 4 chif';
      return;
    }

    loadingPin = true;
    pinError = '';
    
    try {
      await setAdminPin(session.username, pin);
      fakeToast('PIN lokal sove avèk siksè');
      pin = '';
      startHeartbeat(session.username);
    } catch (err) {
      pinError = (err as Error).message;
    } finally {
      loadingPin = false;
    }
  }

  
  async function handleSetRecovery(e: SubmitEvent) {
    e.preventDefault();
    const session = get(currentAdmin);
    
    if (!session?.username) {
      recoveryError = 'Pa gen itilizatè aktif';
      return;
    }
    if (!recoveryHint || !recoveryPin) {
      recoveryError = 'Antre endis ak PIN rekiperasyon an';
      return;
    }
    if (recoveryPin.length < 4) {
      recoveryError = 'PIN rekiperasyon dwe genyen omwen 4 karaktè';
      return;
    }

    loadingRecovery = true;
    recoveryError = '';
    
    try {
      const encryptedBlob = await encryptHint(recoveryHint, recoveryPin);
      await setRecoveryHint(session.username, encryptedBlob);
      fakeToast('Endis rekiperasyon anrejistre avèk siksè');
      recoveryHint = '';
      recoveryPin = '';
    } catch (err) {
      recoveryError = (err as Error).message;
    } finally {
      loadingRecovery = false;
    }
  }
</script>

<div class="space-y-8">
  <div class="bg-card-white rounded-3xl p-6 border border-border-light shadow-sm">
    <h2 class="text-lg font-semibold mb-2">🎭 Modpas Decoy (Lekti Sèlman)</h2>
    <p class="text-sm text-text-secondary mb-4">
      Kreye yon modpas apa. Lè ou konekte ak modpas sa a, tablodbò a ap parèt nan mòd lekti sèlman (pa gen okenn modifikasyon ki pèmèt) pou pwoteksyon.
    </p>

    <form onsubmit={handleSetDecoy} class="space-y-4">
      <div>
        <label class="block mb-1 font-medium text-sm" for="decoy-input">
          Nouvo Modpas Decoy
        </label>
        <input 
          id="decoy-input"
          type="password" 
          bind:value={decoyPassword} 
          required 
          minlength="10"
          disabled={loadingDecoy}
          placeholder="Omwen 10 karaktè"
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white focus:ring-2 focus:ring-haiti-blue focus:outline-none" 
        />
        {#if decoyError}
          <p class="text-haiti-red text-xs mt-2">{decoyError}</p>
        {/if}
      </div>

      <button 
        type="submit" 
        disabled={loadingDecoy}
        class="bg-haiti-blue text-white px-6 py-3 rounded-full font-medium text-sm disabled:opacity-50 transition-opacity"
      >
        {loadingDecoy ? 'Ap anrejistre...' : 'Sove Modpas Decoy'}
      </button>
    </form>
  </div>

  <div class="bg-card-white rounded-3xl p-6 border border-border-light shadow-sm">
    <h2 class="text-lg font-semibold mb-2">🔒 PIN Lokal (Oto-Fèmen)</h2>
    <p class="text-sm text-text-secondary mb-4">
      Defini yon PIN pou pwoteje aparèy sa a. Sesyon ou an ap fèmen otomatikman apre 15 minit inaktivite, epi w ap bezwen PIN sa a pou relouvri l.
    </p>

    <form onsubmit={handleSetPin} class="space-y-4">
      <div>
        <label class="block mb-1 font-medium text-sm" for="pin-input">
          PIN (4-6 Chif)
        </label>
        <input 
          id="pin-input"
          type="password" 
          inputmode="numeric" 
          maxlength="6" 
          bind:value={pin}
          disabled={loadingPin}
          placeholder="123456"
          class="w-full p-3 border border-border-light rounded-xl bg-smoke-white focus:ring-2 focus:ring-haiti-blue focus:outline-none" 
        />
        {#if pinError}
          <p class="text-haiti-red text-xs mt-2">{pinError}</p>
        {/if}
      </div>

      <button 
        type="submit" 
        disabled={loadingPin}
        class="bg-haiti-blue text-white px-6 py-3 rounded-full font-medium text-sm disabled:opacity-50 transition-opacity"
      >
        {loadingPin ? 'Ap sove...' : 'Sove PIN Lokal'}
      </button>
    </form>
  </div>
  <div class="bg-card-white rounded-3xl p-6 border border-border-light shadow-sm">
  <h2 class="text-lg font-semibold mb-2">🔑 Endis Rekiperasyon Modpas</h2>
  <p class="text-sm text-text-secondary mb-4">
    Sere yon ti endis pou ede w sonje modpas ou. Endis la ap ankripte epi li p ap vizib san yon PIN espesyal epi yon tan datant 5 minit.
  </p>

  <form onsubmit={handleSetRecovery} class="space-y-4">
    <div>
      <label class="block mb-1 font-medium text-sm" for="recovery-hint-input">
        Endis Rekiperasyon
      </label>
      <input 
        id="recovery-hint-input"
        type="text" 
        bind:value={recoveryHint} 
        required
        disabled={loadingRecovery}
        placeholder="eg. Non chen mwen + ane fèt mwen"
        class="w-full p-3 border border-border-light rounded-xl bg-smoke-white focus:ring-2 focus:ring-haiti-blue focus:outline-none" 
      />
    </div>
    <div>
      <label class="block mb-1 font-medium text-sm" for="recovery-pin-input">
        PIN Rekiperasyon
      </label>
      <input 
        id="recovery-pin-input"
        type="password" 
        inputmode="numeric" 
        maxlength="6" 
        bind:value={recoveryPin}
        required
        disabled={loadingRecovery}
        placeholder="Kreye yon PIN 4-6 chif"
        class="w-full p-3 border border-border-light rounded-xl bg-smoke-white focus:ring-2 focus:ring-haiti-blue focus:outline-none" 
      />
      <p class="text-xs text-text-muted mt-1">W ap bezwen PIN sa a lè w vle wè endis la.</p>
    </div>

    {#if recoveryError}
      <p class="text-haiti-red text-xs">{recoveryError}</p>
    {/if}

    <button 
      type="submit" 
      disabled={loadingRecovery}
      class="bg-haiti-blue text-white px-6 py-3 rounded-full font-medium text-sm disabled:opacity-50 transition-opacity"
    >
      {loadingRecovery ? 'Ap chifreman...' : 'Sove Endis Rekiperasyon'}
    </button>
  </form>
</div>
</div>