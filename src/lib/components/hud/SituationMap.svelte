<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import maplibregl from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    import { incidentStore } from '$lib/incidents.svelte';
    import { CONFIG } from '$lib/config';

    let mapContainer: HTMLElement;
    let map = $state<maplibregl.Map>();
    let loaded = $state(false);
    let markers: maplibregl.Marker[] = [];
    
    // Priority Filters - Professional P1-P4 System
    let filters = $state({
        p1: true,
        p2: true,
        p3: true,
        p4: true
    });

    function toggleFilter(key: keyof typeof filters) {
        filters[key] = !filters[key];
    }

    const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

    // Priority configuration aligned with legend
    const PRIORITIES = {
        1: { color: '#ef4444', label: 'P1', size: 10 },
        2: { color: '#f97316', label: 'P2', size: 8 },
        3: { color: '#eab308', label: 'P3', size: 7 },
        4: { color: '#3b82f6', label: 'P4', size: 6 }
    };

    // Update map data when store changes
    $effect(() => {
        if (!map || !loaded) return;

        // Clear existing markers
        markers.forEach(m => m.remove());
        markers = [];

        // Add Incidents by Priority
        incidentStore.filtered
            .filter(i => i.lat != null && i.lon != null)
            .forEach(i => {
                // Apply Priority Filters
                const severity = Math.min(Math.max(i.severity, 1), 4);
                if (severity === 1 && !filters.p1) return;
                if (severity === 2 && !filters.p2) return;
                if (severity === 3 && !filters.p3) return;
                if (severity === 4 && !filters.p4) return;

                const lon = parseFloat(i.lon as any);
                const lat = parseFloat(i.lat as any);
                if (isNaN(lon) || isNaN(lat)) return;

                const isSelected = incidentStore.selectedId === i.id;
                const priority = PRIORITIES[severity as keyof typeof PRIORITIES];
                const size = isSelected ? priority.size + 3 : priority.size;
                
                const container = document.createElement('div');
                container.className = 'group relative flex items-center justify-center transition-all duration-300';
                container.style.cursor = 'pointer';
                container.style.zIndex = isSelected ? '100' : String(50 - severity);

                // Core Marker - Professional Circle
                const dot = document.createElement('div');
                dot.className = 'relative z-10 transition-all duration-300 ease-out';
                dot.style.backgroundColor = priority.color;
                dot.style.width = `${size}px`;
                dot.style.height = `${size}px`;
                dot.style.borderRadius = '50%';
                dot.style.border = '1.5px solid rgba(255,255,255,0.95)';
                dot.style.boxShadow = isSelected 
                    ? `0 0 20px ${priority.color}, 0 0 8px ${priority.color}` 
                    : `0 0 8px ${priority.color}`;

                // Pulse Effect for P1/P2
                if (severity <= 2 || isSelected) {
                    const ping = document.createElement('div');
                    ping.className = 'absolute inset-0 animate-ping opacity-60';
                    ping.style.backgroundColor = priority.color;
                    ping.style.borderRadius = '50%';
                    container.appendChild(ping);
                }

                // Hover Label
                const label = document.createElement('div');
                label.className = 'absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50';
                label.innerHTML = `
                    <div class="bg-zinc-950/95 backdrop-blur border border-zinc-700 px-2 py-1 rounded-sm shadow-xl">
                        <div class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${priority.color}"></span>
                            <span class="text-[9px] font-bold text-white uppercase tracking-wider">${priority.label}</span>
                        </div>
                    </div>
                    <div class="w-1.5 h-1.5 bg-zinc-950/95 border-r border-b border-zinc-700 absolute left-1/2 -translate-x-1/2 -bottom-0.5 rotate-45"></div>
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

    <!-- Professional Priority Legend -->
    <div class="absolute bottom-6 left-6 z-20 pointer-events-none">
        <div class="bg-zinc-950/90 backdrop-blur border border-zinc-800 px-3 py-2 rounded-sm flex flex-col gap-2 shadow-2xl pointer-events-auto min-w-[140px]">
            <div class="flex items-center justify-between gap-4">
                <h5 class="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Priority Filter</h5>
                <span class="text-[8px] font-mono text-zinc-600">{incidentStore.filtered.length} SIG</span>
            </div>
            
            <div class="flex flex-col gap-1.5">
                <button 
                    onclick={() => toggleFilter('p1')}
                    class="flex items-center gap-2 group transition-opacity {filters.p1 ? 'opacity-100' : 'opacity-30'}"
                    title="Toggle P1 Critical"
                >
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white"></span>
                    </span>
                    <span class="text-[9px] font-bold text-red-500 group-hover:text-red-400 uppercase tracking-wider">P1 Critical</span>
                </button>

                <button 
                    onclick={() => toggleFilter('p2')}
                    class="flex items-center gap-2 group transition-opacity {filters.p2 ? 'opacity-100' : 'opacity-30'}"
                    title="Toggle P2 High"
                >
                    <span class="w-2 h-2 rounded-full bg-orange-500 border border-white"></span>
                    <span class="text-[9px] font-bold text-orange-500 group-hover:text-orange-400 uppercase tracking-wider">P2 High</span>
                </button>

                <button 
                    onclick={() => toggleFilter('p3')}
                    class="flex items-center gap-2 group transition-opacity {filters.p3 ? 'opacity-100' : 'opacity-30'}"
                    title="Toggle P3 Medium"
                >
                    <span class="w-1.5 h-1.5 rounded-full bg-yellow-500 border border-white"></span>
                    <span class="text-[9px] font-bold text-yellow-500 group-hover:text-yellow-400 uppercase tracking-wider">P3 Medium</span>
                </button>

                <button 
                    onclick={() => toggleFilter('p4')}
                    class="flex items-center gap-2 group transition-opacity {filters.p4 ? 'opacity-100' : 'opacity-30'}"
                    title="Toggle P4 Low"
                >
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 border border-white"></span>
                    <span class="text-[9px] font-bold text-blue-500 group-hover:text-blue-400 uppercase tracking-wider">P4 Low</span>
                </button>
            </div>
        </div>
    </div>
</div>
