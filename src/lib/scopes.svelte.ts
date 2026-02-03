import { supabase } from '$lib/supabase/client';
import { system } from '$lib/system.svelte';
import type { Mission } from '$lib/types';
import { browser } from '$app/environment';

class ScopeStore {
    all = $state<Mission[]>([]);
    isLoading = $state(false);

    constructor() {
        if (browser) {
            this.load();
        }
    }

    async load() {
        this.isLoading = true;
        try {
            const { data } = await supabase
                .from('missions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (data) {
                this.all = data;
            }
        } catch (e) {
            console.error('Failed to load scopes', e);
        } finally {
            this.isLoading = false;
        }
    }

    async create(goal: string) {
        if (!goal.trim()) return false;
        
        try {
            const res = await fetch('/api/missions', {
                method: 'POST',
                body: JSON.stringify({ goal })
            });
            const data = await res.json();
            if (data.success) {
                system.notify('Operational Scope Initialized', 'info');
                await this.load(); // Reload to get the new scope
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to create scope', e);
            system.notify('Failed to create operational scope', 'error');
            return false;
        }
    }

    async toggle(scope: Mission) {
        const newStatus: Mission['status'] = scope.status === 'active' ? 'paused' : 'active';
        const index = this.all.findIndex(s => s.id === scope.id);
        
        // Optimistic update
        if (index !== -1) {
            const updated = { ...this.all[index], status: newStatus };
            this.all[index] = updated; // Trigger reactivity
        }

        const { error } = await supabase
            .from('missions')
            .update({ status: newStatus })
            .eq('id', scope.id);

        if (error) {
            console.error('Failed to toggle scope:', error);
            // Revert
            if (index !== -1) {
                this.all[index] = { ...this.all[index], status: scope.status };
            }
            system.notify('Failed to update status', 'error');
        }
    }

    async delete(id: string) {
        if (!confirm('CONFIRM DELETION: Remove operational scope?')) return;
        
        const previous = [...this.all];
        this.all = this.all.filter(s => s.id !== id);

        const { error } = await supabase
            .from('missions')
            .delete()
            .eq('id', id);
        
        if (error) {
            this.all = previous; // Revert
            system.notify('Failed to delete scope', 'error');
        }
    }

    async update(id: string, updates: { keywords?: string[], goal?: string }) {
        const index = this.all.findIndex(s => s.id === id);
        if (index === -1) return false;

        // Optimistic update
        const previous = { ...this.all[index] };
        this.all[index] = { ...this.all[index], ...updates };

        try {
            const res = await fetch('/api/missions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates })
            });
            const data = await res.json();
            
            if (!data.success) {
                throw new Error(data.error);
            }
            
            system.notify('Scope updated successfully', 'info');
            return true;
        } catch (e) {
            console.error('Failed to update scope:', e);
            this.all[index] = previous; // Revert
            system.notify('Failed to update scope', 'error');
            return false;
        }
    }

    async regenerate(id: string, goal: string) {
        try {
            const res = await fetch('/api/missions/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, goal })
            });
            const data = await res.json();
            
            if (!data.success) {
                throw new Error(data.error);
            }
            
            // Reload to get updated keywords
            await this.load();
            system.notify('Strategy regenerated successfully', 'info');
            return true;
        } catch (e) {
            console.error('Failed to regenerate strategy:', e);
            system.notify('Failed to regenerate strategy', 'error');
            return false;
        }
    }
}

export const scopeStore = new ScopeStore();
