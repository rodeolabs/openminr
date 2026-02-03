import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { rateLimiter } from '$lib/server/rateLimiter';

/**
 * Standardized Database Search
 * Searches title, description, and tactical_summary
 */
export async function POST({ request, getClientAddress }: { request: Request; getClientAddress: () => string }) {
  const clientIp = getClientAddress();
  
  // Rate limiting: 20 searches per minute (Database only, so higher limit allowed)
  const rateLimit = rateLimiter.check(clientIp, 20, 60 * 1000);
  if (!rateLimit.allowed) {
    return json({
      success: false,
      error: 'Search rate limit exceeded.',
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    }, { status: 429 });
  }
  
  const startTime = Date.now();
  
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return json({ 
        success: false, 
        error: 'Query parameter is required' 
      }, { status: 400 });
    }

    // Perform database search using OR logic for multiple fields
    // Note: This is a simple ILIKE search. For larger datasets, Full Text Search (tsvector) is recommended.
    const { data: results, error } = await supabase
      .from('incidents')
      .select('*, intel_reports(*)')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[API/SEARCH] Database error:', error);
      throw new Error(error.message);
    }

    const duration = Date.now() - startTime;
    
    return json({ 
      success: true, 
      results: results || [],
      meta: {
        count: results?.length || 0,
        duration: `${duration}ms`
      }
    });
    
  } catch (error: any) {
    console.error('[API/SEARCH] Search failed:', error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
