<script lang="ts">
    import { 
        LayoutGrid, 
        Archive, 
        Crosshair, 
        Zap, 
        Power,
        Bell
    } from 'lucide-svelte';
    import { system } from '$lib/system.svelte';
    import { incidentStore } from '$lib/incidents.svelte';

    type View = 'monitor' | 'archive' | 'targeting';
    let { 
        view = $bindable('monitor') 
    } = $props<{ view: View }>();

    const TABS = [
        { id: 'monitor', label: 'Monitor', icon: LayoutGrid },
        { id: 'archive', label: 'Archive', icon: Archive },
        { id: 'targeting', label: 'Targeting', icon: Crosshair }
    ];
</script>

<header class="h-14 border-b border-brand-border bg-zinc-950 flex items-center justify-between px-4 shrink-0 z-50 relative">
    <!-- Left: Brand -->
    <div class="flex items-center gap-4 w-64">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-brand-accent rounded-sm flex items-center justify-center">
                <Zap size={18} class="text-black fill-black" />
            </div>
            <div class="flex flex-col">
                <span class="text-sm font-black uppercase tracking-widest leading-none text-white">OpenMinr</span>
                <span class="text-[9px] font-mono text-brand-muted uppercase tracking-[0.2em] leading-none mt-1">Tactical OS</span>
            </div>
        </div>
    </div>

    <!-- Center: Navigation -->
    <nav class="absolute left-1/2 -translate-x-1/2 flex items-center bg-zinc-900/50 p-1 rounded border border-zinc-800">
        {#each TABS as tab}
            <button
                onclick={() => view = tab.id as View}
                class="flex items-center gap-2 px-6 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all
                    {view === tab.id 
                        ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'}
                "
            >
                <tab.icon size={12} />
                {tab.label}
            </button>
        {/each}
    </nav>

    <!-- Right: Global Controls -->
    <div class="flex items-center gap-4 w-64 justify-end">
        <!-- Sync Status -->
        <div class="flex flex-col items-end mr-2">
            <span class="text-[8px] font-mono uppercase text-zinc-500 mb-0.5">Signal Status</span>
            <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full {system.isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-zinc-700'}"></span>
                <span class="text-[9px] font-bold text-zinc-400">{system.isSyncing ? 'SYNCING' : 'IDLE'}</span>
            </div>
        </div>

        <!-- Master Switch -->
        <button
            onclick={() => system.toggleSystem()}
            class="flex items-center gap-2 px-3 py-1.5 rounded border transition-all
                {system.isOnline 
                    ? 'bg-emerald-950/30 text-emerald-500 border-emerald-900/50 hover:bg-emerald-900/50' 
                    : 'bg-red-950/30 text-red-500 border-red-900/50 hover:bg-red-900/50'}
            "
        >
            <Power size={14} />
            <span class="text-[9px] font-black uppercase tracking-wider">
                {system.isOnline ? 'Active' : 'Offline'}
            </span>
        </button>
    </div>
</header>
