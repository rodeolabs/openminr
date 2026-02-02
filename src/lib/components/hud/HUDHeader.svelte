<script lang="ts">
    import { 
        LayoutGrid, 
        Archive, 
        Crosshair, 
        Zap, 
        Power,
        Menu,
        Wifi,
        WifiOff,
        Loader2
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
            class="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors btn-hover"
            title="Toggle Sidebar"
        >
            <Menu size={20} />
        </button>

        <div class="hidden lg:flex items-center gap-2">
            <div class="w-8 h-8 bg-brand-accent rounded-sm flex items-center justify-center glow-accent">
                <Zap size={18} class="text-black fill-black" />
            </div>
            <div class="flex flex-col">
                <span class="text-body-sm font-black uppercase tracking-widest leading-none text-white">OpenMinr</span>
                <span class="text-label-sm font-mono text-zinc-500 uppercase tracking-[0.2em] leading-none mt-1">Tactical OS</span>
            </div>
        </div>
    </div>

    <!-- Center: Navigation -->
    <nav class="absolute left-1/2 -translate-x-1/2 flex items-center bg-zinc-900/50 p-1 rounded border border-zinc-800 shadow-xl">
        {#each TABS as tab}
            <button
                onclick={() => view = tab.id as View}
                class="flex items-center gap-2 px-3 lg:px-6 py-1.5 rounded-sm text-label font-bold uppercase tracking-wider transition-all btn-hover
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
    <div class="flex items-center gap-4 w-72 justify-end">
        <!-- Status Indicators -->
        <div class="hidden md:flex items-center gap-3">
            <!-- Connection Status -->
            <div class="flex items-center gap-1.5" title="System Connection">
                {#if system.isOnline}
                    <Wifi size={12} class="text-emerald-500" />
                {:else}
                    <WifiOff size={12} class="text-zinc-600" />
                {/if}
            </div>

            <!-- Sync Status -->
            {#if system.isSyncing}
                <div class="flex items-center gap-1.5" title="Data Sync Active">
                    <Loader2 size={12} class="text-amber-500 animate-spin" />
                    <span class="text-label-sm text-amber-500">Syncing</span>
                </div>
            {/if}

            <!-- Incident Count -->
            <div class="flex items-center gap-1.5" title="Active Incidents">
                <span class="text-label-sm text-zinc-500">Signals:</span>
                <span class="text-label text-brand-accent">{incidentStore.all.length}</span>
            </div>

            <div class="w-px h-4 bg-zinc-800"></div>

            <!-- System Status -->
            <div class="flex flex-col items-end">
                <span class="text-label-sm text-zinc-500">System</span>
                <span class="text-label {system.isOnline ? 'text-emerald-500' : 'text-zinc-600'}">
                    {system.isOnline ? 'Active' : 'Offline'}
                </span>
            </div>
        </div>

        <!-- Power Toggle -->
        <button
            onclick={() => system.toggleSystem()}
            class="relative h-6 w-11 rounded-full border transition-all duration-300 ease-in-out focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-black focus:ring-brand-accent btn-hover
                {system.isOnline 
                    ? 'bg-emerald-950/50 border-emerald-500/50 glow-emerald' 
                    : 'bg-zinc-900/50 border-zinc-700'}"
            title={system.isOnline ? "Deactivate System Intelligence" : "Activate System Intelligence"}
        >
            <span 
                class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full shadow transition-transform duration-300 flex items-center justify-center
                    {system.isOnline ? 'translate-x-5 bg-emerald-500' : 'translate-x-0 bg-zinc-600'}"
            >
                {#if system.isOnline}
                    <Zap size={10} class="text-black fill-black" />
                {:else}
                    <Power size={10} class="text-zinc-300" />
                {/if}
            </span>
        </button>
    </div>
</header>
