import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured, getSupabaseEnv } from './config';

export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
