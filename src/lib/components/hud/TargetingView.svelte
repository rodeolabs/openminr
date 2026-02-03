<script lang="ts">
    import { Target, Search, Plus, Loader2, Trash2, Pause, Play, Hash } from 'lucide-svelte';
    import { scopeStore } from '$lib/scopes.svelte';
    import { incidentStore } from '$lib/incidents.svelte';

    let newScopeGoal = $state('');
    let isCreating = $state(false);

    async function createScope() {
        if (!newScopeGoal.trim() || isCreating) return;
        isCreating = true;
        const success = await scopeStore.create(newScopeGoal);
        if (success) {
            newScopeGoal = '';
        }
        isCreating = false;
    }
</script>

<div class="h-full flex flex-col bg-brand-dark overflow-hidden border-l border-brand-border">
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
        
        <!-- Standardized Input -->
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

    <main class="flex-1 overflow-y-auto custom-scrollbar bg-brand-dark">
        {#if scopeStore.all.length === 0}
            <div class="flex flex-col items-center justify-center h-full text-zinc-700 opacity-50 space-y-3">
                <Target size={32} strokeWidth={1.5} />
                <p class="text-label font-bold uppercase tracking-widest">No Active Scopes</p>
            </div>
        {:else}
            <div class="flex flex-col">
                {#each scopeStore.all as scope (scope.id)}
                    <div class="group p-4 hover:bg-white/[0.02] border-b border-zinc-900/30 transition-colors flex gap-4 w-full text-left relative">
                        <!-- Hover Marker -->
                        <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <!-- Status Indicator (Fixed Width Left) -->
                        <div class="w-8 shrink-0 flex flex-col items-center pt-1.5">
                            {#if scope.status === 'active'}
                                <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            {:else}
                                <div class="w-2 h-2 rounded-full bg-zinc-700 border border-zinc-600"></div>
                            {/if}
                        </div>

                        <!-- Content (Middle) -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <h3 class="text-body-sm font-bold text-zinc-200 uppercase tracking-tight truncate">{scope.name}</h3>
                                <span class="text-label-sm font-mono text-zinc-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Hash size={10} /> {scope.id.slice(0,8)}
                                </span>
                            </div>
                            
                            <p class="text-label text-zinc-400 leading-relaxed line-clamp-2 italic mb-2">
                                "{scope.goal}"
                            </p>

                            <!-- Keywords & Count -->
                            <div class="flex items-center gap-2 flex-wrap">
                                <div class="flex items-center gap-1.5 pr-2 mr-2 border-r border-zinc-800">
                                    <span class="text-[9px] font-mono text-zinc-400 flex items-center gap-1.5" title="Detected Signals">
                                        <Hash size={10} class="text-brand-accent" />
                                        {incidentStore.all.filter(i => (i as any).tags?.includes(`mission:${scope.id}`)).length}
                                    </span>
                                </div>
                                {#each (scope.keywords || []).slice(0, 4) as kw}
                                    <span class="text-[9px] font-mono text-zinc-500 bg-zinc-900/50 border border-zinc-800 px-1.5 py-0.5 rounded-sm uppercase">
                                        {kw}
                                    </span>
                                {/each}
                            </div>
                        </div>

                        <!-- Controls (Right) -->
                        <div class="shrink-0 flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onclick={() => scopeStore.toggle(scope)}
                                class="p-1.5 rounded-sm hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                title={scope.status === 'active' ? 'Pause Collection' : 'Resume Collection'}
                            >
                                {#if scope.status === 'active'}
                                    <Pause size={14} />
                                {:else}
                                    <Play size={14} />
                                {/if}
                            </button>
                            
                            <button 
                                onclick={() => scopeStore.delete(scope.id)}
                                class="p-1.5 rounded-sm hover:bg-red-900/20 text-zinc-500 hover:text-red-500 transition-colors"
                                title="Remove Scope"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </main>
</div>
