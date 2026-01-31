<script lang="ts">
  import { onMount } from 'svelte';
  import { system } from '$lib/system.svelte';
  import { incidentStore } from '$lib/incidents.svelte';
  
  // HUD Components
  import HUDHeader from '$lib/components/hud/HUDHeader.svelte';
  import Feed from '$lib/components/hud/Feed.svelte';
  import SituationMap from '$lib/components/hud/SituationMap.svelte';
  import TacticalDossier from '$lib/components/hud/TacticalDossier.svelte';
  import TargetingView from '$lib/components/hud/TargetingView.svelte';
  import ArchiveView from '$lib/components/hud/ArchiveView.svelte';
  
  // Icons
  import { AlertCircle, Zap } from 'lucide-svelte';

  // View State
  type View = 'monitor' | 'archive' | 'targeting';
  let activeView = $state<View>('monitor');

  // Automatic Signal Polling
  onMount(() => {
    // Initial sync trigger
    if (system.isOnline) {
       system.triggerSync();
    }
    
    const interval = setInterval(() => {
        if (system.isOnline) {
            system.triggerSync();
        }
    }, 90000); // 90s background poll

    return () => clearInterval(interval);
  });
</script>

<div class="flex flex-col h-screen w-screen bg-brand-dark text-white font-sans overflow-hidden tactical-scan">
  
  <!-- System Notifications Overlay -->
  <div class="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
    {#each system.notifications as n (n.id)}
      <div class="px-4 py-2 bg-zinc-900/95 border-l-2 border-brand-accent text-[10px] font-black uppercase tracking-widest shadow-2xl animate-in slide-in-from-top duration-300 flex items-center gap-3 backdrop-blur border border-zinc-800">
        <div class="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping"></div>
        {n.message}
      </div>
    {/each}
  </div>

  <!-- Top Navigation (Authoritative System Control) -->
  <HUDHeader bind:view={activeView} />

  <!-- Main Viewport -->
  <div class="flex-1 relative overflow-hidden flex h-full w-full">
    
    <!-- Left Pane: Feed & Mission HUD -->
    <aside class="w-80 h-full shrink-0 z-20 shadow-2xl border-r border-brand-border">
        <Feed />
    </aside>

    <!-- Center Pane: Map / HUD Background -->
    <main class="flex-1 h-full relative z-10 bg-[#050506]">
        {#if activeView === 'monitor'}
            <SituationMap />
        {:else if activeView === 'targeting'}
            <TargetingView />
        {:else if activeView === 'archive'}
            <ArchiveView />
        {/if}
    </main>

    <!-- Right Pane: Intelligence Dossier -->
    <aside class="w-96 h-full shrink-0 z-20 shadow-2xl border-l border-brand-border">
        <TacticalDossier incident={incidentStore.selected} />
    </aside>
    
  </div>
  
  <!-- Global Footers / Status Overlays -->
  {#if system.isSyncing}
    <div class="fixed bottom-4 right-4 z-[60] flex items-center gap-3 bg-zinc-950/80 border border-brand-border px-3 py-1.5 rounded-sm backdrop-blur">
        <div class="flex items-center gap-2">
            <Zap size={10} class="text-amber-500 animate-pulse" />
            <span class="text-[8px] font-black uppercase text-zinc-400 tracking-widest">Incoming Data Stream</span>
        </div>
    </div>
  {/if}

</div>
