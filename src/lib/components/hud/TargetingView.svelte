<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase/client';
    import { Target, Search, Plus, Loader2, Trash2, Activity, Pause, Play, Hash, Crosshair } from 'lucide-svelte';
    import { system } from '$lib/system.svelte';
    import type { Mission } from '$lib/types';

    let scopes = $state<Mission[]>([]);
    let newScopeGoal = $state('');
    let isCreating = $state(false);

    async function loadScopes() {
        const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
        if (data) scopes = data;
    }

    async function createScope() {
        if (!newScopeGoal.trim() || isCreating) return;
        isCreating = true;
        
        try {
            const res = await fetch('/api/missions', {
                method: 'POST',
                body: JSON.stringify({ goal: newScopeGoal })
            });
            const data = await res.json();
            if (data.success) {
                newScopeGoal = '';
                system.notify('Operational Scope Initialized', 'info');
                loadScopes();
            }
        } finally {
            isCreating = false;
        }
    }

    async function toggleScope(scope: Mission) {
        // Optimistic Update
        const newStatus = scope.status === 'active' ? 'paused' : 'active';
        const index = scopes.findIndex(s => s.id === scope.id);
        if (index !== -1) {
            scopes[index] = { ...scopes[index], status: newStatus };
        }

        const { error } = await supabase.from('missions').update({ status: newStatus }).eq('id', scope.id);

        if (error) {
            console.error('Failed to toggle scope:', error);
            // Revert
            if (index !== -1) {
                scopes[index] = { ...scopes[index], status: scope.status };
            }
            system.notify('Failed to update status', 'error');
        }
    }

    async function deleteScope(id: string) {
        if (!confirm('CONFIRM DELETION: Remove operational scope?')) return;
        
        scopes = scopes.filter(s => s.id !== id);
        const { error } = await supabase.from('missions').delete().eq('id', id);
        
        if (error) {
            system.notify('Failed to delete scope', 'error');
            loadScopes();
        }
    }

    onMount(loadScopes);
</script>

<div class="h-full flex flex-col bg-brand-dark overflow-hidden border-l border-brand-border">
    <!-- Header -->
    <header class="p-4 border-b border-brand-border bg-zinc-950/50 shrink-0 backdrop-blur">
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-lg font-black uppercase tracking-[0.2em] text-white mb-1 flex items-center gap-2">
                    <Crosshair class="text-brand-accent" size={16} /> Operational Scopes
                </h2>
                <div class="flex items-center gap-3">
                    <p class="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Intelligence Collection Parameters</p>
                    <div class="h-3 w-px bg-zinc-800"></div>
                    <p class="text-[9px] font-mono text-brand-accent uppercase tracking-widest">{scopes.length} ACTIVE</p>
                </div>
            </div>
        </div>
        
        <!-- Standardized Input -->
        <div class="flex gap-2 mt-4">
            <div class="relative flex-1">
                <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input 
                    bind:value={newScopeGoal}
                    onkeydown={(e) => e.key === 'Enter' && createScope()}
                    placeholder="DEFINE NEW OPERATIONAL OBJECTIVE..." 
                    class="w-full bg-black/50 border border-zinc-800 py-2.5 pl-10 pr-4 text-[10px] font-mono text-white outline-none focus:border-brand-accent/50 transition-all placeholder:text-zinc-700 uppercase"
                />
            </div>
            <button 
                onclick={createScope} 
                disabled={!newScopeGoal.trim() || isCreating}
                class="px-6 bg-brand-accent text-black font-black uppercase tracking-wider text-[9px] hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {#if isCreating} <Loader2 size={12} class="animate-spin" /> {:else} <Plus size={12} strokeWidth={3} /> DEPLOY {/if}
            </button>
        </div>
    </header>

    <main class="flex-1 overflow-y-auto p-4 custom-scrollbar tactical-grid">
        <div class="max-w-4xl mx-auto space-y-px bg-brand-border">
            {#each scopes as scope (scope.id)}
                <div class="bg-brand-dark/40 backdrop-blur-sm p-4 flex gap-4 hover:bg-zinc-900/80 transition-all group border-l-[3px] 
                    {scope.status === 'active' ? 'border-l-emerald-500 bg-emerald-950/5' : 'border-l-zinc-700'}">
                    
                    <!-- Left: Status Icon -->
                    <div class="w-12 shrink-0 flex flex-col items-center justify-center pt-1">
                        {#if scope.status === 'active'}
                            <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center glow-emerald">
                                <Activity size={14} class="text-emerald-500 animate-pulse" />
                            </div>
                        {:else}
                            <div class="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700">
                                <Pause size={14} class="text-zinc-500" />
                            </div>
                        {/if}
                    </div>

                    <!-- Center: Content -->
                    <div class="flex-1 min-w-0 flex flex-col justify-center">
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-xs font-black text-zinc-100 uppercase tracking-wide truncate">{scope.name}</h3>
                            <span class="text-[8px] font-mono text-zinc-600 flex items-center gap-1">
                                <Hash size={8} /> {scope.id.slice(0,8)}
                            </span>
                        </div>
                        <p class="text-[10px] text-zinc-400 font-medium uppercase tracking-wide leading-relaxed line-clamp-1 italic mb-2">
                            "{scope.goal}"
                        </p>
                        <!-- Keywords -->
                        <div class="flex flex-wrap gap-1">
                            {#each (scope.keywords || []).slice(0, 4) as kw}
                                <span class="text-[8px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-sm uppercase">
                                    {kw}
                                </span>
                            {/each}
                            {#if scope.keywords?.length > 4}
                                <span class="text-[8px] font-mono text-zinc-600 px-1 py-0.5">+{scope.keywords.length - 4}</span>
                            {/if}
                        </div>
                    </div>

                    <!-- Right: Controls -->
                    <div class="flex flex-col items-end justify-center gap-2 pl-4 border-l border-zinc-800/50">
                        <!-- Toggle Button -->
                        <button 
                            onclick={() => toggleScope(scope)}
                            class="px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider flex items-center gap-2 w-24 justify-center transition-all
                                {scope.status === 'active' 
                                    ? 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white' 
                                    : 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-500 hover:bg-emerald-900/50'}
                            "
                        >
                            {#if scope.status === 'active'}
                                <Pause size={10} /> PAUSE
                            {:else}
                                <Play size={10} /> RESUME
                            {/if}
                        </button>

                        <!-- Delete Button -->
                        <button 
                            onclick={() => deleteScope(scope.id)}
                            class="px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider flex items-center gap-2 w-24 justify-center transition-all
                                text-zinc-600 hover:text-red-500 hover:bg-red-950/10"
                        >
                            <Trash2 size={10} /> REMOVE
                        </button>
                    </div>
                </div>
            {/each}

            {#if scopes.length === 0}
                <div class="py-24 text-center border border-dashed border-brand-border opacity-30">
                    <Target size={32} class="mx-auto mb-2 text-zinc-700" />
                    <p class="text-[9px] font-black uppercase tracking-widest text-zinc-600">No Operational Scopes Configured</p>
                </div>
            {/if}
        </div>
    </main>
</div>
