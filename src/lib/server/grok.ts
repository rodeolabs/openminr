import { GROK_API_KEY } from '$env/static/private';

export async function analyzeIncident(content: string) {
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
          content: 'You are a tactical intelligence analyst. Extract incident data from the provided report. Create a concise, high-impact headline (max 60 chars).'
        },
        { role: 'user', content }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'incident_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              headline: { type: 'string' },
              category: { 
                type: 'string', 
                enum: ['Force Protection', 'Diplomatic Security', 'Infrastructure', 'Natural Disaster', 'Law Enforcement', 'Civil Unrest', 'Cyber', 'Military']
              },
              severity: { type: 'integer', minimum: 1, maximum: 5 },
              tactical_summary: { type: 'string' },
              confidence_score: { type: 'number' }
            },
            required: ['headline', 'category', 'severity', 'tactical_summary', 'confidence_score'],
            additionalProperties: false
          }
        }
      }
    })
  });

  if (!response.ok) throw new Error(`Grok Analysis failed: ${response.statusText}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
