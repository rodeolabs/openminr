<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase/client';
    import SeverityBadge from '$lib/components/SeverityBadge.svelte';
    import { Search, Database, Archive, Clock, MapPin, Trash2, Activity, Crosshair } from 'lucide-svelte';
    import { incidentStore } from '$lib/incidents.svelte';

    let incidents = $state<any[]>([]);
    let searchQuery = $state('');
    let loading = $state(false);

    async function fetchHistory() {
        loading = true;
        const { data } = await supabase.from('incidents').select('*, intel_reports(*)')
            .order('created_at', { ascending: false }).limit(50);
        incidents = data || [];
        loading = false;
    }

    async function performSearch() {
        if (!searchQuery.trim()) return fetchHistory();
        loading = true;
        const res = await fetch('/api/search', { method: 'POST', body: JSON.stringify({ query: searchQuery }) });
        const data = await res.json();
        if (data.success) incidents = data.results;
        loading = false;
    }

    onMount(fetchHistory);
</script>

<div class="h-full flex flex-col bg-brand-dark overflow-hidden border-l border-brand-border">
    <!-- Header: Consistent with Tactical HUD Design -->
    <header class="p-4 border-b border-brand-border bg-zinc-950/50 shrink-0 backdrop-blur">
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-lg font-black uppercase tracking-[0.2em] text-white mb-1 flex items-center gap-2">
                    <Archive class="text-brand-accent" size={16} /> Intelligence Archive
                </h2>
                <div class="flex items-center gap-3">
                    <p class="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Historical signal analysis</p>
                    <div class="h-3 w-px bg-zinc-800"></div>
                    <p class="text-[9px] font-mono text-brand-accent uppercase tracking-widest">{incidents.length} RECORDS</p>
                </div>
            </div>
        </div>
        
        <!-- Search Bar - Full width below header -->
        <div class="flex gap-2 mt-4">
            <div class="relative flex-1">
                <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input 
                    bind:value={searchQuery}
                    onkeydown={(e) => e.key === 'Enter' && performSearch()}
                    placeholder="SEARCH HISTORICAL DATA..." 
                    class="w-full bg-black/50 border border-zinc-800 py-2.5 pl-10 pr-4 text-[10px] font-mono text-white outline-none focus:border-brand-accent/50 transition-all placeholder:text-zinc-700 uppercase"
                />
            </div>
            <button 
                onclick={performSearch} 
                disabled={loading}
                class="px-6 bg-brand-accent text-black font-black uppercase tracking-wider text-[9px] hover:bg-white transition-colors disabled:opacity-50"
            >
                {loading ? 'SEARCHING...' : 'QUERY'}
            </button>
        </div>
    </header>

    <!-- Content: Tactical Grid Alignment -->
    <main class="flex-1 overflow-y-auto p-4 custom-scrollbar tactical-grid">
        {#if loading && incidents.length === 0}
            <div class="flex items-center justify-center h-full">
                <Activity size={24} class="animate-pulse text-brand-accent" />
            </div>
        {:else if incidents.length === 0}
            <div class="py-32 text-center bg-brand-dark/50 border border-dashed border-brand-border">
                <Database size={40} class="mx-auto mb-4 text-zinc-800" />
                <h4 class="text-xs font-black uppercase tracking-[0.3em] text-zinc-600">No Intelligence Records Found</h4>
                <p class="text-[9px] font-mono text-zinc-700 mt-2 uppercase">Adjust query parameters or sync signal feed</p>
            </div>
        {:else}
            <div class="max-w-4xl mx-auto space-y-px bg-brand-border">
                {#each incidents as incident (incident.id)}
                    <div 
                        class="bg-brand-dark/40 backdrop-blur-sm p-4 flex gap-4 hover:bg-zinc-900/80 transition-all group cursor-pointer border-l-2 border-l-transparent hover:border-l-brand-accent"
                        onclick={() => incidentStore.select(incident.id)}
                    >
                        <!-- Left: Priority & Time -->
                        <div class="w-24 shrink-0 flex flex-col gap-2">
                            <SeverityBadge severity={incident.severity} confidence={incident.confidence_score} />
                            <div class="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 uppercase">
                                <Clock size={9} class="text-zinc-600" /> 
                                {new Date(incident.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        
                        <!-- Center: Content -->
                        <div class="flex-1 min-w-0 py-0.5">
                            <h3 class="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors mb-1.5 uppercase tracking-tight line-clamp-1">
                                {incident.title}
                            </h3>
                            <p class="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                                {incident.description}
                            </p>
                            {#if incident.lat}
                                <div class="flex items-center gap-1.5 mt-2 text-[9px] font-mono text-zinc-600">
                                    <MapPin size={9} />
                                    {incident.lat.toFixed(2)}, {incident.lon?.toFixed(2)}
                                </div>
                            {/if}
                        </div>

                        <!-- Right: Status -->
                        <div class="w-24 shrink-0 flex flex-col items-end justify-center gap-2">
                            <span class="px-2 py-0.5 text-[8px] font-black uppercase bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-sm tracking-[0.15em]">
                                {incident.status}
                            </span>
                            <span class="text-[8px] font-black uppercase text-zinc-600 tracking-widest">
                                {incident.category || 'GENERAL'}
                            </span>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </main>
</div>
