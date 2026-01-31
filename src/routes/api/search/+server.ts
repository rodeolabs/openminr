import { json } from '@sveltejs/kit';
import { GROK_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase/client';

export async function POST({ request }: { request: Request }) {
  try {
    const { query } = await request.json();

    const { data: recent } = await supabase.from('incidents').select('id, title, description')
      .order('created_at', { ascending: false }).limit(50);

    if (!recent?.length) return json({ results: [] });

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
        messages: [
          {
            role: 'system',
            content: 'Rank these incident IDs by their relevance to the tactical query: ' + query
          },
          {
            role: 'user',
            content: JSON.stringify(recent)
          }
        ],
        // Structured Output: Guarantees we get a clean array of UUIDs back.
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'search_results',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                relevant_ids: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['relevant_ids'],
              additionalProperties: false
            }
          }
        }
      })
    });

    if (!response.ok) throw new Error(`Search failed: ${response.statusText}`);
    const data = await response.json();
    const rankedIds = JSON.parse(data.choices[0].message.content).relevant_ids || [];

    const { data: results } = await supabase.from('incidents').select('*').in('id', rankedIds);

    return json({ success: true, results: results || [] });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
