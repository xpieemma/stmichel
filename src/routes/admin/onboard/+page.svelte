


<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getLocalDB } from '$lib/db/client';
  import { sql } from 'drizzle-orm';
  import { resolve } from '$app/paths';
  





    let token = $state('');
  let status = $state<'loading' | 'stored' | 'error'>('loading');
  let message = $state('');

  onMount(async () => {
    const urlParams = new URLSearchParams($page.url.search);
    const t = urlParams.get('token');
    
    if (!t) {
      status = 'error';
      message = 'No delegation token found in the link.';
      return;
    }
    
    token = t;

    try {
      // Store the token in OPFS for later sync
      const db = await getLocalDB();
      if (db) {
        // Refactored to match Cloudflare D1 syntax: prepare -> bind -> run
       await db.run(
          sql`INSERT INTO pending_sync (type, payload, created_at) 
              VALUES ('delegation_claim', ${JSON.stringify({ token })}, ${Math.floor(Date.now() / 1000)})`
        );
        
      } else {
        // Fallback to localStorage
        localStorage.setItem('delegation_token', token);
      }
      
      status = 'stored';
      message = 'Delegation token stored. You will be granted admin access once the data syncs. You can now set up your password or passkey.';
    } catch (e) {
      status = 'error';
      message = 'Failed to store delegation token.';
      console.error(e);
    }
  });
</script>

<svelte:head><title>Admin Onboarding | ST MICHEL</title></svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-smoke-white">
  <div class="bg-card-white rounded-3xl p-8 max-w-md w-full text-center">
    {#if status === 'loading'}
      <p class="text-text-primary">Processing delegation…</p>
    {:else if status === 'stored'}
      <span class="text-4xl">✅</span>
      <h1 class="text-2xl font-bold mt-3">Delegation received!</h1>
      <p class="text-text-secondary mt-2">{message}</p>
      
      <button onclick={() => goto(resolve('/admin/login'))}
        class="mt-4 bg-haiti-blue text-white px-6 py-3 rounded-full font-medium">
        Set Up Your Account →
      </button>
    {:else}
      <span class="text-4xl">❌</span>
      <h1 class="text-2xl font-bold mt-3">Error</h1>
      <p class="text-text-secondary mt-2">{message}</p>
    {/if}
  </div>
</div>