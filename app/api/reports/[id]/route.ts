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
  const startTime = Date.now();

  try {
    const rateLimit = checkRateLimit(request, 40, 60000);
    if (!rateLimit.allowed) {
      return fail('RATE_LIMIT_EXCEEDED', 'Too many requests, please wait a minute.', 429);
    }

    if (!isSupabaseConfigured()) {
      return fail('SUPABASE_NOT_CONFIGURED', 'Accounts and saved reports are currently disabled in guest mode.', 503);
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
      return fail('UNAUTHORIZED', 'You must be signed in to view this report.', 401);
    }

    const reportId = params.id;
    if (!reportId) {
      return fail('INVALID_ID', 'Report ID is required.', 400);
    }

    // 1. Fetch report details
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report) {
      return fail('NOT_FOUND', 'Report not found.', 404);
    }

    // 2. Fetch tests
    const { data: tests, error: testsError } = await supabase
      .from('report_tests')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (testsError) {
      console.error('[API /api/reports/[id] GET] Tests error:', testsError.message);
      return fail('FETCH_FAILED', 'Could not fetch report test entries.', 500);
    }

    // 3. Fetch chat history
    const { data: chatMessages, error: chatError } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('report_id', reportId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (chatError) {
      console.warn('[API /api/reports/[id] GET] Chat error:', chatError.message);
    }

    const duration = Date.now() - startTime;
    console.log(`[API /api/reports/[id] GET] Success: 200, report_id: ${reportId}, duration: ${duration}ms`);

    return ok({
      report,
      tests: tests || [],
      chat_messages: chatMessages || [],
    });
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[API /api/reports/[id] GET] Error: duration ${duration}ms`, err);
    return fail('INTERNAL_ERROR', 'Failed to retrieve report detail.', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();

  try {
    const rateLimit = checkRateLimit(request, 20, 60000);
    if (!rateLimit.allowed) {
      return fail('RATE_LIMIT_EXCEEDED', 'Too many requests, please wait a minute.', 429);
    }

    if (!isSupabaseConfigured()) {
      return fail('SUPABASE_NOT_CONFIGURED', 'Accounts and saved reports are currently disabled in guest mode.', 503);
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
      return fail('UNAUTHORIZED', 'You must be signed in to delete a report.', 401);
    }

    const reportId = params.id;
    if (!reportId) {
      return fail('INVALID_ID', 'Report ID is required.', 400);
    }

    // Find report to remove associated storage file if any
    const { data: report } = await supabase
      .from('reports')
      .select('id, file_path')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (report?.file_path) {
      try {
        await supabase.storage.from('report-files').remove([report.file_path]);
      } catch (storageErr) {
        console.warn('[API /api/reports/[id] DELETE] Storage cleanup warning:', storageErr);
      }
    }

    // Delete row (cascades to report_tests and chat_messages via ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[API /api/reports/[id] DELETE] Delete error:', deleteError.message);
      return fail('DELETE_FAILED', 'Failed to delete report.', 500);
    }

    const duration = Date.now() - startTime;
    console.log(`[API /api/reports/[id] DELETE] Success: 200, report_id: ${reportId}, duration: ${duration}ms`);

    return ok({ message: 'Report deleted successfully' });
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[API /api/reports/[id] DELETE] Error: duration ${duration}ms`, err);
    return fail('INTERNAL_ERROR', 'Failed to delete report.', 500);
  }
}
