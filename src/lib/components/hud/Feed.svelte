<script lang="ts">
    import { incidentStore } from '$lib/incidents.svelte';
    import { AlertTriangle, Radio, Target, Zap } from 'lucide-svelte';
    import { supabase } from '$lib/supabase/client';
    import type { Incident, Mission } from '$lib/types';
    import { onMount } from 'svelte';
    import { system } from '$lib/system.svelte';

    let missions = $state<Mission[]>([]);
    let selectedMissionId = $state<string | null>(null);
    let activeTab = $state<'live' | 'priority'>('live');

    async function loadMissions() {
        const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
        if (data) missions = data;
    }

    function selectMission(id: string | null) {
        selectedMissionId = id;
        // Directly using the store method if it exists, or handling via store property
        incidentStore.setMissionId(id);
    }

    onMount(loadMissions);

    // Grouping Logic
    let priorityIncidents = $derived(incidentStore.filtered.filter(i => i.severity <= 2));
    let standardIncidents = $derived(incidentStore.filtered.filter(i => i.severity > 2));
</script>

<div class="hud-panel w-full border-r-0 bg-brand-dark flex flex-col h-full text-white">
    
    <!-- 1. Operational Scope (Targeting Vectors) -->
    <div class="p-4 border-b border-brand-border bg-zinc-950/80 shrink-0">
        <div class="flex justify-between items-center mb-4">
            <label for="mission-select" class="text-[10px] font-black uppercase text-brand-muted tracking-widest flex items-center gap-2">
                <Target size={12} /> Operational Scope
            </label>
            <button 
                onclick={() => system.triggerSync(true)}
                class="text-[9px] font-black text-zinc-500 hover:text-brand-accent flex items-center gap-1.5 uppercase transition-colors"
            >
                <Zap size={10} class={system.isSyncing ? 'animate-pulse text-brand-accent' : ''} />
                Scan
            </button>
        </div>
        
        <div class="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            <button
                class="w-full text-left px-3 py-2 text-[10px] font-bold uppercase border rounded-sm transition-all flex justify-between items-center
                    {selectedMissionId === null 
                        ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' 
                        : 'border-zinc-800/50 text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}
                "
                onclick={() => selectMission(null)}
            >
                <span class="tracking-widest">Global Signal</span>
                <span class="text-[8px] font-mono opacity-50">{incidentStore.all.length}</span>
            </button>
            
            {#each missions as m}
                <button
                    class="w-full text-left px-3 py-2 text-[10px] font-bold uppercase border rounded-sm transition-all
                        {selectedMissionId === m.id 
                            ? 'bg-brand-accent/10 border-brand-accent text-brand-accent shadow-[0_0_10px_rgba(255,62,62,0.1)]' 
                            : 'border-zinc-800/50 text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}
                    "
                    onclick={() => selectMission(m.id)}
                >
                    <div class="flex justify-between items-center">
                        <span class="truncate pr-2 tracking-widest">{m.name}</span>
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-[8px] font-mono opacity-50">
                                {incidentStore.all.filter(i => (i as any).tags?.includes(`mission:${m.id}`)).length}
                            </span>
                            <div class="w-1.5 h-1.5 rounded-full {m.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-700'}"></div>
                        </div>
                    </div>
                </button>
            {/each}
        </div>
    </div>

    <!-- 2. Feed Categorization Tabs -->
    <div class="flex border-b border-brand-border bg-zinc-950 shrink-0">
        <button 
            onclick={() => activeTab = 'live'}
            class="flex-1 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center justify-center gap-2
            {activeTab === 'live' ? 'border-brand-accent text-white bg-white/5' : 'border-transparent text-zinc-600 hover:text-zinc-400'}"
        >
            <Radio size={10} class={activeTab === 'live' ? 'text-brand-accent animate-pulse' : ''} />
            Live
        </button>
        <button 
            onclick={() => activeTab = 'priority'}
            class="flex-1 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center justify-center gap-2
            {activeTab === 'priority' ? 'border-red-500 text-red-400 bg-red-950/20' : 'border-transparent text-zinc-600 hover:text-zinc-400'}"
        >
            <AlertTriangle size={10} />
            Priority
        </button>
    </div>

    <!-- 3. Scrollable Content -->
    <div class="flex-1 overflow-y-auto custom-scrollbar bg-brand-dark space-y-px">
        
        {#if activeTab === 'priority'}
            {#if priorityIncidents.length === 0}
                <div class="p-12 text-center opacity-40">
                    <div class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 mx-auto mb-3 flex items-center justify-center">
                        <AlertTriangle size={18} class="text-zinc-700" />
                    </div>
                    <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Clear Skies</h3>
                    <p class="text-[8px] font-mono text-zinc-600 uppercase">No high-severity threats in scope</p>
                </div>
            {:else}
                {#each priorityIncidents as incident (incident.id)}
                    {@render IncidentRow({ incident })}
                {/each}
            {/if}

        {:else}
            {#if priorityIncidents.length > 0}
                <div class="bg-red-950/5 border-b border-red-900/20">
                    <div class="px-3 py-1.5 bg-red-950/30 text-[8px] font-black uppercase text-red-500 tracking-widest border-b border-red-900/20 flex justify-between">
                        <span>Pinned Threats</span>
                        <span>{priorityIncidents.length} Alert{priorityIncidents.length > 1 ? 's' : ''}</span>
                    </div>
                    {#each priorityIncidents as incident (incident.id)}
                        {@render IncidentRow({ incident, isPinned: true })}
                    {/each}
                </div>
            {/if}

            {#each standardIncidents as incident (incident.id)}
                {@render IncidentRow({ incident })}
            {/each}
            
            {#if incidentStore.filtered.length === 0}
                <div class="flex flex-col items-center justify-center h-64 text-zinc-700 space-y-4 opacity-50 px-8 text-center">
                    <div class="w-12 h-12 border border-zinc-800 rounded-sm flex items-center justify-center relative overflow-hidden">
                        <div class="absolute inset-0 bg-brand-accent/5 animate-pulse"></div>
                        <Radio size={20} class="text-zinc-800" />
                    </div>
                    <div>
                        <span class="text-[10px] font-black uppercase tracking-[0.3em] block mb-2 text-zinc-500">Scanning Signal</span>
                        <p class="text-[8px] font-mono text-zinc-600 uppercase leading-relaxed">
                            Awaiting real-time tactical intelligence for the selected operational scope.
                        </p>
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>

{#snippet IncidentRow({ incident, isPinned = false }: { incident: Incident, isPinned?: boolean })}
    <button
        id="incident-{incident.id}"
        class="w-full text-left p-4 border-l-2 transition-all duration-150 hover:bg-white/5 group border-b border-zinc-900/30
            {incidentStore.selectedId === incident.id ? 'bg-zinc-900/50 border-l-4' : 'border-l-transparent'}
            {incident.severity <= 2 ? 'border-l-brand-accent' : ''}
            {isPinned ? 'bg-red-500/[0.03]' : ''}
        "
        onclick={() => incidentStore.select(incident.id)}
    >
        <div class="flex justify-between items-start mb-2">
            <span class="font-mono text-[9px] opacity-50 group-hover:opacity-100 transition-opacity {isPinned ? 'text-red-400' : 'text-zinc-500'}">
                {new Date(incident.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
            </span>
            {#if (incident as any).domain}
                <span class="text-[8px] uppercase font-black tracking-[0.1em] px-1.5 py-0.5 rounded-sm border 
                    {isPinned ? 'bg-red-950 text-red-500 border-red-900/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}">
                    {(incident as any).domain}
                </span>
            {/if}
        </div>
        
        <h4 class="text-[11px] font-bold leading-snug mb-2.5 group-hover:text-white transition-colors line-clamp-2
            {isPinned ? 'text-red-50' : 'text-zinc-200'}"
        >
            {incident.title}
        </h4>

        <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5">
                <div class="w-1 h-1 rounded-full {incident.severity <= 2 ? 'bg-red-500 shadow-[0_0_4px_#ef4444]' : 'bg-zinc-600'}"></div>
                <span class="font-mono text-[9px] font-bold {isPinned ? 'text-red-400' : 'text-zinc-500'}">S{incident.severity}</span>
            </div>
            {#if (incident as any).source_hash}
                <span class="font-mono text-[8px] text-zinc-700 tracking-tighter truncate max-w-[100px]">
                    {(incident as any).source_hash.substring(0,12)}
                </span>
            {/if}
        </div>
    </button>
{/snippet}
