<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase/client';
    import { Target, Search, Plus, Loader2, Trash2, Play, Pause, Zap, Hash, Activity } from 'lucide-svelte';
    import { system } from '$lib/system.svelte';
    import type { Mission } from '$lib/types';

    let missions = $state<Mission[]>([]);
    let newMissionGoal = $state('');
    let isCreating = $state(false);

    async function loadMissions() {
        const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
        if (data) missions = data;
    }

    async function createMission() {
        if (!newMissionGoal.trim() || isCreating) return;
        isCreating = true;
        
        try {
            const res = await fetch('/api/missions', {
                method: 'POST',
                body: JSON.stringify({ goal: newMissionGoal })
            });
            const data = await res.json();
            if (data.success) {
                newMissionGoal = '';
                system.notify('Mission Vector Initialized', 'info');
                loadMissions();
            }
        } finally {
            isCreating = false;
        }
    }

    async function toggleMission(mission: Mission) {
        const newStatus = mission.status === 'active' ? 'paused' : 'active';
        await supabase.from('missions').update({ status: newStatus }).eq('id', mission.id);
        loadMissions();
    }

    async function deleteMission(id: string) {
        if (!confirm('Abort mission vector?')) return;
        await supabase.from('missions').delete().eq('id', id);
        loadMissions();
    }

    async function scanMission(id: string) {
        system.notify('Forcing Mission Sync...', 'info');
        await system.triggerSync(true);
    }

    onMount(loadMissions);
</script>

<div class="h-full flex flex-col bg-brand-dark overflow-hidden border-l border-brand-border">
    <!-- Header -->
    <header class="p-4 border-b border-brand-border bg-zinc-950/50 shrink-0 backdrop-blur">
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-lg font-black uppercase tracking-[0.2em] text-white mb-1 flex items-center gap-2">
                    <Target class="text-brand-accent" size={16} /> Mission Targeting
                </h2>
                <p class="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Configure intelligence collection vectors and automated scan parameters.</p>
            </div>
            
            <button 
                onclick={() => system.triggerSync(true)}
                disabled={system.isSyncing}
                class="px-4 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[9px] hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-2"
            >
                <Zap size={12} class={system.isSyncing ? 'animate-pulse text-brand-accent' : ''} />
                Global Scan Mode
            </button>
        </div>
    </header>

    <main class="flex-1 overflow-y-auto p-4 custom-scrollbar tactical-grid">
        <div class="max-w-3xl mx-auto space-y-6">
            <!-- Creator HUD -->
            <section class="bg-zinc-950/40 backdrop-blur border border-brand-border p-6 rounded-sm relative overflow-hidden">
                <div class="absolute top-0 left-0 w-0.5 h-full bg-brand-accent"></div>
                <div class="flex items-center gap-2 mb-4">
                    <Activity size={12} class="text-brand-accent" />
                    <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100">Initialize New Mission Vector</h3>
                </div>
                
                <div class="flex gap-2">
                    <div class="flex-1 relative">
                        <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                        <input 
                            bind:value={newMissionGoal}
                            onkeydown={(e) => e.key === 'Enter' && createMission()}
                            placeholder="DESCRIBE INTELLIGENCE OBJECTIVE..." 
                            class="w-full bg-black/50 border border-zinc-800 p-3 pl-10 text-[10px] text-white outline-none focus:border-brand-accent/50 transition-all font-mono placeholder:text-zinc-700 uppercase tracking-wider" 
                        />
                    </div>
                    <button 
                        onclick={createMission}
                        disabled={!newMissionGoal.trim() || isCreating}
                        class="px-6 bg-brand-accent text-black font-black uppercase tracking-widest text-[9px] hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {#if isCreating} <Loader2 size={12} class="animate-spin" /> {:else} <Plus size={14} /> {/if}
                        Deploy
                    </button>
                </div>
            </section>

            <!-- Active Vectors Grid -->
            <section class="space-y-3">
                <div class="flex items-center justify-between px-1">
                    <h3 class="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">Active Operational Vectors</h3>
                    <span class="text-[8px] font-mono text-zinc-700">{missions.length} CONFIGURED</span>
                </div>

                <div class="grid gap-px bg-brand-border">
                    {#each missions as mission (mission.id)}
                        <div class="bg-brand-dark/40 backdrop-blur-sm p-4 flex items-center justify-between group hover:bg-zinc-900/50 transition-all">
                            <div class="flex items-center gap-4 flex-1 min-w-0">
                                <button 
                                    onclick={() => toggleMission(mission)}
                                    class="w-8 h-8 rounded-sm flex items-center justify-center border transition-all shrink-0
                                        {mission.status === 'active' 
                                            ? 'bg-emerald-950/20 border-emerald-900 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-700'}
                                    "
                                >
                                    {#if mission.status === 'active'} <Activity size={14} class="animate-pulse" /> {:else} <Pause size={14} /> {/if}
                                </button>
                                
                                <div class="min-w-0 pr-4">
                                    <div class="flex items-center gap-2 mb-0.5">
                                        <h4 class="text-xs font-black text-zinc-100 uppercase tracking-tight truncate">{mission.name}</h4>
                                        <span class="text-[7px] font-mono text-zinc-600 flex items-center gap-1 bg-black/40 px-1 py-px rounded border border-zinc-800">
                                            <Hash size={8} /> {mission.id.slice(0,8)}
                                        </span>
                                    </div>
                                    <p class="text-[9px] text-zinc-500 font-medium uppercase tracking-wider line-clamp-1 italic">{mission.goal}</p>
                                </div>
                            </div>

                            <div class="flex items-center gap-4">
                                <div class="text-right hidden sm:block">
                                    <div class="text-[7px] font-black uppercase text-zinc-700 tracking-widest mb-0.5">Scan Parameters</div>
                                    <div class="flex gap-1 justify-end">
                                        {#each (mission.keywords || []).slice(0,3) as kw}
                                            <span class="text-[7px] font-mono bg-zinc-900 text-zinc-500 px-1 py-px rounded border border-zinc-800 uppercase">{kw}</span>
                                        {/each}
                                        {#if mission.keywords?.length > 3}
                                            <span class="text-[7px] font-mono bg-zinc-900 text-zinc-500 px-1 py-px rounded border border-zinc-800">+{mission.keywords.length - 3}</span>
                                        {/if}
                                    </div>
                                </div>

                                <div class="flex items-center gap-1">
                                    <button 
                                        onclick={() => scanMission(mission.id)}
                                        disabled={system.isSyncing}
                                        class="p-2 text-zinc-500 hover:text-brand-accent hover:bg-white/5 rounded transition-all disabled:opacity-30"
                                        title="Execute Force Sync"
                                    >
                                        <Zap size={14} class={system.isSyncing ? 'animate-pulse' : ''} />
                                    </button>
                                    <button 
                                        onclick={() => deleteMission(mission.id)}
                                        class="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-950/30 rounded transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>

                {#if missions.length === 0}
                    <div class="py-16 text-center border border-dashed border-brand-border opacity-30">
                        <Target size={24} class="mx-auto mb-2 text-zinc-700" />
                        <p class="text-[9px] font-black uppercase tracking-widest text-zinc-600">No Mission Vectors Configured</p>
                    </div>
                {/if}
            </section>
        </div>
    </main>
</div>
