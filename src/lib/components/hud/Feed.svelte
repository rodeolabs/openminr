<script lang="ts">
    import { incidentStore } from '$lib/incidents.svelte';
    import { scopeStore } from '$lib/scopes.svelte';
    import { Radio, Activity, ChevronDown, ChevronRight, Hash, X } from 'lucide-svelte';
    import type { Incident } from '$lib/types';

    let selectedScopeId = $state<string | null>(null);
    let expandedScopes = $state<Set<string>>(new Set());

    function selectScope(id: string | null) {
        selectedScopeId = id;
        incidentStore.setMissionId(id);
    }

    function toggleScopeExpand(scopeId: string) {
        const newSet = new Set(expandedScopes);
        if (newSet.has(scopeId)) {
            newSet.delete(scopeId);
        } else {
            newSet.add(scopeId);
        }
        expandedScopes = newSet;
    }

    // Helper: Get valid scope IDs from the scope store
    function getValidScopeIds(): string[] {
        return scopeStore.all.map(s => `mission:${s.id}`);
    }

    // Check if incident should be shown in Feed (not resolved/dismissed)
    function isActiveIncident(incident: Incident): boolean {
        return !['resolved', 'dismissed'].includes(incident.status);
    }

    // Check if incident belongs to a valid (non-deleted) scope
    function hasValidScope(incident: Incident): boolean {
        const validScopeIds = getValidScopeIds();
        const missionTags = incident.tags?.filter(tag => tag.startsWith('mission:')) || [];
        // If no mission tags, it's valid (unscoped)
        if (missionTags.length === 0) return true;
        // Check if any mission tag is still valid
        return missionTags.some(tag => validScopeIds.includes(tag));
    }

    // Get incidents grouped by scope - sorted by priority, then time
    // Only includes active incidents that belong to valid scopes
    function getScopeIncidents(scopeId: string): Incident[] {
        return incidentStore.all.filter(i => 
            i.tags?.includes(`mission:${scopeId}`) && 
            isActiveIncident(i) && 
            hasValidScope(i)
        ).sort((a, b) => {
            const priorityDiff = a.severity - b.severity;
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }

    // Get unscoped incidents (not tagged with any mission) - sorted by priority, then time
    // Only includes active incidents
    function getUnscopedIncidents(): Incident[] {
        return incidentStore.all.filter(i => {
            // Must be active (not resolved/dismissed)
            if (!isActiveIncident(i)) return false;
            // Check if incident has any mission tags
            const missionTags = i.tags?.filter(tag => tag.startsWith('mission:')) || [];
            // If no mission tags, it's unscoped
            if (missionTags.length === 0) return true;
            // If has mission tags but none are valid (all scopes deleted), it's orphaned - don't show in Feed
            return !hasValidScope(i);
        }).sort((a, b) => {
            const priorityDiff = a.severity - b.severity;
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }

    // Incidents for the "All" view - only active incidents with valid scopes
    let allIncidents = $derived([...incidentStore.all]
        .filter(i => isActiveIncident(i) && hasValidScope(i))
        .sort((a, b) => {
            const priorityDiff = a.severity - b.severity;
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }));

    // Filtered incidents based on selection
    let displayedIncidents = $derived(
        selectedScopeId === null 
            ? allIncidents 
            : getScopeIncidents(selectedScopeId)
    );

    function getPriorityLabel(severity: number): string {
        if (severity === 1) return 'P1';
        if (severity === 2) return 'P2';
        if (severity === 3) return 'P3';
        return 'P4';
    }

    function getPriorityClass(severity: number): string {
        if (severity === 1) return 'priority-1';
        if (severity === 2) return 'priority-2';
        if (severity === 3) return 'priority-3';
        return 'priority-4';
    }

    function formatTime(dateStr: string): string {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false
        });
    }
</script>

<div class="hud-panel w-full border-r-0 bg-brand-dark flex flex-col h-full text-white">
    
    <!-- 1. Signal Stream Header -->
    <div class="flex border-b border-brand-border bg-zinc-950 shrink-0">
        <div class="flex-1 p-4 text-label tracking-[0.2em] border-b border-zinc-800 text-white bg-white/5 flex items-center justify-center gap-2">
            <Radio size={14} class="text-brand-accent" />
            Signal Stream
        </div>
    </div>

    <!-- 2. Active Filter Indicator -->
    {#if selectedScopeId !== null}
        {@const selectedScope = scopeStore.all.find(s => s.id === selectedScopeId)}
        {#if selectedScope}
            <div class="px-4 py-2 bg-brand-accent/5 border-b border-brand-accent/20 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-2 text-[11px]">
                    <span class="text-zinc-500">Filtered by:</span>
                    <span class="text-brand-accent font-mono">{selectedScope.keywords?.[0] || 'Unknown'}</span>
                    {#if selectedScope.keywords && selectedScope.keywords.length > 1}
                        <span class="text-zinc-600">+{selectedScope.keywords.length - 1} more</span>
                    {/if}
                </div>
                <button 
                    onclick={() => selectScope(null)}
                    class="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors"
                    title="Clear filter"
                >
                    <X size={12} />
                </button>
            </div>
        {/if}
    {/if}

    <!-- 4. Scrollable Content -->
    <div class="flex-1 overflow-y-auto custom-scrollbar bg-brand-dark">
        
        {#if scopeStore.isLoading}
            <div class="flex flex-col items-center justify-center h-64 text-zinc-700 space-y-4 opacity-50">
                <Activity size={24} class="animate-pulse" />
                <span class="text-label text-zinc-600">Loading scopes...</span>
            </div>
        {:else if displayedIncidents.length === 0}
            <div class="flex flex-col items-center justify-center h-64 text-zinc-700 space-y-4 opacity-50 px-8 text-center">
                <div class="w-14 h-14 border border-zinc-800 rounded-sm flex items-center justify-center relative overflow-hidden">
                    <div class="absolute inset-0 bg-brand-accent/5 animate-pulse"></div>
                    <Radio size={24} class="text-zinc-800" />
                </div>
                <div>
                    <span class="text-body-sm font-black uppercase tracking-[0.3em] block mb-2 text-zinc-500">
                        {selectedScopeId === null ? 'No Signals' : 'No Matching Signals'}
                    </span>
                    <p class="text-label text-zinc-600 leading-relaxed max-w-[200px]">
                        {#if selectedScopeId === null}
                            Awaiting real-time tactical intelligence.
                        {:else}
                            No incidents match this operational scope yet.
                        {/if}
                    </p>
                </div>
            </div>
        {:else}
            <!-- All View: Show incidents grouped by scope -->
            {#if selectedScopeId === null && scopeStore.all.length > 0}
                {#each scopeStore.all as scope}
                    {@const scopeIncidents = getScopeIncidents(scope.id)}
                    {#if scopeIncidents.length > 0}
                        <!-- Scope Section Header -->
                        <div class="border-b border-zinc-800/50">
                            <div class="w-full px-4 py-3 flex items-center justify-between bg-zinc-950/30 hover:bg-zinc-950/50 transition-colors">
                                <button
                                    class="flex items-center gap-3 flex-1 text-left group"
                                    onclick={() => selectScope(scope.id)}
                                >
                                    {#if expandedScopes.has(scope.id)}
                                        <ChevronDown size={14} class="text-zinc-500 group-hover:text-zinc-400" />
                                    {:else}
                                        <ChevronRight size={14} class="text-zinc-500 group-hover:text-zinc-400" />
                                    {/if}
                                    <div class="flex items-center gap-2">
                                        <div class="w-1.5 h-1.5 rounded-full {scope.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-600'}"></div>
                                        <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-300 group-hover:text-white transition-colors">
                                            {#if scope.keywords && scope.keywords.length > 0}
                                                {scope.keywords.slice(0, 2).join(', ')}
                                                {#if scope.keywords.length > 2}
                                                    <span class="text-zinc-600">+{scope.keywords.length - 2}</span>
                                                {/if}
                                            {:else}
                                                Scope {scope.id.slice(0, 6)}
                                            {/if}
                                        </span>
                                    </div>
                                </button>
                            </div>
                            
                            <!-- Scope Incidents (Collapsible) -->
                            {#if expandedScopes.has(scope.id)}
                                <div class="border-t border-zinc-800/50">
                                    {#each scopeIncidents as incident (incident.id)}
                                        {@render IncidentRow({ incident })}
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/each}

                <!-- Unscoped Incidents Section -->
                {@const unscoped = getUnscopedIncidents()}
                {#if unscoped.length > 0}
                    <div class="border-b border-zinc-800/50">
                        <button
                            class="w-full px-4 py-3 flex items-center gap-3 bg-zinc-950/30 hover:bg-zinc-950/50 transition-colors"
                            onclick={() => selectScope(null)}
                        >
                            {#if expandedScopes.has('unscoped')}
                                <ChevronDown size={14} class="text-zinc-500" />
                            {:else}
                                <ChevronRight size={14} class="text-zinc-500" />
                            {/if}
                            <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">
                                General Intelligence
                            </span>
                        </button>
                        
                        {#if expandedScopes.has('unscoped')}
                            <div class="border-t border-zinc-800/50">
                                {#each unscoped as incident (incident.id)}
                                    {@render IncidentRow({ incident })}
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            {:else}
                <!-- Filtered View: Just show incidents -->
                {#each displayedIncidents as incident (incident.id)}
                    {@render IncidentRow({ incident })}
                {/each}
            {/if}
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
                    {formatTime(incident.created_at)}
                </span>
            </div>
            {#if incident.domain}
                <span class="text-label-sm px-1.5 py-0.5 rounded-sm border 
                    {isPriority ? 'bg-red-950 text-red-500 border-red-900/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}">
                    {incident.domain}
                </span>
            {/if}
        </div>
        
        <h4 class="text-body-sm font-bold leading-snug group-hover:text-white transition-colors line-clamp-2
            {isPriority ? 'text-red-50' : 'text-zinc-200'}"
        >
            {incident.title}
        </h4>
        
        {#if incident.tactical_summary}
            <p class="mt-2 text-[10px] text-zinc-500 line-clamp-1">
                {incident.tactical_summary}
            </p>
        {/if}
    </button>
{/snippet}

<style>
    .priority-1 { border-left-color: #ef4444; }
    .priority-2 { border-left-color: #f97316; }
    .priority-3 { border-left-color: #eab308; }
    .priority-4 { border-left-color: #3b82f6; }
</style>
