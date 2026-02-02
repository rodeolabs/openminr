import { GROK_API_KEY } from '$env/static/private';

export interface MissionStrategy {
  codename: string;
  keywords: string[];
}

/**
 * Generates a fallback codename from the goal
 */
function generateFallbackCodename(goal: string): string {
  const words = goal.toUpperCase().split(/\s+/).filter(w => w.length > 3).slice(0, 2);
  if (words.length >= 2) {
    return `${words[0]}-${words[1]}`;
  }
  return `MISSION-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Extracts keywords from the goal as fallback
 */
function generateFallbackKeywords(goal: string): string[] {
  const commonWords = new Set(['THE', 'AND', 'FOR', 'ARE', 'WITH', 'THIS', 'FROM', 'THAT']);
  const words = goal.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !commonWords.has(w.toUpperCase()));
  
  // Return unique keywords, max 8
  return [...new Set(words)].slice(0, 8);
}

/**
 * Strategy Agent: Translates a natural language goal into a tactical mission.
 * Uses Grok's reasoning to generate effective search terms and a distinct codename.
 * Falls back to local generation if AI fails.
 */
export async function generateMissionStrategy(goal: string): Promise<MissionStrategy> {
  // Check if API key is configured
  if (!GROK_API_KEY || GROK_API_KEY === 'xai-YOUR_GROK_API_KEY_HERE') {
    console.log('[STRATEGY] No API key, using fallback generation');
    return {
      codename: generateFallbackCodename(goal),
      keywords: generateFallbackKeywords(goal)
    };
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
        body: JSON.stringify({
        model: 'grok-4-fast',
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

    if (!response.ok) {
      console.error(`[STRATEGY] API error: ${response.status} ${response.statusText}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('[STRATEGY] AI generation failed, using fallback:', error);
    // Fallback to local generation
    return {
      codename: generateFallbackCodename(goal),
      keywords: generateFallbackKeywords(goal)
    };
  }
}
