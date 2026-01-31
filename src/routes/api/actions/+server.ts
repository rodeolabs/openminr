import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';

/**
 * Leaner Action API using dynamic status updates.
 */
export async function POST({ request }: { request: Request }) {
  try {
    const { incident_id, action, analyst_id, reason, summary, note, note_type } = await request.json();
    const now = new Date().toISOString();

    if (action === 'add_note') {
      const { data, error } = await supabase.from('analyst_notes').insert({ 
        incident_id, analyst_id, content: note, note_type: note_type || 'observation' 
      }).select().single();
      if (error) throw error;
      return json({ success: true, note: data });
    }

    // Mapping actions to their respective database updates
    const actionMap: Record<string, any> = {
      claim: { status: 'claimed', claimed_by: analyst_id, claimed_at: now },
      unclaim: { status: 'active', claimed_by: null, claimed_at: null },
      escalate: { status: 'escalated', escalated_by: analyst_id, escalated_at: now, escalation_reason: reason },
      resolve: { status: 'resolved', resolved_by: analyst_id, resolved_at: now, resolution_summary: summary },
      dismiss: { status: 'dismissed', resolved_by: analyst_id, resolved_at: now, resolution_summary: reason || 'Not actionable' }
    };

    const updateData = actionMap[action];
    if (!updateData) return json({ error: `Invalid action: ${action}` }, { status: 400 });

    const { error } = await supabase.from('incidents')
      .update({ ...updateData, updated_at: now })
      .eq('id', incident_id);

    if (error) throw error;
    return json({ success: true, action });

  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET({ url }: { url: URL }) {
  const incident_id = url.searchParams.get('incident_id');
  const { data: notes, error } = await supabase.from('analyst_notes')
    .select('*').eq('incident_id', incident_id).order('created_at', { ascending: false });
  return error ? json({ error: error.message }, { status: 500 }) : json({ notes });
}
