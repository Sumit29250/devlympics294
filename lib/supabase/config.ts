/**
 * Supabase configuration helper
 * Checks if Supabase credentials are configured or in guest-only mode.
 */

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return false;
  }

  // Check for placeholder values
  if (
    url === 'YOUR_SUPABASE_PROJECT_URL' ||
    url.includes('example.supabase.co') ||
    anonKey === 'YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY' ||
    anonKey === 'your_anon_key_here'
  ) {
    return false;
  }

  return true;
}

export function isSupabaseAdminConfigured(): boolean {
  if (!isSupabaseConfigured()) return false;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey || serviceKey === 'YOUR_SERVICE_ROLE_KEY' || serviceKey === 'your_service_role_key_here') {
    return false;
  }
  return true;
}

export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
}
