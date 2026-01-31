import { supabase } from './client';

export type RealtimeCallback = (payload: any) => void;

/**
 * Encapsulates the Supabase Realtime subscription logic.
 * This makes the frontend components cleaner and focuses them on UI.
 */
export function subscribeToIncidents(onInsert: RealtimeCallback, onUpdate: RealtimeCallback) {
  const channel = supabase.channel('tactical_feed');

  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, onInsert)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'incidents' }, onUpdate)
    .subscribe((status) => {
      console.log('REALTIME_SUBSCRIPTION_STATUS:', status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
