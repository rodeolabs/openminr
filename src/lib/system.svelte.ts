import { browser } from '$app/environment';

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
    } catch (e) {
      console.error('[SYSTEM] Failed to fetch initial status', e);
    }
  }

  async toggleSystem() {
    const newState = !this.isOnline;
    this.isOnline = newState;
    
    // Optimistic UI update followed by persistence
    await fetch('/api/system/status', { 
      method: 'POST', 
      body: JSON.stringify({ enabled: newState }) 
    });
    
    this.notify(`System ${newState ? 'Activated' : 'Paused'}`, 'info');
  }

  /**
   * Pushes a temporary notification to the tactical overlay.
   */
  notify(message: string, type: 'info' | 'warn' | 'error' = 'info') {
    const id = crypto.randomUUID();
    this.notifications.push({ id, message, type });
    
    // Automatically prune notifications after 5 seconds to keep the UI clean.
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
    }, 5000);
  }

  /**
   * Triggers a manual or automatic intelligence sync.
   * force=true bypasses the server-side 60s cooldown.
   */
  async triggerSync(force = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    
    try {
      const res = await fetch(`/api/cron/ingest?secret=tactical-ingest-2026${force ? '&force=true' : ''}`);
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
