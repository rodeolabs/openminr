<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/client';
  import { subscribeToIncidents } from '$lib/supabase/realtime';
  import { system } from '$lib/system.svelte';
  import type { Incident } from '$lib/types';
  import { Activity, Search, Settings2, Zap, User, X, MapPin, Clock, ExternalLink, AlertCircle } from 'lucide-svelte';
  
  import SeverityBadge from '$lib/components/SeverityBadge.svelte';
  import SourceBadge from '$lib/components/SourceBadge.svelte';
  import TacticalMap from '$lib/components/map/TacticalMap.svelte';
  import WatchlistManager from '$lib/components/WatchlistManager.svelte';
  import AnalystActions from '$lib/components/AnalystActions.svelte';

  let incidents = $state<Incident[]>([]);
  let selectedIncident = $state<Incident | null>(null);
  let searchQuery = $state('');
  let selectedCategory = $state('All');
  let showWatchlist = $state(false);
  const analystId = 'ANALYST-01';

  const categories = $derived(['All', ...new Set(incidents.map(i => i.category))]);
  const filteredIncidents = $derived(
    incidents.filter(i => (selectedCategory === 'All' || i.category === selectedCategory) &&
      (!searchQuery || [i.title, i.description].some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))))
  );

  async function load() {
    const { data } = await supabase.from('incidents').select('*, intel_reports(*)')
      .in('status', ['active', 'claimed', 'escalated']).order('created_at', { ascending: false });
    incidents = data || [];
    if (selectedIncident) selectedIncident = incidents.find(i => i.id === selectedIncident!.id) || null;
  }

  onMount(() => {
    load();
    return subscribeToIncidents(
      async (p) => {
        if (p.new.severity === 1) new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
        const { data } = await supabase.from('incidents').select('*, intel_reports(*)').eq('id', p.new.id).single();
        if (data) incidents = [data, ...incidents];
      },
      async (p) => {
        if (['resolved', 'dismissed'].includes(p.new.status)) {
          incidents = incidents.filter(i => i.id !== p.new.id);
          if (selectedIncident?.id === p.new.id) selectedIncident = null;
        } else {
          const { data } = await supabase.from('incidents').select('*, intel_reports(*)').eq('id', p.new.id).single();
          if (data) incidents = incidents.map(i => i.id === p.new.id ? data : i);
        }
      }
    );
  });

  $effect(() => {
    if (!system.isOnline) return;
    const interval = setInterval(() => system.triggerSync(), 90000);
    system.triggerSync();
    return () => clearInterval(interval);
  });
</script>

<div class="flex flex-col h-full bg-brand-dark text-white font-sans overflow-hidden tactical-scan tactical-grid">
  <!-- Status Notifications Overlay -->
  <div class="fixed top-12 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    {#each system.notifications as n (n.id)}
      <div class="px-4 py-2 bg-zinc-900 border-l-2 border-brand-accent text-[10px] font-bold uppercase tracking-widest shadow-2xl animate-in slide-in-from-right duration-300 flex items-center gap-3">
        <AlertCircle size={12} class="text-brand-accent" />
        {n.message}
      </div>
    {/each}
  </div>

  <header class="h-10 border-b border-brand-border bg-zinc-950/50 flex items-center px-4 justify-between shrink-0 z-10 backdrop-blur-md">
    <div class="flex items-center gap-4">
      <button onclick={() => system.toggleSystem()} class="flex items-center gap-2 px-3 py-1 rounded text-[9px] font-mono border transition-all {system.isOnline ? 'bg-green-900/10 text-green-500 border-green-800/30' : 'text-zinc-600 border-zinc-800/50'}">
        <div class="w-1.5 h-1.5 rounded-full {system.isOnline ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}"></div>
        {system.isOnline ? 'SYSTEM ONLINE' : 'SYSTEM PAUSED'}
      </button>
      <button onclick={() => system.triggerSync(true)} disabled={system.isSyncing} class="flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 border border-brand-border text-zinc-500 hover:text-zinc-200 disabled:opacity-30">
        <Zap size={10} class={system.isSyncing ? 'animate-pulse text-brand-accent' : ''} />
        {system.isSyncing ? 'SYNCING...' : 'SYNC NOW'}
      </button>
      <button onclick={() => showWatchlist = true} class="text-zinc-600 hover:text-white transition-colors"><Settings2 size={14} /></button>
    </div>
    {#if system.lastSync}
      <span class="text-[8px] font-mono text-zinc-700 uppercase">Last Signal: {system.lastSync.toLocaleTimeString()}</span>
    {/if}
  </header>

  {#if showWatchlist} <WatchlistManager onClose={() => showWatchlist = false} /> {/if}

  <div class="flex flex-1 overflow-hidden">
    <aside class="w-80 border-r border-brand-border flex flex-col shrink-0 bg-zinc-950/20 backdrop-blur-sm">
      <div class="p-3 border-b border-brand-border space-y-3">
        <div class="relative group">
          <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-brand-accent transition-colors" />
          <input bind:value={searchQuery} placeholder="FILTER FEED..." class="w-full bg-zinc-900/50 border border-brand-border text-[10px] font-bold pl-9 pr-3 py-2 outline-none focus:border-brand-accent/30 transition-all placeholder:text-zinc-800" />
        </div>
        <div class="flex flex-wrap gap-1">
          {#each categories as cat}
            <button onclick={() => selectedCategory = cat} class="text-[8px] font-black px-2 py-1 border transition-all {selectedCategory === cat ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-transparent text-zinc-700 hover:text-zinc-500'}">{cat}</button>
          {/each}
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-2 space-y-2">
        {#each filteredIncidents as incident (incident.id)}
          <button 
            data-testid="intel-card"
            onclick={() => selectedIncident = incident} 
            class="w-full p-3 border border-transparent transition-all {selectedIncident?.id === incident.id ? 'bg-zinc-900/60 border-brand-border border-l-brand-accent border-l-2' : 'hover:bg-zinc-900/20'}"
          >
            <div class="flex justify-between items-start mb-2">
              <SeverityBadge severity={incident.severity} confidence={incident.confidence_score} />
              <span class="text-[8px] font-mono text-zinc-800">{new Date(incident.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
            <h3 class="text-[11px] font-bold text-zinc-300 leading-snug line-clamp-2 uppercase tracking-tight">{incident.title}</h3>
            <div class="flex items-center justify-between mt-2">
              <span class="text-[7px] font-black text-zinc-600 bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-800/50">{incident.category}</span>
              {#if incident.claimed_by} <span class="text-[7px] font-bold {incident.claimed_by === analystId ? 'text-green-600' : 'text-yellow-600'}"><User size={7} class="inline" /> {incident.claimed_by === analystId ? 'YOU' : incident.claimed_by}</span> {/if}
            </div>
          </button>
        {/each}
      </div>
    </aside>

    <main class="flex-1 relative bg-[#050506]">
      <TacticalMap incidents={filteredIncidents} onSelect={(id) => selectedIncident = incidents.find(i => i.id === id) || null} />
    </main>

    {#if selectedIncident}
      <aside class="w-96 border-l border-brand-border flex flex-col shrink-0 bg-zinc-950/20 backdrop-blur-md animate-in slide-in-from-right duration-300 shadow-2xl">
        <div class="p-6 border-b border-brand-border bg-brand-accent/5">
          <div class="flex justify-between items-start mb-6">
            <SeverityBadge severity={selectedIncident.severity} confidence={selectedIncident.confidence_score} />
            <button onclick={() => selectedIncident = null} class="text-zinc-700 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <h2 class="text-lg font-black leading-tight tracking-tight uppercase">{selectedIncident.title}</h2>
          <div class="mt-6 flex gap-6 text-zinc-600 font-mono text-[9px] uppercase tracking-widest">
            <div class="flex items-center gap-2"><MapPin size={10} class="text-brand-accent" /> {selectedIncident.lat?.toFixed(3)}, {selectedIncident.lon?.toFixed(3)}</div>
            <div class="flex items-center gap-2"><Clock size={10} class="text-brand-accent" /> {new Date(selectedIncident.created_at).toLocaleTimeString()}</div>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <h4 class="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-3">Situation Analysis</h4>
            <p class="text-[13px] text-zinc-400 leading-relaxed font-medium">{selectedIncident.description}</p>
          </section>
          {#if selectedIncident.intel_reports?.length}
            <section>
              <h4 class="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4">Signal Corroboration</h4>
              {#each selectedIncident.intel_reports as report}
                <div class="p-4 bg-zinc-950/50 border border-zinc-900 text-xs mb-3 group">
                  <div class="flex justify-between items-center mb-3">
                    <SourceBadge source={report.source} />
                    {#if report.metadata?.url} <a href={report.metadata.url} target="_blank" class="text-zinc-700 hover:text-brand-accent"><ExternalLink size={12} /></a> {/if}
                  </div>
                  <p class="text-zinc-500 italic text-[11px] leading-relaxed">"{report.content}"</p>
                </div>
              {/each}
            </section>
          {/if}
          <div class="pt-8 border-t border-brand-border">
            <AnalystActions incident={selectedIncident} {analystId} onUpdate={load} />
          </div>
        </div>
      </aside>
    {/if}
  </div>
</div>
