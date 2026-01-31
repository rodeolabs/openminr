import { GROK_API_KEY } from '$env/static/private';

export interface MissionStrategy {
  codename: string;
  keywords: string[];
}

/**
 * Strategy Agent: Translates a natural language goal into a tactical mission.
 * Uses Grok's reasoning to generate effective search terms and a distinct codename.
 */
export async function generateMissionStrategy(goal: string): Promise<MissionStrategy> {
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
          content: 'You are a senior intelligence officer. Translate a tactical objective into a mission strategy.'
        },
        {
          role: 'user',
          content: `OBJECTIVE: ${goal}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'mission_strategy',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              codename: { 
                type: 'string', 
                description: 'A 2-word uppercase military-style codename (e.g. BALTIC-SHIELD, CORAL-STORM).' 
              },
              keywords: {
                type: 'array',
                items: { type: 'string' },
                description: '5-8 highly specific keywords or phrases for searching X.com. Use a mix of broad and narrow terms.'
              }
            },
            required: ['codename', 'keywords'],
            additionalProperties: false
          }
        }
      }
    })
  });

  if (!response.ok) throw new Error(`Strategy generation failed: ${response.statusText}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
