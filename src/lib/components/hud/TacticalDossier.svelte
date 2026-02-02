<script lang="ts">
    import type { Incident } from '$lib/types';
    import { incidentStore } from '$lib/incidents.svelte';
    import AnalystActions from '$lib/components/AnalystActions.svelte';
    import { MapPin, Clock, Hash, Globe, Activity, Shield, X, ExternalLink, ChevronLeft, FileText, Link2 } from 'lucide-svelte';
    import { browser } from '$app/environment';
    import { generateUUID } from '$lib/utils/id';
    import { supabase } from '$lib/supabase/client';
    import { onMount } from 'svelte';

    let { incident } = $props<{ incident: Incident | null }>();
    
    let summary = $derived(incident?.tactical_summary || incident?.description || 'Awaiting intelligence analysis...');

    // Get or create analyst ID for this session
    let analystId = $state('');
    let intelReports = $state<Array<{source: string, content: string, metadata: any}>>([]);
    let loadingReports = $state(false);
    
    $effect(() => {
        if (browser) {
            let id = localStorage.getItem('analyst_id');
            if (!id) {
                id = generateUUID();
                localStorage.setItem('analyst_id', id);
            }
            analystId = id;
        }
    });

    // Load intel reports when incident changes
    $effect(() => {
        if (incident?.id && browser) {
            loadIntelReports(incident.id);
        }
    });

    async function loadIntelReports(incidentId: string) {
        loadingReports = true;
        try {
            const { data } = await supabase
                .from('intel_reports')
                .select('*')
                .eq('incident_id', incidentId)
                .order('created_at', { ascending: false });
            
            if (data) {
                intelReports = data;
            }
        } catch (e) {
            console.error('Failed to load intel reports:', e);
        } finally {
            loadingReports = false;
        }
    }

    // Extract URL from metadata or source
    function getSourceUrl(report: any): string | null {
        // Check metadata for URL
        if (report.metadata?.url) return report.metadata.url;
        if (report.metadata?.link) return report.metadata.link;
        if (report.metadata?.gdacs_link) return report.metadata.gdacs_link;
        
        // For X posts, construct URL from handle
        if (report.source?.includes('X.com') && report.metadata?.author) {
            return `https://x.com/${report.metadata.author.replace('@', '')}`;
        }
        
        return null;
    }

    // Get display name for source
    function getSourceDisplayName(report: any): string {
        if (report.metadata?.author) {
            return `${report.source} @${report.metadata.author}`;
        }
        return report.source;
    }

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
        <div class="p-3 sm:p-4 border-b border-brand-border bg-zinc-900/30">
            <!-- Back Button / Breadcrumb -->
            <button 
                class="flex items-center gap-1 text-label text-zinc-500 hover:text-white transition-colors mb-2 sm:mb-3 btn-hover"
                onclick={() => incidentStore.select(null)}
            >
                <ChevronLeft size={12} />
                <span class="hidden sm:inline">Back to Feed</span>
                <span class="sm:hidden">Back</span>
            </button>

            <div class="flex justify-between items-start mb-2 sm:mb-4">
                <div class="space-y-1">
                    <span class="font-mono text-label-sm text-brand-muted flex items-center gap-2">
                        <Hash size={10} /> {incident.id.slice(0,8)}
                    </span>
                    <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span class="px-1.5 sm:px-2 py-0.5 text-label-sm font-bold bg-white/5 border border-white/10 rounded-sm uppercase text-zinc-400">
                            {incident.domain || 'UNCATEGORIZED'}
                        </span>
                        <span class="px-1.5 sm:px-2 py-0.5 text-label-sm font-bold rounded-sm uppercase {getSeverityBadgeClass(incident.severity)}">
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
            
            <h2 class="text-body sm:text-title text-white mb-2 sm:mb-4 leading-tight">{incident.title}</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-label-sm sm:text-label text-zinc-500 font-mono">
                <div class="flex items-center gap-2">
                    <Clock size={12} class="text-brand-accent shrink-0" /> 
                    <span class="truncate">{new Date(incident.created_at).toLocaleTimeString()}</span>
                </div>
                {#if incident.lat}
                    <div class="flex items-center gap-2">
                        <MapPin size={12} class="text-brand-accent shrink-0" /> 
                        <span class="truncate">{incident.lat.toFixed(4)}, {incident.lon?.toFixed(4)}</span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6 custom-scrollbar">
            <!-- AI Brief -->
            <section class="space-y-2">
                <div class="flex justify-between items-center">
                    <h3 class="text-label text-zinc-600 flex items-center gap-2">
                        <Activity size={12} /> Intelligence Brief
                    </h3>
                </div>
                <div class="text-body-sm sm:text-body text-zinc-300 leading-relaxed p-2 sm:p-3 bg-white/5 border-l-[3px] border-brand-accent rounded-r-sm font-sans">
                    {summary}
                </div>
            </section>

            <!-- Source Links (J3 Critical Feature) -->
            {#if intelReports.length > 0}
                <section class="space-y-2">
                    <h3 class="text-label text-zinc-600 flex items-center gap-2">
                        <Link2 size={12} /> Source Verification
                    </h3>
                    <div class="space-y-2">
                        {#each intelReports as report, i}
                            {@const url = getSourceUrl(report)}
                            <div class="p-2 sm:p-3 bg-zinc-900/50 border border-zinc-800 rounded-sm">
                                <div class="flex justify-between items-start gap-2 mb-1.5">
                                    <span class="text-label-sm font-mono text-brand-accent truncate">
                                        {getSourceDisplayName(report)}
                                    </span>
                                    {#if url}
                                        <a 
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="shrink-0 text-label-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                                        >
                                            <ExternalLink size={10} />
                                            View
                                        </a>
                                    {/if}
                                </div>
                                <p class="text-label-sm text-zinc-500 line-clamp-2">
                                    {report.content}
                                </p>
                            </div>
                        {/each}
                    </div>
                </section>
            {:else if loadingReports}
                <div class="p-3 text-center">
                    <div class="animate-pulse text-label text-zinc-600">Loading sources...</div>
                </div>
            {/if}

            <!-- Metadata Cards -->
            <section class="grid grid-cols-2 gap-2 sm:gap-3">
                <div class="bg-zinc-900/50 p-2 sm:p-3 rounded-sm border border-zinc-800">
                    <div class="text-label-sm text-zinc-500 mb-1">Confidence</div>
                    <div class="text-base sm:text-lg font-mono text-emerald-500 font-bold">{(incident.confidence_score * 100).toFixed(0)}%</div>
                </div>
                <div class="bg-zinc-900/50 p-2 sm:p-3 rounded-sm border border-zinc-800">
                    <div class="text-label-sm text-zinc-500 mb-1">Source Hash</div>
                    <div class="text-label-sm font-mono text-zinc-400 truncate">
                        {incident.source_hash?.slice(0,12) || 'INTERNAL'}
                    </div>
                </div>
            </section>

            <!-- Analyst Actions Module -->
            <section class="pt-3 sm:pt-4 border-t border-brand-border/30">
                <h3 class="text-label text-zinc-600 mb-2 sm:mb-3 flex items-center gap-2">
                    <Shield size={12} /> Operator Actions
                </h3>
                {#if analystId}
                    <AnalystActions incident={incident} analystId={analystId} />
                {:else}
                    <div class="p-3 sm:p-4 bg-zinc-900/50 border border-zinc-800 rounded-sm text-center">
                        <p class="text-label text-zinc-500">Initializing operator session...</p>
                    </div>
                {/if}
            </section>
        </div>

    {:else}
        <!-- Empty State -->
        <div class="flex-1 flex flex-col items-center justify-center text-zinc-700 p-6 sm:p-8 text-center opacity-50">
            <Globe size={48} strokeWidth={1} class="mb-3 sm:mb-4 opacity-20" />
            <h3 class="text-body-sm font-black uppercase tracking-[0.2em] mb-1 sm:mb-2">No Signal Selected</h3>
            <p class="text-label max-w-[200px]">Select an event from the feed or map to view tactical details.</p>
        </div>
    {/if}
</div>
