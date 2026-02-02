<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import maplibregl from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    import { incidentStore } from '$lib/incidents.svelte';
    import { assetStore } from '$lib/assets.svelte';

    let mapContainer: HTMLElement;
    let map = $state<maplibregl.Map>();
    let loaded = $state(false);
    let markers: maplibregl.Marker[] = [];
    
    // Visualization Filters
    let filters = $state({
        assets: true,
        cyber: true,
        kinetic: true,
        critical: true
    });

    function toggleFilter(key: keyof typeof filters) {
        filters[key] = !filters[key];
    }

    const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

    // Update map data when store changes
    $effect(() => {
        if (!map || !loaded) return;

        // Clear existing markers
        markers.forEach(m => m.remove());
        markers = [];

        // Add Incidents
        incidentStore.filtered
            .filter(i => i.lat != null && i.lon != null)
            .forEach(i => {
                // Apply Filters
                if (i.severity <= 2 && !filters.critical) return;
                if (i.severity > 2) {
                    if (i.domain === 'cyber' && !filters.cyber) return;
                    if (i.domain === 'physical' && !filters.kinetic) return;
                }

                const lon = parseFloat(i.lon as any);
                const lat = parseFloat(i.lat as any);
                if (isNaN(lon) || isNaN(lat)) return;

                const isSelected = incidentStore.selectedId === i.id;
                const container = document.createElement('div');
                container.className = 'group relative flex items-center justify-center transition-all duration-300';
                container.style.cursor = 'pointer';
                container.style.zIndex = isSelected ? '100' : '50';
                
                // Color Mapping
                let color = '#ef4444'; // Red (Critical)
                let type: 'critical' | 'cyber' | 'kinetic' | 'unknown' = 'critical';
                
                if (i.severity > 2) {
                    if (i.domain === 'cyber') { color = '#10b981'; type = 'cyber'; }
                    else if (i.domain === 'physical') { color = '#f59e0b'; type = 'kinetic'; }
                    else { color = '#ffffff'; type = 'unknown'; }
                }

                // Core Dot
                const dot = document.createElement('div');
                dot.className = 'relative z-10 transition-all duration-300 ease-out shadow-lg';
                dot.style.backgroundColor = color;
                
                // Tactical Shape (CSS Only, Simple & Clean)
                if (type === 'kinetic') {
                    dot.style.width = isSelected ? '12px' : '8px';
                    dot.style.height = isSelected ? '12px' : '8px';
                    dot.style.transform = 'rotate(45deg)';
                } else if (type === 'cyber') {
                    dot.style.width = isSelected ? '10px' : '7px';
                    dot.style.height = isSelected ? '10px' : '7px';
                    dot.style.borderRadius = '1px';
                } else {
                    // Critical / Default
                    dot.style.width = isSelected ? '12px' : '8px';
                    dot.style.height = isSelected ? '12px' : '8px';
                    dot.style.borderRadius = '50%';
                }
                
                dot.style.border = '1px solid rgba(255,255,255,0.9)'; // High contrast border
                dot.style.boxShadow = isSelected ? `0 0 15px ${color}, 0 0 5px ${color}` : `0 0 6px ${color}`;

                // Pulse/Ping Effect (Simpler)
                if (i.severity <= 2 || isSelected) {
                    const ping = document.createElement('div');
                    ping.className = 'absolute inset-0 animate-ping opacity-75';
                    ping.style.backgroundColor = color;
                    
                    if (type === 'kinetic') ping.style.transform = 'rotate(45deg)';
                    else if (type === 'cyber') ping.style.borderRadius = '1px';
                    else ping.style.borderRadius = '50%';
                    
                    container.appendChild(ping);
                }

                // Hover Label (Mini HUD - Simplified)
                const label = document.createElement('div');
                label.className = 'absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50';
                label.innerHTML = `
                    <div class="bg-zinc-950/90 backdrop-blur border border-zinc-800 px-2 py-1 text-[9px] font-mono text-white rounded-sm shadow-xl flex flex-col items-center gap-0.5">
                        <span class="font-bold uppercase tracking-wider" style="color: ${color}">${type}</span>
                    </div>
                    <div class="w-1.5 h-1.5 bg-zinc-950/90 border-r border-b border-zinc-800 absolute left-1/2 -translate-x-1/2 -bottom-0.5 rotate-45"></div>
                `;
                container.appendChild(label);

                container.appendChild(dot);

                const marker = new maplibregl.Marker({ element: container })
                    .setLngLat([lon, lat])
                    .addTo(map!);
                
                container.addEventListener('click', (e) => {
                    e.stopPropagation();
                    incidentStore.select(i.id);
                });

                markers.push(marker);
            });

        // Add Assets (Simplified)
        if (filters.assets) {
            assetStore.all
                .filter(a => a.lat != null && a.lon != null)
                .forEach(a => {
                    const el = document.createElement('div');
                    el.className = 'group relative flex items-center justify-center';
                    
                    const dot = document.createElement('div');
                    dot.className = 'bg-[#3b82f6] border border-white shadow-[0_0_8px_#3b82f6]';
                    dot.style.width = '6px';
                    dot.style.height = '6px';
                    dot.style.borderRadius = '50%';
                    
                    // Simple Label
                    const label = document.createElement('div');
                    label.className = 'absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50';
                    label.innerHTML = `
                        <div class="bg-blue-950/90 backdrop-blur border border-blue-800 px-1.5 py-0.5 text-[8px] font-mono text-blue-200 rounded-sm shadow-xl">
                            ${a.name || 'ASSET'}
                        </div>
                    `;
                    el.appendChild(label);
                    el.appendChild(dot);

                    const marker = new maplibregl.Marker({ element: el })
                        .setLngLat([Number(a.lon), Number(a.lat)])
                        .addTo(map!);
                    markers.push(marker);
                });
        }
    });

    // Fly to selected
    $effect(() => {
        if (!map || !incidentStore.selected) return;
        const i = incidentStore.selected;
        if (i.lat != null && i.lon != null) {
            map.flyTo({ center: [Number(i.lon), Number(i.lat)], zoom: 7, speed: 1.2 });
        }
    });

    onMount(() => {
        map = new maplibregl.Map({
            container: mapContainer,
            style: STYLE,
            center: [10, 30],
            zoom: 2.2,
            attributionControl: false
        });
        map.on('load', () => { 
            loaded = true; 
            setTimeout(() => map?.resize(), 100);
        });
    });

    onDestroy(() => {
        markers.forEach(m => m.remove());
        map?.remove();
    });
</script>

<div class="relative w-full h-full bg-[#050506] overflow-hidden">
    <div bind:this={mapContainer} class="w-full h-full"></div>

    <!-- Interactive Tactical Legend -->
    <div class="absolute bottom-6 left-6 z-20 pointer-events-none">
        <div class="bg-[#0d0d0f]/90 backdrop-blur border border-zinc-800 px-3 py-2 rounded-sm flex flex-col gap-2 shadow-2xl pointer-events-auto">
            <div class="flex items-center justify-between gap-4">
                <h5 class="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Signal Filters</h5>
                <span class="text-[8px] font-mono text-zinc-700">{incidentStore.filtered.length} SIG</span>
            </div>
            
            <div class="flex items-center gap-3">
                <button 
                    onclick={() => toggleFilter('assets')}
                    class="flex items-center gap-2 group transition-opacity {filters.assets ? 'opacity-100' : 'opacity-40 grayscale'}"
                    title="Toggle Friendly Assets"
                >
                    <span class="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shadow-[0_0_5px_#3b82f6] border border-blue-400/50"></span>
                    <span class="text-[9px] font-bold text-zinc-400 group-hover:text-white uppercase tracking-wider transition-colors">Assets</span>
                </button>
                
                <div class="w-px h-3 bg-zinc-800"></div>

                <button 
                    onclick={() => toggleFilter('cyber')}
                    class="flex items-center gap-2 group transition-opacity {filters.cyber ? 'opacity-100' : 'opacity-40 grayscale'}"
                    title="Toggle Cyber Threats"
                >
                    <span class="w-1.5 h-1.5 rounded-[1px] bg-[#10b981] shadow-[0_0_5px_#10b981] border border-emerald-400/50"></span>
                    <span class="text-[9px] font-bold text-zinc-400 group-hover:text-white uppercase tracking-wider transition-colors">Cyber</span>
                </button>

                <button 
                    onclick={() => toggleFilter('kinetic')}
                    class="flex items-center gap-2 group transition-opacity {filters.kinetic ? 'opacity-100' : 'opacity-40 grayscale'}"
                    title="Toggle Kinetic Threats"
                >
                    <span class="w-1.5 h-1.5 rotate-45 bg-[#f59e0b] shadow-[0_0_5px_#f59e0b] border border-amber-400/50"></span>
                    <span class="text-[9px] font-bold text-zinc-400 group-hover:text-white uppercase tracking-wider transition-colors">Kinetic</span>
                </button>

                <div class="w-px h-3 bg-zinc-800"></div>

                <button 
                    onclick={() => toggleFilter('critical')}
                    class="flex items-center gap-2 group transition-opacity {filters.critical ? 'opacity-100' : 'opacity-40 grayscale'}"
                    title="Toggle Critical Severity"
                >
                    <span class="relative flex h-1.5 w-1.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600 shadow-[0_0_6px_#dc2626]"></span>
                    </span>
                    <span class="text-[9px] font-bold text-red-500 group-hover:text-red-400 uppercase tracking-wider transition-colors">Critical</span>
                </button>
            </div>
        </div>
    </div>
</div>
