<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';

  // Destructure props with Svelte 5 $props rune
  let { incidents = [], onSelect = (id: string) => {} } = $props<{ 
    incidents: any[], 
    onSelect?: (id: string) => void 
  }>();

  let mapContainer: HTMLElement;
  let map = $state<maplibregl.Map>();
  let markers: maplibregl.Marker[] = [];

  const style = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

  // Svelte 5 $effect: Synchronizes the imperative MapLibre API with the declarative Svelte state.
  $effect(() => {
    if (!map) return;
    
    // Clear old markers
    markers.forEach(m => m.remove());
    markers = [];

    incidents.forEach((incident: any) => {
      if (!incident.lat || !incident.lon) return;

      const container = document.createElement('div');
      container.className = 'relative flex items-center justify-center w-6 h-6 cursor-pointer group';

      const dot = document.createElement('div');
      dot.className = 'w-3 h-3 rounded-full border border-white/20 z-20 transition-transform group-hover:scale-125';
      
      const colors = ['#dc2626', '#f97316', '#facc15', '#60a5fa', '#71717a'];
      const color = colors[incident.severity - 1] || colors[4];
      dot.style.backgroundColor = color;
      dot.style.boxShadow = `0 0 8px ${color}`;

      // HIGH SEVERITY (1-2) GLOW: Critical and High incidents "ping" to attract visual attention.
      if (incident.severity <= 2) {
          const ping = document.createElement('div');
          ping.className = 'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping -z-10';
          ping.style.backgroundColor = color;
          container.appendChild(ping);
      }

      container.appendChild(dot);

      const marker = new maplibregl.Marker({ element: container })
        .setLngLat([incident.lon, incident.lat])
        .addTo(map!);
      
      container.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect(incident.id);
      });
      
      markers.push(marker);
    });
  });

  onMount(() => {
    map = new maplibregl.Map({
      container: mapContainer,
      style: style,
      center: [20, 40],
      zoom: 1.5,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
  });

  onDestroy(() => {
    if (map) map.remove();
  });
</script>

<div class="w-full h-full relative">
  <div bind:this={mapContainer} class="w-full h-full"></div>
  
  <!-- TACTICAL LEGEND: Defines the severity visualization logic for the operator -->
  <div class="absolute top-4 left-4 z-10 flex flex-col gap-2 p-3 bg-brand-surface/90 backdrop-blur-md border border-brand-border rounded-sm shadow-2xl">
    <h5 class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Signal Status</h5>
    <div class="space-y-1.5">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_5px_#dc2626] animate-pulse"></div>
        <span class="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Critical (Pulse)</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-orange-500"></div>
        <span class="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">High Signal</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-yellow-400"></div>
        <span class="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Elevated</span>
      </div>
    </div>
  </div>

  <div class="absolute bottom-4 left-4 z-10">
    <div class="bg-brand-surface/80 backdrop-blur-md border border-brand-border px-2 py-1 rounded-sm text-[9px] font-mono text-zinc-500">
      {incidents.length} active markers
    </div>
  </div>
</div>

<style>
  :global(.maplibregl-popup-content) {
    background: #161618 !important;
    color: white !important;
    border: 1px solid #27272a !important;
    padding: 8px !important;
    border-radius: 4px !important;
  }
  :global(.maplibregl-popup-tip) {
    border-top-color: #161618 !important;
  }
</style>
