<script lang="ts">
    import type { Incident } from '$lib/types';
    import { incidentStore } from '$lib/incidents.svelte';
    import AnalystActions from '$lib/components/AnalystActions.svelte';
    import { MapPin, Clock, Hash, Globe, Activity, Shield, X, ExternalLink, ChevronLeft } from 'lucide-svelte';

    let { incident } = $props<{ incident: Incident | null }>();
    
    let summary = $derived(incident?.tactical_summary || incident?.description || 'Awaiting intelligence analysis...');

    // Get severity badge class
    function getSeverityBadgeClass(severity: number): string {
        if (severity === 1) return 'severity-badge-1';
        if (severity === 2) return 'severity-badge-2';
        if (severity === 3) return 'severity-badge-3';
        if (severity === 4) return 'severity-badge-4';
        return 'severity-badge-5';
    }
</script>

<div class="hud-panel w-full border-l border-brand-border bg-brand-dark flex flex-col h-full">
    {#if incident}
        <!-- Header -->
        <div class="p-4 border-b border-brand-border bg-zinc-900/30">
            <!-- Back Button / Breadcrumb -->
            <button 
                class="flex items-center gap-1 text-label text-zinc-500 hover:text-white transition-colors mb-3 btn-hover"
                onclick={() => incidentStore.select(null)}
            >
                <ChevronLeft size={12} />
                <span>Back to Feed</span>
            </button>

            <div class="flex justify-between items-start mb-4">
                <div class="space-y-1">
                    <span class="font-mono text-label text-brand-muted flex items-center gap-2">
                        <Hash size={10} /> {incident.id.slice(0,8)}
                    </span>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 text-label font-bold bg-white/5 border border-white/10 rounded-sm uppercase text-zinc-400">
                            {incident.domain || 'UNCATEGORIZED'}
                        </span>
                        <span class="px-2 py-0.5 text-label font-bold rounded-sm uppercase {getSeverityBadgeClass(incident.severity)}">
                            SEV {incident.severity}
                        </span>
                    </div>
                </div>
                <button 
                    class="p-1 hover:bg-white/10 rounded transition-colors text-zinc-500 hover:text-white btn-hover"
                    onclick={() => incidentStore.select(null)}
                    title="Close Dossier"
                >
                    <X size={16} />
                </button>
            </div>
            
            <h2 class="text-title text-white mb-4">{incident.title}</h2>
            
            <div class="grid grid-cols-2 gap-4 text-label text-zinc-500 font-mono">
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
                    <h3 class="text-label text-zinc-600 flex items-center gap-2">
                        <Activity size={12} /> Intelligence Brief
                    </h3>
                    {#if incident.source_hash}
                        <a 
                            href="https://x.com/search?q={incident.source_hash}" 
                            target="_blank" 
                            rel="noopener"
                            class="text-label text-brand-accent hover:underline flex items-center gap-1 transition-colors"
                        >
                            Verify Source <ExternalLink size={10} />
                        </a>
                    {/if}
                </div>
                <div class="text-body text-zinc-300 leading-relaxed p-3 bg-white/5 border-l-[3px] border-brand-accent rounded-r-sm font-sans">
                    {summary}
                </div>
            </section>

            <!-- Metadata Cards -->
            <section class="grid grid-cols-2 gap-3">
                <div class="bg-zinc-900/50 p-3 rounded-sm border border-zinc-800">
                    <div class="text-label text-zinc-500 mb-1">Confidence Score</div>
                    <div class="text-[18px] font-mono text-emerald-500 font-bold">{(incident.confidence_score * 100).toFixed(0)}%</div>
                </div>
                <div class="bg-zinc-900/50 p-3 rounded-sm border border-zinc-800">
                    <div class="text-label text-zinc-500 mb-1">Source ID</div>
                    <div class="text-label font-mono text-zinc-400 truncate">
                        {incident.source_hash || 'INTERNAL'}
                    </div>
                </div>
            </section>

            <!-- Analyst Actions Module -->
            <section class="pt-4 border-t border-brand-border/30">
                <h3 class="text-label text-zinc-600 mb-3 flex items-center gap-2">
                    <Shield size={12} /> Operator Actions
                </h3>
                <AnalystActions incident={incident} analystId="OP-01" />
            </section>
        </div>

    {:else}
        <!-- Empty State -->
        <div class="flex-1 flex flex-col items-center justify-center text-zinc-700 p-8 text-center opacity-50">
            <Globe size={56} strokeWidth={1} class="mb-4 opacity-20" />
            <h3 class="text-body-sm font-black uppercase tracking-[0.2em] mb-2">No Signal Selected</h3>
            <p class="text-label max-w-[200px]">Select an event from the feed or map to view tactical details.</p>
        </div>
    {/if}
</div>
