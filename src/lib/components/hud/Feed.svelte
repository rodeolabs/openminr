<script lang="ts">
    import { incidentStore } from '$lib/incidents.svelte';
    import { Radio, Target, Hash, Activity } from 'lucide-svelte';
    import { supabase } from '$lib/supabase/client';
    import type { Incident, Mission } from '$lib/types';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let scopes = $state<Mission[]>([]);
    let isLoadingScopes = $state(false);
    let selectedScopeId = $state<string | null>(null);

    async function loadScopes() {
        if (!browser) return;
        isLoadingScopes = true;
        try {
            const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
            if (data) scopes = data;
        } finally {
            isLoadingScopes = false;
        }
    }

    function selectScope(id: string | null) {
        selectedScopeId = id;
        incidentStore.setMissionId(id);
    }

    onMount(() => {
        if (browser) {
            loadScopes();
        }
    });

    // Incidents sorted by priority (P1 first) then time
    let sortedIncidents = $derived([...incidentStore.filtered].sort((a, b) => {
        const priorityDiff = a.severity - b.severity;
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }));

    // Get priority label
    function getPriorityLabel(severity: number): string {
        if (severity === 1) return 'P1';
        if (severity === 2) return 'P2';
        if (severity === 3) return 'P3';
        if (severity === 4) return 'P4';
        return 'P4';
    }

    // Get priority color class
    function getPriorityClass(severity: number): string {
        if (severity === 1) return 'priority-1';
        if (severity === 2) return 'priority-2';
        if (severity === 3) return 'priority-3';
        if (severity === 4) return 'priority-4';
        return 'priority-4';
    }
</script>

<div class="hud-panel w-full border-r-0 bg-brand-dark flex flex-col h-full text-white">
    
    <!-- 1. Operational Scope Selection -->
    <div class="p-4 border-b border-brand-border bg-zinc-950/80 shrink-0">
        <div class="flex justify-between items-center mb-4">
            <label class="text-label text-brand-muted flex items-center gap-2">
                <Target size={12} /> Operational Scope
            </label>
        </div>
        
        <div class="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {#if isLoadingScopes}
                <div class="px-3 py-4 border border-zinc-800/50 border-dashed rounded-sm text-center">
                    <Activity size={14} class="animate-pulse mx-auto text-zinc-600 mb-2" />
                    <span class="text-label text-zinc-600">Loading Scopes...</span>
                </div>
            {:else if scopes.length === 0}
                <div class="px-3 py-4 border border-zinc-800/50 border-dashed rounded-sm text-center">
                    <span class="text-label text-zinc-600">No Active Scopes</span>
                </div>
            {:else}
                {#each scopes as s}
                    <button
                        class="w-full text-left px-3 py-2.5 text-[11px] font-bold uppercase border rounded-sm transition-all btn-hover
                            {selectedScopeId === s.id 
                                ? 'bg-brand-accent/10 border-brand-accent text-brand-accent glow-accent' 
                                : 'border-zinc-800/50 text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}
                        "
                        onclick={() => selectScope(selectedScopeId === s.id ? null : s.id)}
                    >
                        <div class="flex justify-between items-center">
                            <span class="truncate pr-2 tracking-widest">{s.name}</span>
                            <div class="flex items-center gap-2 shrink-0">
                                <span class="text-label-sm font-mono opacity-50">
                                    {incidentStore.all.filter(i => (i as any).tags?.includes(`mission:${s.id}`)).length}
                                </span>
                                <div class="w-1.5 h-1.5 rounded-full {s.status === 'active' ? 'bg-emerald-500 glow-emerald' : 'bg-zinc-700'}"></div>
                            </div>
                        </div>
                    </button>
                {/each}
            {/if}
        </div>
    </div>

    <!-- 2. Signal Stream Header -->
    <div class="flex border-b border-brand-border bg-zinc-950 shrink-0">
        <div class="flex-1 py-3 text-label tracking-[0.2em] border-b-[3px] border-brand-accent text-white bg-white/5 flex items-center justify-center gap-2">
            <Radio size={12} class="text-brand-accent animate-pulse" />
            Signal Stream
        </div>
    </div>

    <!-- 3. Scrollable Content -->
    <div class="flex-1 overflow-y-auto custom-scrollbar bg-brand-dark space-y-px">
        
        {#if sortedIncidents.length === 0}
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
        {:else}
            {#each sortedIncidents as incident (incident.id)}
                {@render IncidentRow({ incident })}
            {/each}
        {/if}
    </div>
</div>

{#snippet IncidentRow({ incident }: { incident: Incident })}
    {@const isPriority = incident.severity <= 2}
    <button
        id="incident-{incident.id}"
        class="w-full text-left p-4 transition-all duration-150 hover:bg-white/5 group border-b border-zinc-900/30 card-hover
            {incidentStore.selectedId === incident.id ? 'bg-zinc-900/50 border-l-[4px]' : 'border-l-[3px]'}
            {getPriorityClass(incident.severity)}
            {isPriority ? 'bg-red-500/[0.02]' : ''}
        "
        onclick={() => incidentStore.select(incident.id)}
    >
        <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
                <span class="font-mono text-label font-bold {isPriority ? 'text-red-400' : 'text-zinc-500'}">
                    {getPriorityLabel(incident.severity)}
                </span>
                <span class="font-mono text-label-sm text-zinc-600">
                    {new Date(incident.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                </span>
            </div>
            {#if (incident as any).domain}
                <span class="text-label-sm px-1.5 py-0.5 rounded-sm border 
                    {isPriority ? 'bg-red-950 text-red-500 border-red-900/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}">
                    {(incident as any).domain}
                </span>
            {/if}
        </div>
        
        <h4 class="text-body-sm font-bold leading-snug mb-2 group-hover:text-white transition-colors line-clamp-2
            {isPriority ? 'text-red-50' : 'text-zinc-200'}"
        >
            {incident.title}
        </h4>

        {#if (incident as any).source_hash}
            <div class="flex items-center gap-1.5">
                <Hash size={8} class="text-zinc-700" />
                <span class="font-mono text-[9px] text-zinc-700 tracking-tighter truncate max-w-[140px]">
                    {(incident as any).source_hash.substring(0,16)}
                </span>
            </div>
        {/if}
    </button>
{/snippet}

<style>
    .priority-1 { border-left-color: #ef4444; }
    .priority-2 { border-left-color: #f97316; }
    .priority-3 { border-left-color: #eab308; }
    .priority-4 { border-left-color: #3b82f6; }
</style>
