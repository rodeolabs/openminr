import { browser } from '$app/environment';
import { supabase } from '$lib/supabase/client';
import { system } from './system.svelte';
import type { Incident } from '$lib/types';

class IncidentStore {
    // Core State
    all = $state<Incident[]>([]);
    selectedId = $state<string | null>(null);
    filterDomain = $state<string | null>(null); 
    filterMissionId = $state<string | null>(null);

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
        const { data } = await supabase
            .from('incidents')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (data) this.all = data as Incident[];

        supabase
            .channel('tactical-incidents')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
                this.handleRealtime(payload);
            })
            .subscribe();
    }

    handleRealtime(payload: any) {
        if (payload.eventType === 'INSERT') {
            this.all = [payload.new as Incident, ...this.all];
            system.notify('New Tactical Event Detected', 'info');
        } else if (payload.eventType === 'UPDATE') {
            this.all = this.all.map(i => i.id === payload.new.id ? (payload.new as Incident) : i);
        } else if (payload.eventType === 'DELETE') {
            this.all = this.all.filter(i => i.id !== payload.old.id);
        }
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
}

export const incidentStore = new IncidentStore();
