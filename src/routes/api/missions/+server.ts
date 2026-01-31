import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { generateMissionStrategy } from '$lib/server/strategy';

/**
 * Mission API: Manage tactical objectives.
 */
export async function GET() {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ missions: data });
}

export async function POST({ request }: { request: Request }) {
  try {
    const { goal } = await request.json();
    if (!goal) return json({ error: 'Goal required' }, { status: 400 });

    // 1. Generate AI Strategy
    const strategy = await generateMissionStrategy(goal);

    // 2. Persist Mission
    const { data, error } = await supabase
      .from('missions')
      .insert({
        name: strategy.codename,
        goal,
        keywords: strategy.keywords,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return json({ success: true, mission: data });

  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH({ request }: { request: Request }) {
  try {
    const { id, status } = await request.json();
    const { error } = await supabase
      .from('missions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
    return json({ success: true });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
