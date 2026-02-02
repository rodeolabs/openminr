import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Dynamically determine the Supabase URL based on the runtime environment
// to support local development, Docker containers, and browser clients seamlessly.
const getSupabaseUrl = () => {
  if (!browser) return 'http://127.0.0.1:54321';
  
  const host = window.location.hostname;
  console.log('Detecting host:', host);
  
  // If we are on a specific IP, use that IP for Supabase as well
  if (host !== 'localhost' && host !== '127.0.0.1' && !host.includes('host.docker.internal')) {
    return `http://${host}:54321`;
  }
  
  if (host === 'host.docker.internal') return 'http://host.docker.internal:54321';
  return 'http://localhost:54321';
};

const supabaseUrl = getSupabaseUrl();
console.log('SUPABASE_CLIENT_URL:', supabaseUrl);

// Use environment variable for Supabase key
// CRITICAL: No hardcoded fallbacks allowed per AGENTS.md policy
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseKey && browser) {
  throw new Error(
    '[SECURITY VIOLATION] VITE_SUPABASE_KEY environment variable is required. ' +
    'Hardcoded credentials are strictly prohibited per AGENTS.md. ' +
    'Set the key in your .env.local file or deployment environment.'
  );
}

// For SSR, use a dummy key (server-side operations should use service role key)
const clientKey = supabaseKey || 'dummy-key-for-ssr-only';

export const supabase = createClient(supabaseUrl, clientKey);
