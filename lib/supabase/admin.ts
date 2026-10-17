import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { isSupabaseAdminConfigured } from './config';

let adminClientInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function getAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  if (!adminClientInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();

    adminClientInstance = createSupabaseClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClientInstance;
}
