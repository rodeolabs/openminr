import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';

export async function GET() {
  const { data } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'ingestion_status')
    .single();
    
  return json(data?.value || { enabled: false });
}

export async function POST({ request }: { request: Request }) {
  const { enabled } = await request.json();
  
  // Persist the system state (ON/OFF) to the database.
  // This allows the state to persist across server restarts and be shared across multiple instances.
  const { error } = await supabase
    .from('system_config')
    .upsert({ 
        key: 'ingestion_status', 
        value: { enabled },
        updated_at: new Date().toISOString()
    });
  
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ success: true, enabled });
}
