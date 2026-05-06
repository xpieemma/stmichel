<script lang="ts">

  import { setDecoyPassword } from '$lib/auth/vault';
  import { currentAdmin } from '$lib/auth/session';
let username = $state('');
onMount(() => {
  currentAdmin.subscribe(s => { if (s) username = s.username; });
});

let decoyPassword = $state('');

async function handleSetDecoy(e: SubmitEvent) {
  e.preventDefault();
  try {
    await setDecoyPassword(username, decoyPassword); // need username
    fakeToast('Decoy password set');
  } catch (err) {
    error = (err as Error).message;
  }
}
</script>

<h2 class="text-lg font-semibold mb-3 mt-8">Decoy Password (plausible deniability)</h2>
<p class="text-sm text-text-secondary mb-4">Set a separate password that, when entered at login, shows a read-only version of the dashboard.</p>
<form onsubmit={handleSetDecoy} class="space-y-4">
  <label class="block">
    <span class="font-medium">Decoy Password</span>
    <input type="password" bind:value={decoyPassword} required minlength="10"
      class="w-full p-3 border rounded-xl mt-1 bg-smoke-white" />
  </label>
  <button type="submit" class="bg-haiti-blue text-white px-6 py-3 rounded-full font-medium">Set Decoy Password</button>
</form>