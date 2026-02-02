import type { Handle } from '@sveltejs/kit';

/**
 * Security Headers Handler
 * Adds essential security headers to all responses
 */
export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	
	// Security Headers
	const headers = {
		// Prevent MIME type sniffing
		'X-Content-Type-Options': 'nosniff',
		
		// Prevent clickjacking
		'X-Frame-Options': 'DENY',
		
		// XSS Protection
		'X-XSS-Protection': '1; mode=block',
		
		// Referrer Policy
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		
		// Permissions Policy
		'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
		
		// Content Security Policy (CSP)
		// Allows: Self, Supabase, CartoDB Maps, WebSocket, Workers, XAI API
		'Content-Security-Policy': [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob: https://*.cartocdn.com https://*.basemaps.cartocdn.com",
			"font-src 'self' data:",
			"connect-src 'self' http://localhost:54321 https://localhost:54321 ws://localhost:54321 wss://localhost:54321 https://*.supabase.co wss://*.supabase.co https://api.x.ai https://*.cartocdn.com https://*.basemaps.cartocdn.com",
			"worker-src 'self' blob:",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; ')
	};
	
	// Apply headers
	Object.entries(headers).forEach(([key, value]) => {
		response.headers.set(key, value);
	});
	
	return response;
};