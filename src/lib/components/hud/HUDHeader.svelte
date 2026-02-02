<script lang="ts">
    import { 
        LayoutGrid, 
        Archive, 
        Crosshair, 
        Zap, 
        Power,
        Bell,
        Menu,
        Activity,
        Target
    } from 'lucide-svelte';
    import { system } from '$lib/system.svelte';
    import { incidentStore } from '$lib/incidents.svelte';

    type View = 'monitor' | 'archive' | 'targeting';
    let { 
        view = $bindable('monitor'),
        showMobileSidebar = $bindable(false)
    } = $props<{ view: View, showMobileSidebar?: boolean }>();

    const TABS = [
        { id: 'monitor', label: 'Monitor', icon: LayoutGrid },
        { id: 'targeting', label: 'Targeting', icon: Crosshair },
        { id: 'archive', label: 'Archive', icon: Archive }
    ];
</script>

<header class="h-14 border-b border-brand-border bg-zinc-950 flex items-center justify-between px-3 lg:px-4 shrink-0 z-50 relative">
    <!-- Left: Brand / Menu -->
    <div class="flex items-center gap-4 w-64">
        <button 
            onclick={() => showMobileSidebar = !showMobileSidebar}
            class="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            title="Toggle Sidebar"
        >
            <Menu size={20} />
        </button>

        <div class="hidden lg:flex items-center gap-2">
            <div class="w-8 h-8 bg-brand-accent rounded-sm flex items-center justify-center">
                <Zap size={18} class="text-black fill-black" />
            </div>
            <div class="flex flex-col">
                <span class="text-sm font-black uppercase tracking-widest leading-none text-white">OpenMinr</span>
                <span class="text-[9px] font-mono text-brand-muted uppercase tracking-[0.2em] leading-none mt-1 text-zinc-500">Tactical OS</span>
            </div>
        </div>
    </div>

    <!-- Center: Navigation -->
    <nav class="absolute left-1/2 -translate-x-1/2 flex items-center bg-zinc-900/50 p-1 rounded border border-zinc-800 shadow-xl">
        {#each TABS as tab}
            <button
                onclick={() => view = tab.id as View}
                class="flex items-center gap-2 px-3 lg:px-6 py-1.5 rounded-sm text-[9px] lg:text-[10px] font-bold uppercase tracking-wider transition-all
                    {view === tab.id 
                        ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'}
                "
            >
                <tab.icon size={14} class="shrink-0 {view === tab.id ? 'text-brand-accent' : ''}" />
                <span class="inline-block">{tab.label}</span>
            </button>
        {/each}
    </nav>

    <!-- Right: System Status -->
    <div class="flex items-center gap-4 w-64 justify-end">
        <!-- Status Text -->
        <div class="hidden md:flex flex-col items-end">
            <span class="text-[7px] font-mono uppercase text-zinc-500 leading-none mb-1">System Integrity</span>
            <span class="text-[10px] font-black uppercase tracking-widest leading-none transition-colors {system.isOnline ? 'text-emerald-500' : 'text-zinc-600'}">
                {system.isSyncing ? 'Receiving Data...' : system.isOnline ? 'System Active' : 'Offline'}
            </span>
        </div>

        <button
            onclick={() => system.toggleSystem()}
            class="relative h-5 w-10 rounded-full border transition-all duration-300 ease-in-out focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-black focus:ring-brand-accent
                {system.isOnline 
                    ? 'bg-emerald-950/50 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : 'bg-zinc-900/50 border-zinc-700'}"
            title={system.isOnline ? "Deactivate System Intelligence" : "Activate System Intelligence"}
        >
            <!-- Toggle Knob -->
            <span 
                class="absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full shadow transition-transform duration-300 flex items-center justify-center
                    {system.isOnline ? 'translate-x-5 bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'translate-x-0 bg-zinc-600'}"
            >
                {#if system.isOnline}
                    <Zap size={8} class="text-black fill-black" />
                {:else}
                    <Power size={8} class="text-zinc-300" />
                {/if}
            </span>
        </button>
    </div>
</header>
