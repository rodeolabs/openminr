<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase/client';
    import { Search, Database, Archive, Clock, MapPin, Activity, Filter, X } from 'lucide-svelte';
    import { incidentStore } from '$lib/incidents.svelte';

    let incidents = $state<any[]>([]);
    let filteredIncidents = $state<any[]>([]);
    let searchQuery = $state('');
    let loading = $state(false);
    let statusFilter = $state<string | null>(null);
    let statusOptions = $state([
        { value: null, label: 'All', count: 0 },
        { value: 'active', label: 'Active', count: 0 },
        { value: 'claimed', label: 'Claimed', count: 0 },
        { value: 'escalated', label: 'Escalated', count: 0 },
        { value: 'resolved', label: 'Resolved', count: 0 },
        { value: 'dismissed', label: 'Dismissed', count: 0 }
    ]);

    async function fetchHistory() {
        loading = true;
        const { data } = await supabase.from('incidents').select('*, intel_reports(*)')
            .order('created_at', { ascending: false }).limit(100);
        incidents = data || [];
        applyFilters();
        loading = false;
    }

    async function performSearch() {
        if (!searchQuery.trim()) return fetchHistory();
        loading = true;
        const res = await fetch('/api/search', { method: 'POST', body: JSON.stringify({ query: searchQuery }) });
        const data = await res.json();
        if (data.success) incidents = data.results;
        applyFilters();
        loading = false;
    }

    function applyFilters() {
        let result = [...incidents];
        
        // Apply status filter
        if (statusFilter) {
            result = result.filter(i => i.status === statusFilter);
        }
        
        filteredIncidents = result;
        
        // Update counts - use $state updates to trigger reactivity
        statusOptions = [
            { value: null, label: 'All', count: incidents.length },
            { value: 'active', label: 'Active', count: incidents.filter(i => i.status === 'active').length },
            { value: 'claimed', label: 'Claimed', count: incidents.filter(i => i.status === 'claimed').length },
            { value: 'escalated', label: 'Escalated', count: incidents.filter(i => i.status === 'escalated').length },
            { value: 'resolved', label: 'Resolved', count: incidents.filter(i => i.status === 'resolved').length },
            { value: 'dismissed', label: 'Dismissed', count: incidents.filter(i => i.status === 'dismissed').length }
        ];
    }

    // Track last update time from incidentStore to trigger refresh
    let lastStoreUpdate = $state(0);
    
    // Watch for changes in incidentStore
    $effect(() => {
        // Access incidentStore.all to subscribe to changes
        const storeData = incidentStore.all;
        // Only refresh if we have data and it's different from what we have
        if (storeData.length > 0 && !loading) {
            const newUpdateTime = Date.now();
            // Debounce: only refresh if it's been at least 1 second since last update
            if (newUpdateTime - lastStoreUpdate > 1000) {
                lastStoreUpdate = newUpdateTime;
                fetchHistory();
            }
        }
    });

    function setStatusFilter(status: string | null) {
        statusFilter = status;
        applyFilters();
    }

    function formatDateTime(dateStr: string) {
        const d = new Date(dateStr);
        return {
            date: d.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' }),
            time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
        };
    }

    function getPriorityConfig(severity: number) {
        if (severity === 1) return { label: 'P1', color: 'text-red-500', border: 'border-l-red-500', bg: 'bg-red-500/10' };
        if (severity === 2) return { label: 'P2', color: 'text-orange-500', border: 'border-l-orange-500', bg: 'bg-orange-500/10' };
        if (severity === 3) return { label: 'P3', color: 'text-yellow-500', border: 'border-l-yellow-500', bg: 'bg-yellow-500/10' };
        return { label: 'P4', color: 'text-blue-500', border: 'border-l-blue-500', bg: 'bg-blue-500/10' };
    }

    function getStatusConfig(status: string) {
        switch (status) {
            case 'active': return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'ACTIVE' };
            case 'escalated': return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'ESCALATED' };
            case 'claimed': return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'CLAIMED' };
            case 'resolved': return { color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', label: 'RESOLVED' };
            case 'dismissed': return { color: 'text-zinc-600', bg: 'bg-zinc-600/10', border: 'border-zinc-600/20', label: 'DISMISSED' };
            default: return { color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', label: status.toUpperCase() };
        }
    }

    onMount(fetchHistory);
</script>

<div class="h-full flex flex-col bg-brand-dark overflow-hidden border-l border-brand-border">
    <!-- Header -->
    <header class="p-5 border-b border-brand-border bg-zinc-950/80 shrink-0 backdrop-blur space-y-4">
        <div class="flex justify-between items-center">
            <h2 class="text-base font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Archive class="text-brand-accent" size={16} /> Data Archive
            </h2>
        </div>
        
        <!-- Search -->
        <div class="flex gap-2 h-9">
            <div class="relative flex-1 h-full">
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                    <Search size={14} />
                </div>
                <input 
                    bind:value={searchQuery}
                    onkeydown={(e) => e.key === 'Enter' && performSearch()}
                    placeholder="SEARCH INTELLIGENCE..." 
                    class="w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-sm pl-9 pr-3 text-[11px] font-mono text-zinc-200 outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all placeholder:text-zinc-700 uppercase"
                />
            </div>
            <button 
                onclick={performSearch} 
                disabled={loading}
                class="h-full w-28 border text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-2
                    {searchQuery.trim().length > 0 
                        ? 'bg-brand-accent text-black border-brand-accent hover:bg-white hover:border-white shadow-lg shadow-brand-accent/20' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed'}"
            >
                {#if loading}
                    <Activity size={12} class="animate-spin" />
                {:else}
                    <Search size={12} strokeWidth={2.5} />
                {/if}
                <span>QUERY</span>
            </button>
        </div>

        <!-- Status Filter Tabs -->
        <div class="flex flex-wrap gap-1.5 pt-1">
            {#each statusOptions as option}
                <button
                    onclick={() => setStatusFilter(option.value)}
                    class="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-sm border transition-all flex items-center gap-1.5
                        {statusFilter === option.value 
                            ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' 
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}"
                >
                    {#if option.value === 'active'}
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {:else if option.value === 'claimed'}
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {:else if option.value === 'escalated'}
                        <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    {:else if option.value === 'resolved'}
                        <span class="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                    {:else if option.value === 'dismissed'}
                        <span class="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                    {:else}
                        <Filter size={10} />
                    {/if}
                    {option.label}
                    <span class="ml-0.5 px-1 py-0.5 bg-zinc-900 text-zinc-400 rounded text-[8px]">{option.count}</span>
                </button>
            {/each}
            
            {#if statusFilter}
                <button
                    onclick={() => setStatusFilter(null)}
                    class="px-2 py-1.5 text-zinc-500 hover:text-white transition-colors"
                    title="Clear filter"
                >
                    <X size={12} />
                </button>
            {/if}
        </div>
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto custom-scrollbar bg-brand-dark">
        {#if loading && incidents.length === 0}
            <div class="flex items-center justify-center h-full">
                <Activity size={24} class="animate-pulse text-brand-accent" />
            </div>
        {:else if filteredIncidents.length === 0}
            <div class="flex flex-col items-center justify-center h-full text-zinc-700 opacity-50 space-y-3">
                <Database size={32} strokeWidth={1.5} />
                <p class="text-label font-bold uppercase tracking-widest">
                    {statusFilter ? `No ${statusFilter} Records` : 'No Records Found'}
                </p>
            </div>
        {:else}
            <div class="flex flex-col">
                {#each filteredIncidents as incident (incident.id)}
                    {@const dt = formatDateTime(incident.created_at)}
                    {@const p = getPriorityConfig(incident.severity)}
                    {@const s = getStatusConfig(incident.status)}
                    
                    <button 
                        class="group p-4 hover:bg-white/[0.02] border-b border-zinc-900/30 border-l-[3px] {p.border} transition-colors flex gap-4 w-full text-left relative"
                        onclick={() => incidentStore.select(incident.id)}
                    >
                        <!-- Left: Date/Time -->
                        <div class="w-16 shrink-0 flex flex-col gap-0.5 pt-0.5">
                            <div class="text-[10px] font-mono text-zinc-400 font-bold tracking-tight">{dt.date}</div>
                            <div class="text-[9px] font-mono text-zinc-600">{dt.time}</div>
                        </div>
                        
                        <!-- Center: Content -->
                        <div class="flex-1 min-w-0">
                            <!-- Title Row -->
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[9px] font-black {p.color}">{p.label}</span>
                                <h3 class="text-body-sm font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                                    {incident.title}
                                </h3>
                            </div>
                            
                            <!-- Description -->
                            <p class="text-label text-zinc-400 line-clamp-1 leading-relaxed mb-2 opacity-80">
                                {incident.description}
                            </p>
                            
                            <!-- Tags -->
                            <div class="flex items-center gap-2">
                                {#if incident.lat}
                                    <div class="flex items-center gap-1 text-[9px] font-mono text-zinc-600 bg-zinc-900/50 px-1.5 py-0.5 rounded-sm border border-zinc-800/50">
                                        <MapPin size={8} />
                                        {incident.lat.toFixed(2)}, {incident.lon?.toFixed(2)}
                                    </div>
                                {/if}
                                <span class="text-[9px] font-bold uppercase text-zinc-600 tracking-wider">
                                    {incident.category || 'GENERAL'}
                                </span>
                            </div>
                        </div>

                        <!-- Right: Status -->
                        <div class="shrink-0 flex flex-col items-end gap-1.5 pt-1">
                            <span class="px-1.5 py-0.5 text-[8px] font-black uppercase {s.bg} {s.border} {s.color} border rounded-sm tracking-widest">
                                {s.label}
                            </span>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    </main>
</div>
