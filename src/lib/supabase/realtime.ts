import { supabase } from './client';

export type RealtimeCallback = (payload: any) => void;

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

/**
 * Encapsulates the Supabase Realtime subscription logic.
 * This makes the frontend components cleaner and focuses them on UI.
 * 
 * @returns Unsubscribe function to clean up the subscription
 */
export function subscribeToIncidents(
  onInsert: RealtimeCallback,
  onUpdate: RealtimeCallback,
  onDelete?: RealtimeCallback
): RealtimeSubscription {
  const channel = supabase.channel('tactical_feed');

  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, onInsert)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'incidents' }, onUpdate);
  
  if (onDelete) {
    channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'incidents' }, onDelete);
  }
  
  channel.subscribe((status) => {
    console.log('[REALTIME] Subscription status:', status);
  });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
      console.log('[REALTIME] Unsubscribed from incidents');
    }
  };
}
