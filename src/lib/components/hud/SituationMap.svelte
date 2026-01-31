<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import maplibregl from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    import { incidentStore } from '$lib/incidents.svelte';
    import { assetStore } from '$lib/assets.svelte';

    let mapContainer: HTMLElement;
    let map = $state<maplibregl.Map>();
    let loaded = $state(false);
    
    // Config
    const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

    // Synchronize data with map sources
    $effect(() => {
        if (!map || !loaded) return;

        const incidentSource = map.getSource('incidents') as maplibregl.GeoJSONSource;
        if (incidentSource) {
            const incidentGeoJSON = {
                type: 'FeatureCollection',
                features: incidentStore.filtered
                    .filter(i => i.lat !== null && i.lon !== null)
                    .map(i => ({
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [i.lon!, i.lat!] },
                        properties: { 
                            id: i.id, 
                            severity: i.severity, 
                            domain: i.domain || 'unknown',
                            title: i.title 
                        }
                    }))
            };
            incidentSource.setData(incidentGeoJSON as any);
        }

        const assetSource = map.getSource('assets') as maplibregl.GeoJSONSource;
        if (assetSource) {
            const assetGeoJSON = {
                type: 'FeatureCollection',
                features: assetStore.all
                    .filter(a => a.lat !== null && a.lon !== null)
                    .map(a => ({
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [a.lon!, a.lat!] },
                        properties: { 
                            id: a.id, 
                            type: a.type, 
                            name: a.name 
                        }
                    }))
            };
            assetSource.setData(assetGeoJSON as any);
        }
    });

    // Focus Mode Effect
    $effect(() => {
        if (!map || !incidentStore.selected) return;
        const i = incidentStore.selected;
        if (i.lat !== null && i.lon !== null) {
            map.flyTo({
                center: [i.lon, i.lat],
                zoom: 12,
                speed: 1.5,
                curve: 1.5
            });
        }
    });

    onMount(() => {
        map = new maplibregl.Map({
            container: mapContainer,
            style: STYLE,
            center: [0, 20],
            zoom: 1.5,
            attributionControl: false
        });

        map.on('load', () => {
            loaded = true;
            // --- Assets Layer ---
            map!.addSource('assets', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
            map!.addLayer({
                id: 'assets-circle',
                type: 'circle',
                source: 'assets',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#3b82f6', // blue-500
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#fff'
                }
            });

            // --- Incidents Layer ---
            map!.addSource('incidents', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
            
            // Pulsing halo for high severity
            map!.addLayer({
                id: 'incidents-pulse',
                type: 'circle',
                source: 'incidents',
                filter: ['<=', ['get', 'severity'], 2],
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        0, 10,
                        12, 30
                    ],
                    'circle-color': [
                        'match', ['get', 'domain'],
                        'cyber', '#10b981',
                        'physical', '#f59e0b',
                        '#ef4444' // default red
                    ],
                    'circle-opacity': 0.2,
                    'circle-blur': 0.5
                }
            });

            // Main Dot
            map!.addLayer({
                id: 'incidents-point',
                type: 'circle',
                source: 'incidents',
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        0, 3,
                        12, 8
                    ],
                    'circle-color': [
                        'match', ['get', 'domain'],
                        'cyber', '#10b981', // emerald
                        'physical', '#f59e0b', // amber
                        '#ef4444' // red
                    ],
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#000'
                }
            });

            // Interactions
            map!.on('click', 'incidents-point', (e) => {
                const feature = e.features?.[0];
                if (feature) {
                    incidentStore.select(feature.properties.id);
                }
            });

            map!.on('mouseenter', 'incidents-point', () => map!.getCanvas().style.cursor = 'pointer');
            map!.on('mouseleave', 'incidents-point', () => map!.getCanvas().style.cursor = '');
        });
    });

    onDestroy(() => {
        map?.remove();
    });
</script>

<div class="relative w-full h-full bg-brand-surface overflow-hidden">
    <!-- Map Container -->
    <div bind:this={mapContainer} class="w-full h-full tactical-grid"></div>

    <!-- Asset Legend / Controls -->
    <div class="absolute bottom-4 left-4 pointer-events-auto">
         <div class="bg-brand-dark/90 backdrop-blur border border-brand-border p-3 rounded-sm shadow-2xl">
             <h5 class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-1.5">Map Intelligence</h5>
             
             <div class="space-y-2">
                 <!-- Assets Section -->
                 <div class="space-y-1">
                     <span class="text-[7px] font-bold text-zinc-600 uppercase tracking-tighter">Protected Interests (Assets)</span>
                     <div class="flex items-center gap-2">
                         <span class="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white/50 shadow-[0_0_5px_#3b82f6]"></span>
                         <span class="text-[9px] font-bold text-zinc-400 uppercase">Key Terrain</span>
                     </div>
                 </div>

                 <!-- Incidents Section -->
                 <div class="space-y-1">
                     <span class="text-[7px] font-bold text-zinc-600 uppercase tracking-tighter">Tactical Threats (Incidents)</span>
                     <div class="flex items-center gap-2">
                         <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                         <span class="text-[9px] font-bold text-zinc-400 uppercase">Cyber Signal</span>
                     </div>
                     <div class="flex items-center gap-2">
                         <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                         <span class="text-[9px] font-bold text-zinc-400 uppercase">Kinetic Signal</span>
                     </div>
                     <div class="flex items-center gap-2">
                         <div class="relative w-2.5 h-2.5">
                             <span class="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-50"></span>
                             <span class="relative block w-full h-full rounded-full bg-red-600 border border-white/20"></span>
                         </div>
                         <span class="text-[9px] font-bold text-red-500 uppercase">Priority Alert</span>
                     </div>
                 </div>
             </div>

             <div class="mt-3 pt-2 border-t border-zinc-800">
                 <p class="text-[7px] text-zinc-600 uppercase leading-tight font-mono">
                     Spatial correlation active.<br/>Markers indicate signal origin vs asset proximity.
                 </p>
             </div>
         </div>
    </div>
</div>
