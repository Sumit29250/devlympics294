import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { ok, fail } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimit = checkRateLimit(request, 30, 60000);
    if (!rateLimit.allowed) {
      return fail('RATE_LIMIT_EXCEEDED', 'Too many requests, please wait a minute.', 429);
    }

    if (!isSupabaseConfigured()) {
      return fail('SUPABASE_NOT_CONFIGURED', 'Accounts are currently disabled in guest mode.', 503);
    }

    const supabase = createClient();
    if (!supabase) {
      return fail('SUPABASE_ERROR', 'Could not initialize database client.', 500);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return fail('UNAUTHORIZED', 'You must be signed in to view original report files.', 401);
    }

    const reportId = params.id;
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('file_path')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report || !report.file_path) {
      return fail('NOT_FOUND', 'Original document not found for this report.', 404);
    }

    // Generate 60-second signed URL
    const { data: signedData, error: signError } = await supabase.storage
      .from('report-files')
      .createSignedUrl(report.file_path, 60);

    if (signError || !signedData?.signedUrl) {
      console.error('[API /api/reports/[id]/file GET] Signed URL error:', signError?.message);
      return fail('STORAGE_ERROR', 'Could not generate secure file URL.', 500);
    }

    return ok({ signedUrl: signedData.signedUrl });
  } catch (err: unknown) {
    console.error('[API /api/reports/[id]/file GET] Error:', err);
    return fail('INTERNAL_ERROR', 'Failed to retrieve file URL.', 500);
  }
}
