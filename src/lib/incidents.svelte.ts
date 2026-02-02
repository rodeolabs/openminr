import { browser } from '$app/environment';
import { supabase } from '$lib/supabase/client';
import { subscribeToIncidents, type RealtimeSubscription } from '$lib/supabase/realtime';
import { system } from './system.svelte';
import { CONFIG } from './config';
import type { Incident } from '$lib/types';

class IncidentStore {
    // Core State
    all = $state<Incident[]>([]);
    selectedId = $state<string | null>(null);
    filterDomain = $state<string | null>(null); 
    filterMissionId = $state<string | null>(null);

    // Realtime subscription for cleanup
    private realtimeSub: RealtimeSubscription | null = null;

    // Derived State
    filtered = $derived.by(() => {
        let result = this.all;
        if (this.filterDomain) {
            result = result.filter(i => i.domain === this.filterDomain);
        }
        if (this.filterMissionId) {
            result = result.filter(i => i.tags?.includes(`mission:${this.filterMissionId}`));
        }
        return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    selected = $derived.by(() => {
        return this.all.find(i => i.id === this.selectedId) || null;
    });

    constructor() {
        if (browser) {
            this.init();
        }
    }

    async init() {
        try {
            const { data, error } = await supabase
                .from('incidents')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(CONFIG.DATABASE.INITIAL_FEED_LIMIT);
            
            if (error) {
                console.error('[INCIDENT_STORE] Failed to load incidents:', error);
                system.notify('Failed to load incidents', 'error');
                return;
            }
            
            if (data) this.all = data as Incident[];

            // Use the realtime wrapper for proper subscription management
            this.realtimeSub = subscribeToIncidents(
                (payload) => this.handleInsert(payload),
                (payload) => this.handleUpdate(payload),
                (payload) => this.handleDelete(payload)
            );
        } catch (error) {
            console.error('[INCIDENT_STORE] Initialization error:', error);
            system.notify('System initialization failed', 'error');
        }
    }

    private handleInsert(payload: any) {
        const incident = payload.new as Incident;
        // Avoid duplicates if already exists
        if (!this.all.find(i => i.id === incident.id)) {
            this.all = [incident, ...this.all];
            system.notify('New Tactical Event Detected', 'info');
        }
    }

    private handleUpdate(payload: any) {
        this.all = this.all.map(i => i.id === payload.new.id ? (payload.new as Incident) : i);
    }

    private handleDelete(payload: any) {
        this.all = this.all.filter(i => i.id !== payload.old.id);
    }

    select(id: string | null) {
        this.selectedId = id;
    }

    setDomain(domain: string | null) {
        this.filterDomain = domain;
    }

    setMissionId(id: string | null) {
        this.filterMissionId = id;
    }

    // Cleanup method for proper resource management
    destroy() {
        if (this.realtimeSub) {
            this.realtimeSub.unsubscribe();
            this.realtimeSub = null;
        }
    }
}

export const incidentStore = new IncidentStore();
