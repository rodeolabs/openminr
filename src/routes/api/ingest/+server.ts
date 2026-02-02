import { json } from '@sveltejs/kit';
import crypto from 'crypto';
import { analyzeIncident } from '$lib/server/grok';
import { persistIncident } from '$lib/server/ingestion/persistence';
import { rateLimiter } from '$lib/server/rateLimiter';
import { CONFIG } from '$lib/config';

/**
 * Manual incident ingestion endpoint
 * Generates content-based hash for deduplication instead of timestamp-based
 * Rate limited to prevent abuse
 */
export async function POST({ request, getClientAddress }: { request: Request; getClientAddress: () => string }) {
  const requestId = crypto.randomUUID();
  const clientIp = getClientAddress();
  
  // Rate limiting: 10 requests per minute per IP
  const rateLimit = rateLimiter.check(clientIp, 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      requestId,
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    }, { status: 429 });
  }
  
  try {
    const { content, source, lat, lon } = await request.json();
    
    if (!content || !source) {
      return json({ 
        success: false, 
        error: 'Missing required fields: content and source are required' 
      }, { status: 400 });
    }

    const analysis = await analyzeIncident(content);

    // Generate content-based hash for proper deduplication
    // Uses normalized content hash instead of timestamp
    const normalizedContent = `${source}:${content.toLowerCase().trim()}`;
    const contentHash = crypto.createHash('sha256').update(normalizedContent).digest('hex').slice(0, 16);
    const sourceHash = `manual:${contentHash}`;

    const result = await persistIncident(
      {
        title: analysis.headline,
        description: analysis.tactical_summary,
        severity: analysis.severity,
        category: analysis.category,
        lat,
        lon,
        confidence: analysis.confidence_score,
        source_hash: sourceHash
      },
      [{ source, content }]
    );

    return json({ 
      success: true, 
      incident: result.incident,
      duplicate: result.duplicate,
      requestId 
    });

  } catch (error: any) {
    console.error(`[API/INGEST] Request ${requestId} failed:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return json({ 
      success: false, 
      error: error.message,
      requestId 
    }, { status: 500 });
  }
}
