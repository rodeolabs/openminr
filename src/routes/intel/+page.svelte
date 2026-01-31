<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/client';
  import SeverityBadge from '$lib/components/SeverityBadge.svelte';
  import { Search, History, Database, ArrowRight } from 'lucide-svelte';

  let incidents = $state<any[]>([]);
  let searchQuery = $state('');
  let loading = $state(false);

  async function fetchHistory() {
    loading = true;
    const { data } = await supabase.from('incidents').select('*, intel_reports(*)')
      .order('created_at', { ascending: false }).limit(100);
    incidents = data || [];
    loading = false;
  }

  async function performAISearch() {
    if (!searchQuery.trim()) return fetchHistory();
    loading = true;
    const res = await fetch('/api/search', { method: 'POST', body: JSON.stringify({ query: searchQuery }) });
    const data = await res.json();
    if (data.success) incidents = data.results;
    loading = false;
  }

  onMount(fetchHistory);
</script>

<div class="flex flex-col h-full bg-[#050505] overflow-hidden">
  <header class="p-8 border-b border-brand-border bg-zinc-900/10 shrink-0">
    <div class="max-w-5xl mx-auto space-y-6">
      <div class="flex items-center gap-3">
        <History size={20} class="text-brand-accent" />
        <h2 class="text-xl font-black uppercase tracking-[0.3em]">Intelligence Archive</h2>
      </div>
      <div class="flex gap-4">
        <div class="flex-1 relative">
          <Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input bind:value={searchQuery} onkeydown={(e) => e.key === 'Enter' && performAISearch()} placeholder="Search historical incidents..." class="w-full bg-brand-dark border border-brand-border p-4 pl-12 text-sm outline-none focus:border-brand-accent/50 rounded-sm" />
        </div>
        <button onclick={performAISearch} class="px-8 bg-brand-accent font-black uppercase tracking-widest text-xs hover:bg-red-500 transition-all rounded-sm flex items-center gap-2">
          {loading ? 'Processing...' : 'Execute Search'} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  </header>

  <main class="flex-1 overflow-y-auto p-8 custom-scrollbar">
    <div class="max-w-5xl mx-auto space-y-4">
      <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">
        <span>Records Found: {incidents.length}</span>
        <button onclick={fetchHistory} class="hover:text-white">Sync Cache</button>
      </div>

      {#if incidents.length === 0 && !loading}
        <div class="text-center py-24 border border-dashed border-brand-border opacity-40">
          <Database size={48} class="mx-auto mb-4" />
          <p class="text-xs font-black uppercase tracking-widest text-zinc-500">No records retrieved</p>
        </div>
      {/if}

      <div class="grid gap-3">
        {#each incidents as incident (incident.id)}
          <div class="bg-brand-surface border border-brand-border p-5 rounded-sm hover:border-zinc-700 transition-all group">
            <div class="flex justify-between mb-4">
              <SeverityBadge severity={incident.severity} confidence={incident.confidence_score} />
              <span class="text-[10px] font-black text-zinc-500 uppercase px-2 py-1 bg-zinc-900 border border-brand-border/50">{incident.status}</span>
            </div>
            <h3 class="text-lg font-bold group-hover:text-brand-accent transition-colors mb-2">{incident.title}</h3>
            <p class="text-sm text-zinc-400 leading-relaxed mb-4 line-clamp-3">{incident.description}</p>
            <div class="flex gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-600">
              <span><span class="text-brand-accent">Cat:</span> {incident.category}</span>
              <span><span class="text-brand-accent">Time:</span> {new Date(incident.created_at).toLocaleTimeString()}</span>
              <span><span class="text-brand-accent">Source:</span> {incident.intel_reports?.[0]?.source || 'Internal'}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </main>
</div>

<style>
  :global(.custom-scrollbar::-webkit-scrollbar) { width: 4px; }
  :global(.custom-scrollbar::-webkit-scrollbar-thumb) { background: #27272a; border-radius: 2px; }
</style>
