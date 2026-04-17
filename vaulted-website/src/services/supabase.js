import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'configured' : 'missing')
console.log('Supabase Anon Key:', supabaseAnonKey ? 'configured' : 'missing')
console.log('Full URL:', supabaseUrl)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Test connectivity by fetching the Supabase health endpoint
async function testSupabaseConnectivity() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    console.log('Supabase connectivity test:', response.status === 400 || response.status === 401 || response.status === 406 ? 'OK (server responded)' : `Status: ${response.status}`);
    return response.ok || response.status === 400 || response.status === 401 || response.status === 406;
  } catch (error) {
    console.error('Supabase connectivity test FAILED:', error.message);
    console.error('This usually means:');
    console.error('1. The Supabase project URL is incorrect');
    console.error('2. The Supabase project is paused or down');
    console.error('3. A firewall/network is blocking the connection');
    console.error('4. CORS is blocking the request');
    return false;
  }
}

// Run connectivity test
testSupabaseConnectivity();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
