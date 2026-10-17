import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { ok, fail } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';
import { DeleteAccountSchema } from '@/lib/supabaseSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  const startTime = Date.now();

  try {
    const rateLimit = checkRateLimit(request, 10, 60000);
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
      return fail('UNAUTHORIZED', 'You must be signed in to delete your account.', 401);
    }

    // Parse and validate typed confirmation "DELETE"
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('INVALID_JSON', 'Request body must be valid JSON.', 400);
    }

    const parsed = DeleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return fail('CONFIRMATION_REQUIRED', 'Please type DELETE in uppercase to confirm account deletion.', 400);
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return fail(
        'ADMIN_NOT_CONFIGURED',
        'Service role key is not configured on the server. Please contact support.',
        500
      );
    }

    // 1. Delete all storage files under {user_id}/ folder in report-files bucket
    try {
      const { data: fileList } = await adminClient.storage
        .from('report-files')
        .list(user.id);

      if (fileList && fileList.length > 0) {
        // Collect files in subfolders (e.g. {user_id}/{report_id}/...)
        const filesToDelete: string[] = [];
        for (const item of fileList) {
          if (item.id) {
            filesToDelete.push(`${user.id}/${item.name}`);
          } else {
            // It's a folder, list contents
            const { data: subFiles } = await adminClient.storage
              .from('report-files')
              .list(`${user.id}/${item.name}`);
            if (subFiles) {
              subFiles.forEach((sub) => filesToDelete.push(`${user.id}/${item.name}/${sub.name}`));
            }
          }
        }

        if (filesToDelete.length > 0) {
          await adminClient.storage.from('report-files').remove(filesToDelete);
        }
      }
    } catch (storageCleanupErr) {
      console.warn('[API /api/account DELETE] Storage files cleanup warning:', storageCleanupErr);
    }

    // 2. Delete the user from auth.users (Cascades to profiles, reports, report_tests, chat_messages)
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error('[API /api/account DELETE] Error deleting auth user:', deleteUserError.message);
      return fail('ACCOUNT_DELETION_FAILED', 'Could not delete user account.', 500);
    }

    // 3. Clear auth cookies / sign out
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    const duration = Date.now() - startTime;
    console.log(`[API /api/account DELETE] User ${user.id} account and all data deleted: duration ${duration}ms`);

    return ok({ message: 'Your account and all associated lab reports have been permanently deleted.' });
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[API /api/account DELETE] Error: duration ${duration}ms`, err);
    return fail('INTERNAL_ERROR', 'Failed to delete account.', 500);
  }
}
