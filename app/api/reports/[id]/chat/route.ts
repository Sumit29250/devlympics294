import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { ok, fail } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';
import { AppendChatMessageSchema } from '@/lib/supabaseSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
      return fail('UNAUTHORIZED', 'You must be signed in to append chat messages.', 401);
    }

    const reportId = params.id;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('INVALID_JSON', 'Request body must be valid JSON.', 400);
    }

    const parsed = AppendChatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return fail('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid chat message', 400);
    }

    // Insert message into chat_messages
    const { data: inserted, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        report_id: reportId,
        user_id: user.id,
        role: parsed.data.role,
        content: parsed.data.content.trim(),
      })
      .select('id, role, content, created_at')
      .single();

    if (insertError) {
      console.error('[API /api/reports/[id]/chat POST] Insert error:', insertError.message);
      return fail('INSERT_FAILED', 'Could not save chat message to report history.', 500);
    }

    return ok({ message: inserted });
  } catch (err: unknown) {
    console.error('[API /api/reports/[id]/chat POST] Error:', err);
    return fail('INTERNAL_ERROR', 'Failed to append chat message.', 500);
  }
}
