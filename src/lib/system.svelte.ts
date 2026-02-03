import { browser } from '$app/environment';
import { generateShortId } from './utils/id';
import { incidentStore } from './incidents.svelte';

/**
 * Tactical System Store (Svelte 5)
 * Handles global system states like Autopilot, Notifications, and Status.
 * 
 * Optimized to prevent SSR errors by checking for the 'browser' environment
 * before executing network calls.
 */
class TacticalSystem {
  isOnline = $state(false);
  isSyncing = $state(false);
  lastSync = $state<Date | null>(null);
  notifications = $state<Array<{id: string, message: string, type: 'info' | 'warn' | 'error'}>>([]);

  constructor() {
    // Only fetch initial status if running in the browser to avoid SSR relative URL errors.
    if (browser) {
      this.fetchStatus();
    }
  }

  async fetchStatus() {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      this.isOnline = data.enabled;
      
      // Subscribe/unsubscribe based on initial state
      this.updateSubscription();
    } catch (e) {
      console.error('[SYSTEM] Failed to fetch initial status', e);
    }
  }

  // Update realtime subscription based on online state
  private updateSubscription() {
    if (this.isOnline) {
      incidentStore.subscribe();
    } else {
      incidentStore.unsubscribe();
      // Note: We don't clear incidents - user can still view existing data offline
    }
  }

  async toggleSystem() {
    const newState = !this.isOnline;
    this.isOnline = newState;
    
    // Update subscription immediately
    this.updateSubscription();
    
    // Optimistic UI update followed by persistence
    await fetch('/api/system/status', { 
      method: 'POST', 
      body: JSON.stringify({ enabled: newState }) 
    });
    
    this.notify(`System ${newState ? 'Activated' : 'Paused'}`, 'info');
  }

  /**
   * Pushes a temporary notification to the tactical overlay.
   * Uses cryptographically secure ID generation (not Math.random)
   */
  notify(message: string, type: 'info' | 'warn' | 'error' = 'info') {
    const id = generateShortId();
    this.notifications.push({ id, message, type });
    
    // Automatically prune notifications after 5 seconds to keep the UI clean.
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
    }, 5000);
  }

  /**
   * Triggers a manual or automatic intelligence sync.
   * force=true bypasses the server-side 60s cooldown.
   * Uses the public /api/sync endpoint (no secret required, session-based auth).
   */
  async triggerSync(force = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    
    try {
      // Use the public sync endpoint instead of the cron endpoint
      const res = await fetch(`/api/sync${force ? '?force=true' : ''}`);
      const data = await res.json();
      
      if (data.success) {
        this.lastSync = new Date();
        const newCount = data.results?.grok_live?.new_incidents || 0;
        if (newCount > 0) {
          this.notify(`Acquired ${newCount} new tactical events`, 'info');
        }
      }
    } catch (e) {
      console.error('[SYSTEM] Sync failed', e);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const system = new TacticalSystem();
