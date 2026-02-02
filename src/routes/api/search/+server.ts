import { json } from '@sveltejs/kit';
import { GROK_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase/client';
import { rateLimiter } from '$lib/server/rateLimiter';

/**
 * AI-powered incident search
 * Uses lightweight incident summaries to minimize token usage and cost
 * Rate limited to prevent API abuse and control costs
 */
export async function POST({ request, getClientAddress }: { request: Request; getClientAddress: () => string }) {
  const clientIp = getClientAddress();
  
  // Rate limiting: 5 searches per minute per IP (AI calls are expensive)
  const rateLimit = rateLimiter.check(clientIp, 5, 60 * 1000);
  if (!rateLimit.allowed) {
    return json({
      success: false,
      error: 'Search rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    }, { status: 429 });
  }
  
  const startTime = Date.now();
  
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return json({ 
        success: false, 
        error: 'Query parameter is required and must be a string' 
      }, { status: 400 });
    }

    // Fetch recent incidents - limited to 20 for cost efficiency
    const { data: recent, error: dbError } = await supabase
      .from('incidents')
      .select('id, title, category, severity, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (dbError) {
      console.error('[API/SEARCH] Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!recent?.length) {
      return json({ success: true, results: [], total: 0, aiRanked: 0 });
    }

    // Create lightweight summaries for AI ranking (minimize tokens)
    const incidentSummaries = recent.map(i => ({
      id: i.id,
      title: i.title,
      category: i.category,
      severity: i.severity
    }));

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
            content: `Rank incident IDs by relevance to: "${query}". Return IDs in order of relevance. Be concise.`
          },
          {
            role: 'user',
            content: JSON.stringify(incidentSummaries)
          }
        ],
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

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }
    
    const aiData = await response.json();
    const rankedIds = JSON.parse(aiData.choices[0].message.content).relevant_ids || [];

    // Fetch full incident details for ranked results
    const { data: results, error: resultsError } = await supabase
      .from('incidents')
      .select('*')
      .in('id', rankedIds);

    if (resultsError) {
      throw new Error(`Database error fetching results: ${resultsError.message}`);
    }

    const duration = Date.now() - startTime;
    
    console.log(`[API/SEARCH] Query completed in ${duration}ms:`, {
      query: query.substring(0, 50),
      totalIncidents: recent.length,
      aiRanked: rankedIds.length,
      returned: results?.length || 0
    });

    return json({ 
      success: true, 
      results: results || [],
      meta: {
        totalScanned: recent.length,
        aiRanked: rankedIds.length,
        returned: results?.length || 0,
        duration: `${duration}ms`
      }
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error('[API/SEARCH] Search failed:', {
      error: error.message,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
