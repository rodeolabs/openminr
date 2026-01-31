import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Dynamically determine the Supabase URL based on the runtime environment
// to support local development, Docker containers, and browser clients seamlessly.
const getSupabaseUrl = () => {
  if (!browser) return 'http://127.0.0.1:54321';
  
  const host = window.location.hostname;
  console.log('Detecting host:', host);
  
  if (host === 'host.docker.internal') return 'http://host.docker.internal:54321';
  if (host === 'localhost') return 'http://localhost:54321';
  return 'http://127.0.0.1:54321';
};

const supabaseUrl = getSupabaseUrl();
console.log('SUPABASE_CLIENT_URL:', supabaseUrl);

const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; 

export const supabase = createClient(supabaseUrl, supabaseKey);
