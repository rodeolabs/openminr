import { json } from '@sveltejs/kit';
import { analyzeIncident } from '$lib/server/grok';
import { persistIncident } from '$lib/server/ingestion/persistence';

export async function POST({ request }: { request: Request }) {
  try {
    const { content, source, lat, lon } = await request.json();
    const analysis = await analyzeIncident(content);

    const result = await persistIncident(
      {
        title: analysis.headline,
        description: analysis.tactical_summary,
        severity: analysis.severity,
        category: analysis.category,
        lat,
        lon,
        confidence: analysis.confidence_score,
        source_hash: `manual:${Date.now()}`
      },
      [{ source, content }]
    );

    return json({ success: true, incident: result.incident });

  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
