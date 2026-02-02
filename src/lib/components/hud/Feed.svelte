<script lang="ts">
    import { incidentStore } from '$lib/incidents.svelte';
    import { AlertTriangle, Radio, Target, Zap, Loader2 } from 'lucide-svelte';
    import { supabase } from '$lib/supabase/client';
    import type { Incident, Mission } from '$lib/types';
    import { onMount } from 'svelte';
    import { system } from '$lib/system.svelte';
    import { browser } from '$app/environment';

    let missions = $state<Mission[]>([]);
    let isLoadingMissions = $state(false);
    let selectedMissionId = $state<string | null>(null);
    let activeTab = $state<'live' | 'priority'>('live');

    async function loadMissions() {
        if (!browser) return;
        isLoadingMissions = true;
        try {
            const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
            if (data) missions = data;
        } finally {
            isLoadingMissions = false;
        }
    }

    function selectMission(id: string | null) {
        selectedMissionId = id;
        incidentStore.setMissionId(id);
    }

    onMount(() => {
        if (browser) {
            loadMissions();
        }
    });

    // Grouping Logic
    let priorityIncidents = $derived(incidentStore.filtered.filter(i => i.severity <= 2));
    let standardIncidents = $derived(incidentStore.filtered.filter(i => i.severity > 2));

    // Get severity class for border styling
    function getSeverityClass(severity: number): string {
        if (severity === 1) return 'severity-1';
        if (severity === 2) return 'severity-2';
        if (severity === 3) return 'severity-3';
        if (severity === 4) return 'severity-4';
        return 'severity-5';
    }

    // Get severity color for badges
    function getSeverityBadgeClass(severity: number): string {
        if (severity === 1) return 'severity-badge-1';
        if (severity === 2) return 'severity-badge-2';
        if (severity === 3) return 'severity-badge-3';
        if (severity === 4) return 'severity-badge-4';
        return 'severity-badge-5';
    }
</script>

<div class="hud-panel w-full border-r-0 bg-brand-dark flex flex-col h-full text-white">
    
    <!-- 1. Operational Scope (Targeting Vectors) -->
    <div class="p-4 border-b border-brand-border bg-zinc-950/80 shrink-0">
        <div class="flex justify-between items-center mb-4">
            <label class="text-label text-brand-muted flex items-center gap-2">
                <Target size={12} /> Operational Scope
            </label>
            <div class="flex items-center gap-3">
                 {#if selectedMissionId}
                    <button 
                        onclick={() => selectMission(null)}
                        class="text-label text-zinc-500 hover:text-white transition-colors flex items-center gap-1 btn-hover"
                        title="Clear Scope"
                    >
                        <span>Clear</span>
                    </button>
                    <div class="w-px h-2 bg-zinc-800"></div>
                {/if}
                <button 
                    onclick={() => system.triggerSync(true)}
                    class="text-label text-zinc-500 hover:text-brand-accent flex items-center gap-1.5 transition-colors btn-hover"
                    disabled={system.isSyncing}
                >
                    {#if system.isSyncing}
                        <Loader2 size={10} class="animate-spin text-brand-accent" />
                    {:else}
                        <Zap size={10} />
                    {/if}
                    Scan
                </button>
            </div>
        </div>
        
        <div class="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {#if isLoadingMissions}
                <div class="px-3 py-4 border border-zinc-800/50 border-dashed rounded-sm text-center">
                    <Loader2 size={14} class="animate-spin mx-auto text-zinc-600 mb-2" />
                    <span class="text-label text-zinc-600">Loading Missions...</span>
                </div>
            {:else if missions.length === 0}
                <div class="px-3 py-4 border border-zinc-800/50 border-dashed rounded-sm text-center">
                    <span class="text-label text-zinc-600">No Active Missions</span>
                </div>
            {:else}
                {#each missions as m}
                    <button
                        class="w-full text-left px-3 py-2 text-[11px] font-bold uppercase border rounded-sm transition-all btn-hover
                            {selectedMissionId === m.id 
                                ? 'bg-brand-accent/10 border-brand-accent text-brand-accent glow-accent' 
                                : 'border-zinc-800/50 text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}
                        "
                        onclick={() => selectMission(selectedMissionId === m.id ? null : m.id)}
                    >
                        <div class="flex justify-between items-center">
                            <span class="truncate pr-2 tracking-widest">{m.name}</span>
                            <div class="flex items-center gap-2 shrink-0">
                                <span class="text-label-sm font-mono opacity-50">
                                    {incidentStore.all.filter(i => (i as any).tags?.includes(`mission:${m.id}`)).length}
                                </span>
                                <div class="w-1.5 h-1.5 rounded-full {m.status === 'active' ? 'bg-emerald-500 glow-emerald' : 'bg-zinc-700'}"></div>
                            </div>
                        </div>
                    </button>
                {/each}
            {/if}
        </div>
    </div>

    <!-- 2. Feed Categorization Tabs -->
    <div class="flex border-b border-brand-border bg-zinc-950 shrink-0">
        <button 
            onclick={() => activeTab = 'live'}
            class="flex-1 py-3 text-label tracking-[0.2em] border-b-[3px] transition-all flex items-center justify-center gap-2 btn-hover
            {activeTab === 'live' ? 'border-brand-accent text-white bg-white/5' : 'border-transparent text-zinc-600 hover:text-zinc-400'}"
        >
            <Radio size={12} class={activeTab === 'live' ? 'text-brand-accent animate-pulse' : ''} />
            Live
        </button>
        <button 
            onclick={() => activeTab = 'priority'}
            class="flex-1 py-3 text-label tracking-[0.2em] border-b-[3px] transition-all flex items-center justify-center gap-2 btn-hover
            {activeTab === 'priority' ? 'border-red-500 text-red-400 bg-red-950/20' : 'border-transparent text-zinc-600 hover:text-zinc-400'}"
        >
            <AlertTriangle size={12} class={activeTab === 'priority' ? 'text-red-400' : ''} />
            Priority
        </button>
    </div>

    <!-- 3. Scrollable Content -->
    <div class="flex-1 overflow-y-auto custom-scrollbar bg-brand-dark space-y-px">
        
        {#if activeTab === 'priority'}
            {#if priorityIncidents.length === 0}
                <div class="p-12 text-center opacity-50">
                    <div class="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto mb-4 flex items-center justify-center">
                        <AlertTriangle size={20} class="text-zinc-700" />
                    </div>
                    <h3 class="text-body-sm font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Clear Skies</h3>
                    <p class="text-label text-zinc-600">No high-severity threats in scope</p>
                </div>
            {:else}
                {#each priorityIncidents as incident (incident.id)}
                    {@render IncidentRow({ incident, isPinned: true })}
                {/each}
            {/if}

        {:else}
            {#if priorityIncidents.length > 0}
                <div class="bg-red-950/5 border-b border-red-900/20">
                    <div class="px-3 py-2 bg-red-950/30 text-label-sm text-red-500 tracking-widest border-b border-red-900/20 flex justify-between">
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
                    <div class="w-14 h-14 border border-zinc-800 rounded-sm flex items-center justify-center relative overflow-hidden">
                        <div class="absolute inset-0 bg-brand-accent/5 animate-pulse"></div>
                        <Radio size={24} class="text-zinc-800" />
                    </div>
                    <div>
                        <span class="text-body-sm font-black uppercase tracking-[0.3em] block mb-2 text-zinc-500">Scanning Signal</span>
                        <p class="text-label text-zinc-600 leading-relaxed max-w-[200px]">
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
        class="w-full text-left p-4 transition-all duration-150 hover:bg-white/5 group border-b border-zinc-900/30 card-hover
            {incidentStore.selectedId === incident.id ? 'bg-zinc-900/50 border-l-[4px]' : 'border-l-[3px]'}
            {getSeverityClass(incident.severity)}
            {isPinned ? 'bg-red-500/[0.03]' : ''}
        "
        onclick={() => incidentStore.select(incident.id)}
    >
        <div class="flex justify-between items-start mb-2">
            <span class="font-mono text-label opacity-50 group-hover:opacity-100 transition-opacity {isPinned ? 'text-red-400' : 'text-zinc-500'}">
                {new Date(incident.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
            </span>
            {#if (incident as any).domain}
                <span class="text-label-sm px-1.5 py-0.5 rounded-sm border 
                    {isPinned ? 'bg-red-950 text-red-500 border-red-900/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}">
                    {(incident as any).domain}
                </span>
            {/if}
        </div>
        
        <h4 class="text-body-sm font-bold leading-snug mb-3 group-hover:text-white transition-colors line-clamp-2
            {isPinned ? 'text-red-50' : 'text-zinc-200'}"
        >
            {incident.title}
        </h4>

        <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full {getSeverityBadgeClass(incident.severity)}"></div>
                <span class="font-mono text-label font-bold {isPinned ? 'text-red-400' : 'text-zinc-500'}">S{incident.severity}</span>
            </div>
            {#if (incident as any).source_hash}
                <span class="font-mono text-label-sm text-zinc-700 tracking-tighter truncate max-w-[100px]">
                    {(incident as any).source_hash.substring(0,12)}
                </span>
            {/if}
        </div>
    </button>
{/snippet}
