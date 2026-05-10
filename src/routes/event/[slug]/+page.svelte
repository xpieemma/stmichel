<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import ConfettiButton from '$components/ConfettiButton.svelte';
  import ShareButton from '$components/ShareButton.svelte';
  import FeedbackButton from '$components/FeedbackButton.svelte';
  import { addStamp, hasStamp } from '$lib/stores/passport';
	import { SvelteDate } from 'svelte/reactivity';

   let {data} = $props();
  let event = $derived(data.event);
  let alreadyStamped = $state(false);

  const isPastEvent = $derived(() => { 
    if (!event.date) return false;
    const eventDate = new SvelteDate(event.date);

    const cutoff = new SvelteDate(eventDate);
    cutoff.setDate(cutoff.getDate() + 1);
    cutoff.setHours(4, 0, 0, 0);
    
    return new SvelteDate() > cutoff;
  });

  const buttonLabel = $derived(isPastEvent() ? "🛂 Mwen Te La" : "📅 Mwen pral La" );

  onMount(async () => { alreadyStamped = await hasStamp(event.id); });
  async function handleStamp() { await addStamp(event.id); alreadyStamped = true; }
</script>

<svelte:head>
  <title>{event.title} | ST MICHEL</title>
  <meta property="og:title" content={event.title} />
  <meta property="og:description" content={event.description} />
  <meta property="og:image" content={event.imageUrl || '/og-default.png'} />
</svelte:head>

<article class="bg-card-white rounded-3xl overflow-hidden border border-border-light shadow-card">
  {#if event.imageUrl}<img src={event.imageUrl} alt={event.title} class="w-full max-h-80 object-cover" />{/if}
  <div class="p-5">
    <h1 class="text-2xl font-semibold mb-3">{event.title}</h1>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-text-secondary">
      <span class="flex items-center gap-1"><span class="w-1 h-4 bg-haiti-blue rounded-full"></span>📅 {event.date ? new Date(event.date).toLocaleDateString('ht-HT') : 'Dat pa presize' }</span>
      {#if 'time' in event && event.time}<span>🕒 {event.time}</span>{/if}
      {#if 'location' in event && event.location}<span>📍 {event.location}</span>{/if}
    </div>
    <div class="prose text-text-secondary mb-6">{event.description}</div>
    <div class="flex flex-wrap items-center gap-3 pt-4 border-t border-border-light">
      {#if !alreadyStamped}
        <ConfettiButton onstamp={handleStamp}>{buttonLabel}</ConfettiButton>
      {:else}
        <span class="bg-green-50 text-green-700 px-5 py-3 rounded-full font-medium">✅ Kache Kolekte</span>
      {/if}
      <!-- <ShareButton title={event.title} text={event.description ?? ''} url={`https://stmichel.ht/event/${event.slug}`} /> -->
       <ShareButton 
         title={event.title} 
         text={event.description ?? ''} 
         url={$page.url.href} 
       />
      <FeedbackButton eventId={event.id} eventTitle={event.title} />
    </div>
  </div>
</article>
