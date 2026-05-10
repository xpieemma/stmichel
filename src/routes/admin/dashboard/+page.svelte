<!-- <script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getLocalDB } from '$lib/db/client';
  import { events } from '$lib/db/schema';
  import { eq } from 'drizzle-orm';
  import { syncToServer } from '$lib/db/sync';

  let isAdmin = $state(false);
  let allEvents = $state<any[]>([]);
  let editing = $state<any>(null);
  let form = $state({ slug: '', title: '', description: '', date: '', time: '', location: '', type: 'event' as const, imageUrl: '', published: 1 });

  onMount(async () => { isAdmin = true; await loadEvents(); });
  async function loadEvents() { const db = await getLocalDB(); if (db) allEvents = await db.select().from(events).orderBy(events.date).all(); }
  function edit(ev: any) { editing = ev; form = { ...ev }; }
  function reset() { editing = null; form = { slug: '', title: '', description: '', date: '', time: '', location: '', type: 'event', imageUrl: '', published: 1 }; }
  async function save() {
    if (!form.title || !form.title.trim()) {
      alert('Tit la obligatwa');
      return;
    }
    if (!form.date || !form.date.trim()) {
      alert('Dat la obligatwa');
      return;
    }
    const db = await getLocalDB();
    if (!db) {
      alert('Pa kapab konekte ak baz done lokal la');
      return;
    }
    if (editing) {
      await db.update(events).set(form).where(eq(events.id, editing.id));
    } else {
      form.slug = form.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await db.insert(events).values(form);
    }
    try {
      await syncToServer('events', form);
    } catch (err) {
      // Don't silence — surface that the local write succeeded but the
      // sync didn't, so the admin knows to retry rather than assuming
      // production has the new data.
      console.error('[save] syncToServer failed', err);
      alert('Sove lokal, men echèk pou voye sou sèvè a. L ap reseye otomatikman.');
    }
    await loadEvents();
    reset();
  }
  async function del(id: number) {
    if (!confirm('Efase evènman sa a?')) return;
    // 1. Delete on server first (admin tasks assume online)
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!res.ok) throw new Error('Server delete failed');
    } catch (e) {
      alert('Pa ka efase sou sèvè a. Tcheke koneksyon w.');
      return;
    }
    // 2. Delete locally
    const db = await getLocalDB();
    if (db) await db.delete(events).where(eq(events.id, id));
    await loadEvents();
  }
  async function logout() {
    try {
      await fetch('/admin/api/logout', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
    } catch {
      // Even if the network call fails, local state gets cleared so
      // the next navigation re-prompts for passkey.
    }
    localStorage.removeItem('admin_auth');
    goto('/admin/login');
  }
</script>
<svelte:head><title>Dashboard | Admin</title></svelte:head>


{#if isAdmin}
<div class="p-4 space-y-6">
  <header class="flex justify-between items-center"><h1 class="text-2xl font-semibold">SM Administrasyon</h1><button onclick={logout} class="text-haiti-red">Dekonekte</button></header>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="bg-card-white rounded-2xl p-5 border border-border-light"><h2 class="text-xl font-semibold mb-4">{editing ? 'Modifye' : 'Kreye'} Evènman</h2>
      <form onsubmit = {(e) => {e.preventDefault(); save(e)}} class="space-y-3">
        <label class="block"><span class="font-medium">Tit</span><input type="text" bind:value={form.title} required class="w-full p-2 border border-border-light rounded-lg bg-smoke-white" /></label>
        <label class="block"><span class="font-medium">Deskripsyon</span><textarea bind:value={form.description} rows="3" class="w-full p-2 border border-border-light rounded-lg bg-smoke-white"></textarea></label>
        <div class="grid grid-cols-2 gap-2"><label><span class="font-medium">Dat</span><input type="date" bind:value={form.date} class="w-full p-2 border border-border-light rounded-lg bg-smoke-white" /></label><label><span class="font-medium">Lè</span><input type="time" bind:value={form.time} class="w-full p-2 border border-border-light rounded-lg bg-smoke-white" /></label></div>
        <label class="block"><span class="font-medium">Kote</span><input type="text" bind:value={form.location} class="w-full p-2 border border-border-light rounded-lg bg-smoke-white" /></label>
        <label class="block"><span class="font-medium">Kalite</span><select bind:value={form.type} class="w-full p-2 border border-border-light rounded-lg bg-smoke-white"><option value="event">Evènman</option><option value="poi">Pwen Enterè</option><option value="history">Istwa</option></select></label>
        <div class="flex gap-3 pt-2"><button type="submit" class="bg-haiti-blue text-white px-5 py-2 rounded-full font-medium">{editing ? 'Mete Ajou' : 'Anrejistre'}</button>{#if editing}<button type="button" onclick={reset} class="border border-border-light px-5 py-2 rounded-full">Anile</button>{/if}</div>
      </form>
    </div>
    <div class="bg-card-white rounded-2xl p-5 border border-border-light"><h2 class="text-xl font-semibold mb-4">Tout Evènman ({allEvents.length})</h2>
      <div class="space-y-2 max-h-96 overflow-y-auto">
        {#each allEvents as ev}<div class="flex justify-between items-center p-3 bg-smoke-white rounded-lg"><div><strong>{ev.title}</strong><br><span class="text-xs text-text-muted">{ev.date} · {ev.type}</span></div><div><button onclick={() => edit(ev)} class="mr-2">✏️</button><button onclick={() => del(ev.id)}>🗑️</button></div></div>{/each}
      </div>
    </div>
  </div>
  <nav class="flex gap-4 border-t border-border-light pt-4"><a href="/admin/dashboard/matches" class="text-haiti-blue">⚽ Jere Match yo</a><a href="/admin/dashboard/albums" class="text-haiti-blue">📸 Jere Albòm yo</a><a href="/admin/dashboard/city" class="text-haiti-blue">🏙️ Jere Vil la</a></nav>
</div>
{/if} -->


<!-- <script lang="ts">
  import type { PageData } from './$types';
  import {resolve} from '$app/paths';
  let { data }: { data: PageData } = $props();

  const statCards = $derived([
    { icon: '🎉', label: 'Evènman',       value: data.stats.totalEvents,     href: '/admin/dashboard/events',   color: 'text-haiti-blue' },
    { icon: '⚽', label: 'Match',          value: data.stats.totalMatches,    href: '/admin/dashboard/matches',  color: 'text-haiti-blue' },
    { icon: '📸', label: 'Albòm',          value: data.stats.totalAlbums,     href: '/admin/dashboard/albums',   color: 'text-haiti-blue' },
    { icon: '📜', label: 'Istwa',          value: data.stats.totalHistory,    href: '/admin/dashboard/history',  color: 'text-haiti-blue' },
    { icon: '🏷️', label: 'Kache Kolekte',  value: data.stats.totalStamps,     href: null,                        color: 'text-haiti-blue' },
    { icon: '💬', label: 'Feedback',        value: data.stats.totalFeedback,   href: '/admin/dashboard/feedback', color: 'text-haiti-blue' },
    { icon: '👁️', label: 'Paj Vizite',      value: data.stats.totalPageViews,  href: null,                        color: 'text-haiti-blue' },
    { icon: '📋', label: 'An Atant',        value: data.stats.pendingRequests, href: '/admin/dashboard/requests', color: data.stats.pendingRequests > 0 ? 'text-orange-600' : 'text-haiti-blue' },
  ]);

  const tools = [
    { href: resolve('/admin/dashboard/events'),   icon: '🎉', title: 'Evènman',   desc: 'Kreye, modifye, pibliye evènman' },
    { href: resolve('/admin/dashboard/matches'),  icon: '⚽', title: 'Match',     desc: 'Jere match foutbòl ak skò' },
    { href: resolve('/admin/dashboard/albums'),   icon: '📸', title: 'Albòm',     desc: 'Ajoute foto ak galri' },
    { href: resolve('/admin/dashboard/history'),  icon: '📜', title: 'Istwa',     desc: 'Edite istwa fèt patronal la' },
    { href: resolve('/admin/dashboard/requests'), icon: '📋', title: 'Demann',    desc: 'Apwouve/rejte nouvo admin' },
    { href: resolve('/admin/dashboard/allowlist'),icon: '🔐', title: 'Allowlist',  desc: 'Jere lis admin otorize' },
  ];

  function formatDate(ts: number) {
    return new Date(ts * 1000).toLocaleDateString('fr-HT', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  async function handleLogout() {
    await fetch('/admin/api/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }
</script>

<svelte:head><title>Dashboard | Admin ST MICHEL</title></svelte:head> -->

<!-- <div class="p-4 max-w-6xl mx-auto pb-20"> -->
  <!-- Header -->
  <!-- <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold">SM Dashboard Admin</h1>
      <p class="text-text-muted text-sm">Byenveni, <strong>{data.admin}</strong></p>
    </div>
    <button
      onclick={handleLogout}
      class="text-sm text-haiti-red hover:underline px-3 py-1.5 rounded-full border border-red-200 hover:bg-red-50 transition"
    >🚪 Dekonekte</button>
  </div>

  {#if data.degraded}
    <div class="mb-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm">
      ⚠️ Database binding unavailable — showing zeros. Run with <code>wrangler pages dev</code>.
    </div>
  {/if} -->

  <!-- Pending alert -->
  <!-- {#if data.stats.pendingRequests > 0}
    <a href={resolve("/admin/dashboard/requests")}
       class="block mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 hover:bg-orange-100 transition">
      🔔 <strong>{data.stats.pendingRequests}</strong> demann aksè ap tann apwobasyon ou!
      <span class="text-sm block mt-1">Klike la pou revize yo →</span>
    </a>
  {/if} -->

  <!-- Stats grid -->
  <!-- <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    {#each statCards as card (card.label)}
      <svelte:element
        this={card.href ? 'a' : 'div'}
        href={card.href}
        class="bg-card-white rounded-2xl p-4 text-center border border-border-light
               {card.href ? 'hover:shadow-md hover:border-haiti-blue/30 transition cursor-pointer' : ''}"
      >
        <span class="text-2xl">{card.icon}</span>
        <h2 class="text-3xl font-bold {card.color} mt-1">{card.value}</h2>
        <p class="text-sm text-text-muted">{card.label}</p>
      </svelte:element>
    {/each}
  </div> -->

  <!-- Admin Tools -->
  <!-- <h2 class="text-xl font-semibold mb-4">🛠️ Jere Kontni</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    {#each tools as tool (tool.href)}
      <a href={tool.href}
         class="block p-5 bg-card-white rounded-2xl border border-border-light hover:shadow-md hover:border-haiti-blue/30 transition">
        <span class="text-2xl">{tool.icon}</span>
        <h3 class="font-semibold mt-2">{tool.title}</h3>
        <p class="text-sm text-text-muted">{tool.desc}</p>
      </a>
    {/each}
  </div> -->

  <!-- Two-column: Page views + Recent feedback -->
  <!-- <div class="grid grid-cols-1 md:grid-cols-2 gap-6"> -->
    <!-- Top pages this week -->
    <!-- {#if data.recentViews?.length}
      <div>
        <h2 class="text-lg font-semibold mb-3">📊 Paj ki pi vizite (7 jou)</h2>
        <div class="bg-card-white rounded-2xl border border-border-light overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-smoke-white">
              <tr>
                <th class="text-left p-3">Paj</th>
                <th class="text-right p-3">Vizit</th>
              </tr>
            </thead>
            <tbody>
              {#each data.recentViews as row (row.path)}
                <tr class="border-t border-border-light">
                  <td class="p-3 font-mono text-xs truncate max-w-[200px]">{row.path}</td>
                  <td class="p-3 text-right font-semibold text-haiti-blue">{row.hits}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if} -->

    <!-- Recent feedback -->
    <!-- {#if data.recentFeedback?.length}
      <div>
        <h2 class="text-lg font-semibold mb-3">💬 Dènye Feedback</h2>
        <div class="space-y-3">
          {#each data.recentFeedback as fb (fb.created_at)}
            <div class="bg-card-white rounded-2xl border border-border-light p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-sm">{fb.event_title || 'Anonim'}</span>
                {#if fb.rating}
                  <span class="text-yellow-500 text-sm">
                    {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                  </span>
                {/if}
              </div>
              <p class="text-sm text-text-secondary line-clamp-2">{fb.comment}</p>
              <p class="text-xs text-text-muted mt-1">{formatDate(fb.created_at)}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  Footer -->
  <!-- <p class="text-xs text-text-muted mt-8 text-center">
    Estatistik yo soti dirèkteman nan baz done D1. Dènye koneksyon: {data.admin}.
  </p>
</div> -->


<script lang="ts">
  import type { PageData } from './$types';
  import { resolve } from '$app/paths';
  
  let { data }: { data: PageData } = $props();

  const statCards = $derived([
    { icon: '🎉', label: 'Evènman',       value: data.stats.totalEvents,     href: '/admin/dashboard/events',   color: 'text-haiti-blue' },
    { icon: '⚽', label: 'Match',          value: data.stats.totalMatches,    href: '/admin/dashboard/matches',  color: 'text-haiti-blue' },
    { icon: '📸', label: 'Albòm',          value: data.stats.totalAlbums,     href: '/admin/dashboard/albums',   color: 'text-haiti-blue' },
    { icon: '📜', label: 'Istwa',          value: data.stats.totalHistory,    href: '/admin/dashboard/history',  color: 'text-haiti-blue' },
    { icon: '🏷️', label: 'Kache Kolekte',  value: data.stats.totalStamps,     href: null,                        color: 'text-slate-700' },
    { icon: '💬', label: 'Feedback',        value: data.stats.totalFeedback,   href: '/admin/dashboard/feedback', color: 'text-haiti-blue' },
    { icon: '👁️', label: 'Paj Vizite',      value: data.stats.totalPageViews,  href: null,                        color: 'text-slate-700' },
    { icon: '📋', label: 'An Atant',        value: data.stats.pendingRequests, href: '/admin/dashboard/requests', color: (data.stats?.pendingRequests??0) > 0 ? 'text-orange-600' : 'text-slate-400' },
  ]);

  const tools = [
    { href: resolve('/admin/dashboard/events'),   icon: '🎉', title: 'Evènman',    desc: 'Kreye, modifye, pibliye evènman' },
    { href: resolve('/admin/dashboard/matches'),  icon: '⚽', title: 'Match',      desc: 'Jere match foutbòl ak skò' },
    { href: resolve('/admin/dashboard/albums'),   icon: '📸', title: 'Albòm',      desc: 'Ajoute foto ak galri' },
    { href: resolve('/admin/dashboard/history'),  icon: '📜', title: 'Istwa',      desc: 'Edite istwa fèt patronal la' },
    { href: resolve('/admin/dashboard/requests'), icon: '📋', title: 'Demann',     desc: 'Apwouve oswa rejte nouvo admin' },
    { href: resolve('/admin/dashboard/allowlist'),icon: '🔐', title: 'Allowlist',  desc: 'Jere lis admin ki otorize' },
  ];

  function formatDate(ts: number) {
    return new Date(ts * 1000).toLocaleDateString('ht-HT', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  async function handleLogout() {
    await fetch('/admin/api/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }
</script>

<svelte:head><title>Dashboard | Admin ST MICHEL</title></svelte:head>

<!-- Unique view-transition-name guarantees no crashes -->
<div class="mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6 lg:px-8" style="view-transition-name: admin-dashboard">
  
  <!-- Premium Header -->
  <div class="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <h1 class="font-serif text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Sant Kontwòl</h1>
      <p class="mt-1 font-sans text-sm text-text-muted">Byenveni tounen, <strong class="text-slate-800">{data.admin}</strong></p>
    </div>
    <button
      onclick={handleLogout}
      class="group flex items-center gap-2 rounded-full border border-red-200 bg-red-50/50 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-300 hover:bg-red-100 hover:shadow-sm active:scale-95"
    >
      <span class="transition-transform duration-300 group-hover:-translate-x-1">🚪</span> Dekonekte
    </button>
  </div>

  <!-- Degraded State Warning -->
  {#if data.degraded}
    <div class="mb-8 rounded-[1.5rem] border border-yellow-200 bg-yellow-50 p-5 text-sm font-medium text-yellow-900 shadow-sm">
      <span class="mr-2 text-lg">⚠️</span> Database binding unavailable — showing zeros. Run with <code class="rounded bg-yellow-100 px-1 py-0.5 text-yellow-800">wrangler pages dev</code>.
    </div>
  {/if}

  <!-- Urgent Pending Alert (Live Pulse Integrated) -->
  {#if (data.stats?.pendingRequests??0) > 0}
    <a 
      href={resolve("/admin/dashboard/requests")}
      class="group relative mb-10 flex items-center justify-between overflow-hidden rounded-[1.5rem] border border-orange-200 bg-orange-50 p-5 shadow-sm transition-all duration-300 hover:border-orange-300 hover:bg-orange-100 hover:shadow-md active:scale-[0.99]"
    >
      <div class="absolute left-0 top-0 h-full w-1.5 bg-orange-500"></div>
      <div class="flex items-center gap-4 pl-2">
        <span class="relative flex h-3 w-3 shrink-0">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
          <span class="relative inline-flex h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
        </span>
        <div>
          <p class="font-sans text-sm font-bold text-orange-900">
            {data.stats.pendingRequests} demann aksè ap tann apwobasyon ou!
          </p>
        </div>
      </div>
      <span class="text-orange-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-orange-600">&rarr;</span>
    </a>
  {/if}

  <!-- Editorial Stats Grid -->
  <div class="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
    {#each statCards as card (card.label)}
      <svelte:element
        this={card.href ? 'a' : 'div'}
        href={card.href}
        class="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300
               {card.href ? 'cursor-pointer hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 active:scale-[0.98]' : ''}"
      >
        <div class="flex flex-col items-center justify-center text-center">
          <span class="mb-3 text-2xl transition-transform duration-300 group-hover:scale-110">{card.icon}</span>
          <h2 class="font-serif text-4xl font-bold leading-none {card.color}">{card.value}</h2>
          <p class="mt-3 font-sans text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600">
            {card.label}
          </p>
        </div>
      </svelte:element>
    {/each}
  </div>

  <!-- Admin Tools -->
  <div class="mb-12">
    <h2 class="mb-6 font-serif text-2xl font-bold text-slate-800">🛠️ Jere Kontni</h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {#each tools as tool (tool.href)}
        <a 
          href={tool.href}
          class="group flex items-start gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 active:scale-[0.98]"
        >
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-slate-50 text-xl transition-colors duration-300 group-hover:bg-blue-50">
            {tool.icon}
          </div>
          <div>
            <h3 class="font-serif text-lg font-bold text-slate-800 group-hover:text-haiti-blue">{tool.title}</h3>
            <p class="mt-1 font-sans text-xs font-medium text-text-muted">{tool.desc}</p>
          </div>
        </a>
      {/each}
    </div>
  </div>

  <!-- Two-column: Analytics & Feedback -->
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
    
    <!-- Analytics Table -->
    {#if data.recentViews?.length}
      <div>
        <h2 class="mb-6 font-serif text-xl font-bold text-slate-800">📊 Paj ki pi vizite (7 jou)</h2>
        <div class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th class="p-4 text-left font-sans text-[10px] font-black uppercase tracking-widest text-slate-400">Paj</th>
                <th class="p-4 text-right font-sans text-[10px] font-black uppercase tracking-widest text-slate-400">Vizit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each data.recentViews as row (row.path)}
                <tr class="transition-colors hover:bg-slate-50/50">
                  <td class="p-4 font-mono text-xs text-slate-600 truncate max-w-[200px]">{row.path}</td>
                  <td class="p-4 text-right font-serif text-base font-bold text-haiti-blue">{row.hits}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Recent Feedback -->
    {#if data.recentFeedback?.length}
      <div>
        <h2 class="mb-6 font-serif text-xl font-bold text-slate-800">💬 Dènye Feedback</h2>
        <div class="space-y-4">
          {#each data.recentFeedback as fb (fb.created_at)}
            <div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div class="mb-2 flex items-center justify-between">
                <span class="font-sans text-[11px] font-black uppercase tracking-wider text-slate-500">
                  {fb.event_title || 'Anonim'}
                </span>
                {#if fb.rating}
                  <span class="text-yellow-400 text-sm tracking-widest">
                    {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                  </span>
                {/if}
              </div>
              <p class="font-serif text-base text-slate-800 line-clamp-2 leading-snug">{fb.comment}</p>
              <p class="mt-3 font-sans text-[10px] font-bold tracking-widest text-slate-400">
                {formatDate(fb.created_at)}
              </p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div class="mt-16 border-t border-slate-200 pt-8 text-center">
    <p class="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">
      Estatistik soti dirèkteman nan D1 • Dènye koneksyon: <span class="text-slate-500">{data.admin}</span>
    </p>
  </div>
</div>