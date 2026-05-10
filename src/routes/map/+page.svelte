


<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocalDB } from '$lib/db/client';
  import { events } from '$lib/db/schema';
  import { eq } from 'drizzle-orm';

  let mapContainer: HTMLDivElement;
  
  // 1. We changed this to 'any' to stop the TypeScript errors
  let map:  any; 

  onMount(async () => {
    await import('leaflet/dist/leaflet.css');
    
    // 2. We added this @ts-ignore to force TypeScript to skip this line
    // @ts-ignore
    const L = (await import('leaflet')).default;

    map = L.map(mapContainer).setView([19.38, -72.32], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    const db = await getLocalDB();
    if (db) {
      const pois = await db.select().from(events).where(eq(events.type, 'poi')).all();
      pois.forEach((poi) => {
        
        if (poi.lat && poi.lng) {
          const isUrgent = (poi as any).category === 'emergency';
          const node = document.createElement('div');
          node.className = 'marker-icon ' + (isUrgent ? 'marker-urgent' : '');
          const titleEl = document.createElement('strong');
          titleEl.textContent = poi.title;
          node.appendChild(titleEl);
          if (poi.description) {
            node.appendChild(document.createElement('br'));
            const descEl = document.createElement('span');
            descEl.textContent = poi.description;
            node.appendChild(descEl);
          }
          const icon = L.divIcon({ html: node.outerHTML, className: 'custom-div-icon' });
          L.marker([parseFloat(poi.lat), parseFloat(poi.lng)], { icon })
            .addTo(map)
            .bindPopup(node);
        }
      });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          L.marker([pos.coords.latitude, pos.coords.longitude])
            .addTo(map)
            .bindPopup('Ou isit la')
            .openPopup();
          map.setView([pos.coords.latitude, pos.coords.longitude], 15);
        },
        (err) => console.warn('Geolocation error', err)
      );
    }
  });
</script>

<svelte:head><title>Kat la | ST MICHEL</title></svelte:head>

<div class="fixed top-0 left-0 right-0 bottom-20 z-10">
  <div bind:this={mapContainer} class="w-full h-full"></div>
</div>