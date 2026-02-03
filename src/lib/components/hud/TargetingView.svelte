<script lang="ts">
    import { Target, Search, Plus, Loader2, Trash2, Pause, Play, Hash, Edit3, X, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-svelte';
    import { scopeStore } from '$lib/scopes.svelte';
    import { incidentStore } from '$lib/incidents.svelte';

    let newScopeGoal = $state('');
    let isCreating = $state(false);
    let editingScopeId = $state<string | null>(null);
    let editKeywords = $state<string[]>([]);
    let editGoal = $state('');
    let newKeyword = $state('');
    let expandedScopes = $state<Set<string>>(new Set());
    let isRegenerating = $state<string | null>(null);

    async function createScope() {
        if (!newScopeGoal.trim() || isCreating) return;
        isCreating = true;
        const success = await scopeStore.create(newScopeGoal);
        if (success) {
            newScopeGoal = '';
        }
        isCreating = false;
    }

    function startEditing(scope: any) {
        editingScopeId = scope.id;
        editKeywords = [...(scope.keywords || [])];
        editGoal = scope.goal;
        newKeyword = '';
    }

    function cancelEditing() {
        editingScopeId = null;
        editKeywords = [];
        editGoal = '';
        newKeyword = '';
    }

    async function saveScope(scopeId: string) {
        const success = await scopeStore.update(scopeId, {
            keywords: editKeywords,
            goal: editGoal
        });
        if (success) {
            editingScopeId = null;
        }
    }

    function addKeyword() {
        if (newKeyword.trim() && !editKeywords.includes(newKeyword.trim().toLowerCase())) {
            editKeywords = [...editKeywords, newKeyword.trim().toLowerCase()];
            newKeyword = '';
        }
    }

    function removeKeyword(keyword: string) {
        editKeywords = editKeywords.filter(k => k !== keyword);
    }

    async function regenerateStrategy(scope: any) {
        isRegenerating = scope.id;
        const success = await scopeStore.regenerate(scope.id, scope.goal);
        isRegenerating = null;
    }

    function toggleExpand(scopeId: string) {
        const newSet = new Set(expandedScopes);
        if (newSet.has(scopeId)) {
            newSet.delete(scopeId);
        } else {
            newSet.add(scopeId);
        }
        expandedScopes = newSet;
    }

    function getScopeIncidents(scopeId: string) {
        return incidentStore.all.filter(i => 
            i.tags?.includes(`mission:${scopeId}`)
        ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);
    }

    function formatTime(dateStr: string): string {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false
        });
    }
</script>

<div class="h-full flex flex-col bg-brand-dark overflow-hidden">
    <!-- Header -->
    <header class="p-5 border-b border-brand-border bg-zinc-950/80 shrink-0 backdrop-blur space-y-4">
        <div class="flex justify-between items-center">
            <h2 class="text-base font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Target class="text-brand-accent" size={16} /> Operational Scopes
            </h2>
            <div class="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-sm">
                <p class="text-[9px] font-mono text-brand-accent uppercase tracking-widest">{scopeStore.all.length} ACTIVE</p>
            </div>
        </div>
        
        <!-- Create New Scope Input -->
        <div class="flex gap-2 h-9">
            <div class="relative flex-1 h-full">
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                    <Search size={14} />
                </div>
                <input 
                    bind:value={newScopeGoal}
                    onkeydown={(e) => e.key === 'Enter' && createScope()}
                    placeholder="DEFINE NEW OBJECTIVE..." 
                    class="w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-sm pl-9 pr-3 text-[11px] font-mono text-zinc-200 outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all placeholder:text-zinc-700 uppercase"
                />
            </div>
            <button 
                onclick={createScope} 
                disabled={!newScopeGoal.trim() || isCreating}
                class="h-full w-28 border text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-2
                    {newScopeGoal.trim().length > 0 
                        ? 'bg-brand-accent text-black border-brand-accent hover:bg-white hover:border-white shadow-lg shadow-brand-accent/20' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed'}"
            >
                {#if isCreating}
                    <Loader2 size={12} class="animate-spin" />
                {:else}
                    <Plus size={12} strokeWidth={2.5} />
                {/if}
                <span>DEPLOY</span>
            </button>
        </div>
    </header>

    <!-- Scope Cards -->
    <main class="flex-1 overflow-y-auto custom-scrollbar bg-brand-dark p-4 space-y-3">
        {#if scopeStore.isLoading}
            <div class="flex flex-col items-center justify-center h-full text-zinc-700 opacity-50 space-y-3">
                <Loader2 size={32} class="animate-spin" />
                <p class="text-label font-bold uppercase tracking-widest">Loading Scopes</p>
            </div>
        {:else if scopeStore.all.length === 0}
            <div class="flex flex-col items-center justify-center h-full text-zinc-700 opacity-50 space-y-3">
                <Target size={32} strokeWidth={1.5} />
                <p class="text-label font-bold uppercase tracking-widest">No Active Scopes</p>
                <p class="text-[11px] text-zinc-600 text-center max-w-xs">Define an objective above to start collecting intelligence</p>
            </div>
        {:else}
            {#each scopeStore.all as scope (scope.id)}
                {@const isEditing = editingScopeId === scope.id}
                {@const scopeIncidents = getScopeIncidents(scope.id)}
                {@const totalIncidents = incidentStore.all.filter(i => i.tags?.includes(`mission:${scope.id}`)).length}
                {@const isExpanded = expandedScopes.has(scope.id)}
                
                <div class="bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden">
                    <!-- Card Header -->
                    <div class="p-4 border-b border-zinc-800/50">
                        <div class="flex justify-between items-start gap-3">
                            <div class="flex-1 min-w-0">
                                {#if isEditing}
                                    <!-- Editing Mode: Keywords -->
                                    <div class="space-y-3">
                                        <div class="flex flex-wrap gap-1.5">
                                            {#each editKeywords as keyword}
                                                <span class="inline-flex items-center gap-1 px-2 py-1 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-[10px] font-mono uppercase rounded-sm">
                                                    {keyword}
                                                    <button onclick={() => removeKeyword(keyword)} class="hover:text-white">
                                                        <X size={10} />
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div class="flex gap-2">
                                            <input
                                                bind:value={newKeyword}
                                                onkeydown={(e) => e.key === 'Enter' && addKeyword()}
                                                placeholder="Add keyword..."
                                                class="flex-1 bg-zinc-900 border border-zinc-700 rounded-sm px-2 py-1 text-[11px] text-zinc-200 outline-none focus:border-zinc-500"
                                            />
                                            <button
                                                onclick={addKeyword}
                                                disabled={!newKeyword.trim()}
                                                class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-sm text-[10px] disabled:opacity-50"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                {:else}
                                    <!-- View Mode: Keywords -->
                                    <div class="flex flex-wrap gap-1.5">
                                        {#each (scope.keywords || []).slice(0, 6) as keyword}
                                            <span class="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-400 text-[10px] font-mono uppercase rounded-sm">
                                                {keyword}
                                            </span>
                                        {/each}
                                        {#if (scope.keywords || []).length > 6}
                                            <span class="px-2 py-1 text-zinc-600 text-[10px]">+{(scope.keywords || []).length - 6}</span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>

                            <!-- Status & Controls -->
                            <div class="flex items-center gap-2 shrink-0">
                                <div class="w-2 h-2 rounded-full {scope.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}"></div>
                                
                                {#if isEditing}
                                    <button onclick={() => saveScope(scope.id)} class="p-1.5 rounded-sm bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-colors" title="Save">
                                        <Check size={14} />
                                    </button>
                                    <button onclick={cancelEditing} class="p-1.5 rounded-sm bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors" title="Cancel">
                                        <X size={14} />
                                    </button>
                                {:else}
                                    <button onclick={() => scopeStore.toggle(scope)} class="p-1.5 rounded-sm hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title={scope.status === 'active' ? 'Pause' : 'Resume'}>
                                        {#if scope.status === 'active'}
                                            <Pause size={14} />
                                        {:else}
                                            <Play size={14} />
                                        {/if}
                                    </button>
                                    <button onclick={() => startEditing(scope)} class="p-1.5 rounded-sm hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Edit">
                                        <Edit3 size={14} />
                                    </button>
                                    <button onclick={() => scopeStore.delete(scope.id)} class="p-1.5 rounded-sm hover:bg-red-900/20 text-zinc-500 hover:text-red-500 transition-colors" title="Delete">
                                        <Trash2 size={14} />
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <!-- Card Body: Goal & Stats -->
                    <div class="p-4 bg-zinc-950/50">
                        {#if isEditing}
                            <textarea
                                bind:value={editGoal}
                                rows="2"
                                class="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-3 py-2 text-[11px] text-zinc-300 outline-none focus:border-zinc-500 resize-none"
                                placeholder="Objective description..."
                            ></textarea>
                        {:else}
                            <p class="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 italic mb-3">
                                "{scope.goal}"
                            </p>
                        {/if}

                        <!-- Stats Row -->
                        <div class="flex items-center justify-between text-[10px]">
                            <div class="flex items-center gap-3 text-zinc-500">
                                <span class="flex items-center gap-1">
                                    <Hash size={10} class="text-brand-accent" />
                                    {totalIncidents} signals
                                </span>
                                {#if scopeIncidents.length > 0}
                                    <span>•</span>
                                    <span>Last: {formatTime(scopeIncidents[0].created_at)}</span>
                                {/if}
                            </div>
                            
                            <div class="flex items-center gap-2">
                                {#if !isEditing}
                                    <button
                                        onclick={() => regenerateStrategy(scope)}
                                        disabled={isRegenerating === scope.id}
                                        class="flex items-center gap-1 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-zinc-500 hover:text-brand-accent transition-colors disabled:opacity-50"
                                    >
                                        {#if isRegenerating === scope.id}
                                            <Loader2 size={10} class="animate-spin" />
                                        {:else}
                                            <RefreshCw size={10} />
                                        {/if}
                                        Regenerate
                                    </button>
                                {/if}
                                
                                {#if scopeIncidents.length > 0}
                                    <button
                                        onclick={() => toggleExpand(scope.id)}
                                        class="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {#if isExpanded}
                                            <ChevronUp size={12} />
                                        {:else}
                                            <ChevronDown size={12} />
                                        {/if}
                                        <span class="text-[9px] uppercase tracking-wider">Preview</span>
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <!-- Card Footer: Recent Incidents Preview -->
                    {#if isExpanded && scopeIncidents.length > 0}
                        <div class="border-t border-zinc-800/50 bg-zinc-950/30">
                            {#each scopeIncidents as incident (incident.id)}
                                <button
                                    class="w-full text-left px-4 py-3 border-b border-zinc-800/30 hover:bg-white/5 transition-colors"
                                    onclick={() => incidentStore.select(incident.id)}
                                >
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="font-mono text-[10px] font-bold {incident.severity <= 2 ? 'text-red-400' : 'text-zinc-500'}">
                                            P{incident.severity}
                                        </span>
                                        <span class="text-[9px] text-zinc-600">
                                            {formatTime(incident.created_at)}
                                        </span>
                                    </div>
                                    <p class="text-[11px] text-zinc-300 line-clamp-1">
                                        {incident.title}
                                    </p>
                                </button>
                            {/each}
                            {#if totalIncidents > 3}
                                <div class="px-4 py-2 text-[9px] text-zinc-600 text-center">
                                    +{totalIncidents - 3} more signals
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </main>
</div>
