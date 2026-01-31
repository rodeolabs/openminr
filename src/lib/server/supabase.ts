import { createClient } from '@supabase/supabase-js';
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabaseUrl = 'http://127.0.0.1:54321';

/**
 * Service Role Client
 * ONLY for use in +server.ts files. Bypasses Row Level Security.
 */
export const supabaseAdmin = createClient(supabaseUrl, PRIVATE_SUPABASE_SERVICE_ROLE_KEY);
