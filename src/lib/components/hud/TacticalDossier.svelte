<script lang="ts">
    import type { Incident } from '$lib/types';
    import { incidentStore } from '$lib/incidents.svelte';
    import AnalystActions from '$lib/components/AnalystActions.svelte';
    import { MapPin, Clock, Hash, Globe, Activity, Shield, X, ExternalLink } from 'lucide-svelte';

    let { incident } = $props<{ incident: Incident | null }>();
    
    let summary = $derived(incident?.tactical_summary || incident?.description || 'Awaiting intelligence analysis...');
</script>

<div class="hud-panel w-full border-l border-brand-border bg-brand-dark flex flex-col h-full">
    {#if incident}
        <!-- Header -->
        <div class="p-4 border-b border-brand-border bg-zinc-900/30">
            <div class="flex justify-between items-start mb-4">
                <div class="space-y-1">
                    <span class="font-mono text-[10px] text-brand-muted uppercase tracking-widest flex items-center gap-2">
                        <Hash size={10} /> {incident.id.slice(0,8)}
                    </span>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 text-[10px] font-bold bg-white/5 border border-white/10 rounded-sm uppercase text-zinc-400">
                            {incident.domain || 'UNCATEGORIZED'}
                        </span>
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase 
                            {incident.severity <= 2 ? 'bg-red-950/30 text-red-500 border border-red-900/50' : 'bg-zinc-800 text-zinc-500'}">
                            SEV {incident.severity}
                        </span>
                    </div>
                </div>
                <button 
                    class="p-1 hover:bg-white/10 rounded transition-colors text-zinc-500 hover:text-white"
                    onclick={() => incidentStore.select(null)}
                >
                    <X size={16} />
                </button>
            </div>
            
            <h2 class="text-base font-bold leading-tight text-white mb-4">{incident.title}</h2>
            
            <div class="grid grid-cols-2 gap-4 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                <div class="flex items-center gap-2">
                    <Clock size={12} class="text-brand-accent" /> 
                    {new Date(incident.created_at).toLocaleTimeString()}
                </div>
                {#if incident.lat}
                    <div class="flex items-center gap-2">
                        <MapPin size={12} class="text-brand-accent" /> 
                        {incident.lat.toFixed(4)}, {incident.lon?.toFixed(4)}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <!-- AI Brief -->
            <section class="space-y-2">
                <div class="flex justify-between items-center">
                    <h3 class="text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] flex items-center gap-2">
                        <Activity size={10} /> Intelligence Brief
                    </h3>
                    {#if incident.source_hash}
                        <a 
                            href="https://x.com/search?q={incident.source_hash}" 
                            target="_blank" 
                            rel="noopener"
                            class="text-[9px] font-bold text-brand-accent hover:underline flex items-center gap-1"
                        >
                            Verify Source <ExternalLink size={10} />
                        </a>
                    {/if}
                </div>
                <div class="text-xs text-zinc-300 leading-relaxed p-3 bg-white/5 border-l-2 border-brand-accent rounded-r-sm font-sans">
                    {summary}
                </div>
            </section>

            <!-- Metadata Cards -->
            <section class="grid grid-cols-2 gap-3">
                <div class="bg-zinc-900/50 p-3 rounded-sm border border-zinc-800">
                    <div class="text-[9px] text-zinc-500 uppercase mb-1">Confidence Score</div>
                    <div class="text-lg font-mono text-emerald-500 font-bold">{(incident.confidence_score * 100).toFixed(0)}%</div>
                </div>
                <div class="bg-zinc-900/50 p-3 rounded-sm border border-zinc-800">
                    <div class="text-[9px] text-zinc-500 uppercase mb-1">Source ID</div>
                    <div class="text-[10px] font-mono text-zinc-400 truncate">
                        {incident.source_hash || 'INTERNAL'}
                    </div>
                </div>
            </section>

            <!-- Analyst Actions Module -->
            <section class="pt-4 border-t border-brand-border/30">
                <h3 class="text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Shield size={10} /> Operator Actions
                </h3>
                <AnalystActions incident={incident} analystId="OP-01" />
            </section>
        </div>

    {:else}
        <!-- Empty State -->
        <div class="flex-1 flex flex-col items-center justify-center text-zinc-700 p-8 text-center opacity-50">
            <Globe size={48} strokeWidth={1} class="mb-4 opacity-20" />
            <h3 class="text-xs font-black uppercase tracking-[0.2em] mb-2">No Signal Selected</h3>
            <p class="text-[10px] font-mono">Select an event from the feed or map to view tactical details.</p>
        </div>
    {/if}
</div>
