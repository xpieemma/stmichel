<!-- <script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import ConfettiButton from '$components/ConfettiButton.svelte';
  import ShareButton from '$components/ShareButton.svelte';
  import { addStamp, hasStamp } from '$lib/stores/passport';

   let {data}  = $props();
   let history = $derived(data.history);
   let alreadyStamped = $state(false);

  onMount(async () => { alreadyStamped = await hasStamp(history.id); });
  async function handleStamp() { await addStamp(history.id); alreadyStamped = true; }
</script>

<svelte:head>
  <title>{history.title} | Istwa Vil la</title>
  <meta property="og:title" content={history.title} />
  <meta property="og:description" content={history.description.substring(0, 200)} />
  <meta property="og:image" content={history.imageUrl || '/og-default.png'} />
</svelte:head>

<article class="bg-card-white rounded-3xl overflow-hidden border border-border-light shadow-card">
  {#if history.imageUrl}<img src={history.imageUrl} alt={history.title} class="w-full max-h-72 object-cover" />{/if}
  <div class="p-5">
    <h1 class="text-2xl font-semibold mb-4">{history.title}</h1>
    <div class="prose text-text-secondary leading-relaxed space-y-4 mb-6">
      {#each (history.description ?? '').split('\n\n') as para}<p>{para}</p>{/each}
    </div>
    <div class="flex flex-wrap items-center gap-3 pt-4 border-t border-border-light">
      {#if !alreadyStamped}
        <ConfettiButton onstamp={handleStamp}>🛂 Ajoute nan Paspò</ConfettiButton>
      {:else}
        <span class="bg-green-50 text-green-700 px-5 py-3 rounded-full font-medium">✅ Kache Kolekte</span>
      {/if}
      <ShareButton title={history.title} text={history.description ?? ''} url={`https://stmichel.ht/history/${history.slug}`} />
    </div>
  </div>
</article> -->



<script lang="ts">
  import { onMount } from 'svelte';
  import ConfettiButton from '$components/ConfettiButton.svelte';
  import ShareButton from '$components/ShareButton.svelte';
  import { addStamp, hasStamp } from '$lib/stores/passport';

  let { data } = $props();
  let history = $derived(data.history);
  let alreadyStamped = $state(false);

  onMount(async () => {
    alreadyStamped = await hasStamp(history.id);
  });

  async function handleStamp() {
    await addStamp(history.id);
    alreadyStamped = true;
  }
</script>

<svelte:head>
  <title>{history.title} | Istwa Vil la</title>
  <meta property="og:title" content={history.title} />
  <meta property="og:description" content={(history.description ?? '').substring(0, 200)} />
  <meta property="og:image" content={history.imageUrl || '/og-default.png'} />
</svelte:head>

<article class="bg-card-white rounded-3xl overflow-hidden border border-border-light shadow-card">
  {#if history.imageUrl}
    <img src={history.imageUrl} alt={history.title} class="w-full max-h-72 object-cover" />
  {/if}
  <div class="p-5">
    <h1 class="text-2xl font-semibold mb-4">{history.title}</h1>
    <div class="prose text-text-secondary leading-relaxed space-y-4 mb-6">
      {#each (history.description ?? '').split('\n\n') as para, i (i)}
        <p>{para}</p>
      {/each}
    </div>
    <div class="flex flex-wrap items-center gap-3 pt-4 border-t border-border-light">
      {#if !alreadyStamped}
        <ConfettiButton onstamp={handleStamp}>🛂 Ajoute nan Paspò</ConfettiButton>
      {:else}
        <span class="bg-green-50 text-green-700 px-5 py-3 rounded-full font-medium">
          ✅ Kache Kolekte
        </span>
      {/if}
      <ShareButton
        title={history.title}
        text={history.description ?? ''}
        url={`https://stmichel.ht/history/${history.slug}`}
      />
    </div>
  </div>
</article>