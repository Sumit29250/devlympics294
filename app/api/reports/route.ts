import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { ok, fail } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';
import { SaveReportRequestSchema } from '@/lib/supabaseSchemas';
import { parseNumericValue } from '@/lib/status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
      return fail('UNAUTHORIZED', 'You must be signed in to view saved reports.', 401);
    }

    // Query saved reports with test details for history and trends
    const { data: reports, error: fetchError } = await supabase
      .from('reports')
      .select('id, title, patient_name, lab_name, report_date, language, overall_summary, file_path, created_at, report_tests(test_name, normalized_name, numeric_value, value, unit, reference_range, status)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[API /api/reports GET] Error fetching reports:', fetchError.message);
      return fail('FETCH_FAILED', 'Could not fetch saved reports.', 500);
    }

    // Process summary badge counts for each report
    const formattedReports = (reports || []).map((r) => {
      const tests = Array.isArray(r.report_tests) ? r.report_tests : [];
      const total = tests.length;
      const normal = tests.filter((t: { status: string }) => t.status === 'normal').length;
      const needsAttention = tests.filter((t: { status: string }) =>
        ['high', 'low', 'slightly_high', 'slightly_low'].includes(t.status)
      ).length;

      return {
        id: r.id,
        title: r.title || 'Medical Lab Report',
        patient_name: r.patient_name,
        lab_name: r.lab_name,
        report_date: r.report_date,
        language: r.language,
        overall_summary: r.overall_summary,
        has_file: Boolean(r.file_path),
        created_at: r.created_at,
        counts: {
          total,
          normal,
          needs_attention: needsAttention,
        },
        tests: tests.map((t: { test_name: string; normalized_name?: string; value: string; numeric_value?: number | null; unit: string; reference_range: string; status: string }) => ({
          test_name: t.test_name,
          normalized_name: t.normalized_name || t.test_name.toLowerCase().trim(),
          value: t.value,
          numeric_value: t.numeric_value,
          unit: t.unit,
          reference_range: t.reference_range,
          status: t.status,
        })),
      };
    });

    const duration = Date.now() - startTime;
    console.log(`[API /api/reports GET] Success: 200, duration: ${duration}ms, count: ${formattedReports.length}`);

    return ok({ reports: formattedReports });
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[API /api/reports GET] Critical error: duration ${duration}ms`, err);
    return fail('INTERNAL_ERROR', 'Failed to retrieve saved reports.', 500);
  }
}

export async function POST(request: NextRequest) {
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
      return fail('UNAUTHORIZED', 'You must be signed in to save reports.', 401);
    }

    // 1. Check max 50 reports per user limit
    const { count, error: countError } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('[API /api/reports POST] Count error:', countError.message);
    } else if (count !== null && count >= 50) {
      return fail(
        'LIMIT_EXCEEDED',
        'You have reached the limit of 50 saved reports. Please delete an older report before saving a new one.',
        400
      );
    }

    // 2. Parse & validate payload
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('INVALID_JSON', 'Request body must be valid JSON.', 400);
    }

    const parsed = SaveReportRequestSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid report data';
      return fail('VALIDATION_ERROR', issue, 400);
    }

    const {
      title,
      patient_name,
      lab_name,
      report_date,
      language,
      overall_summary,
      tests,
      chat_messages,
      keep_file,
      fileBase64,
      fileMimeType,
      fileName,
    } = parsed.data;

    // Build default title if empty
    const defaultTitle =
      title && title.trim().length > 0
        ? title.trim()
        : `${lab_name ? lab_name.trim() : 'Lab Report'}${report_date ? ` – ${report_date}` : ` – ${new Date().toLocaleDateString('en-GB')}`}`;

    // 3. Insert report record
    const { data: newReport, error: reportInsertError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        title: defaultTitle,
        patient_name: patient_name || null,
        lab_name: lab_name || null,
        report_date: report_date || null,
        language,
        overall_summary,
      })
      .select('id')
      .single();

    if (reportInsertError || !newReport) {
      console.error('[API /api/reports POST] Report insert error:', reportInsertError?.message);
      return fail('SAVE_FAILED', 'Could not save report header.', 500);
    }

    const reportId = newReport.id;

    // 4. Insert report tests
    const testRows = tests.map((t, idx) => ({
      report_id: reportId,
      user_id: user.id,
      position: t.position ?? idx + 1,
      test_name: t.test_name.trim(),
      value: t.value.trim(),
      numeric_value: parseNumericValue(t.value),
      unit: t.unit.trim(),
      reference_range: t.reference_range.trim(),
      status: t.status,
      simple_meaning: t.simple_meaning,
      what_test_measures: t.what_test_measures,
      urgency_note: t.urgency_note,
      possible_general_reasons: t.possible_general_reasons || [],
      questions_for_doctor: t.questions_for_doctor || [],
      normalized_name: t.test_name.toLowerCase().trim(),
    }));

    const { error: testsInsertError } = await supabase.from('report_tests').insert(testRows);

    if (testsInsertError) {
      console.error('[API /api/reports POST] Tests insert error:', testsInsertError.message);
      // Rollback: delete created report
      await supabase.from('reports').delete().eq('id', reportId);
      return fail('SAVE_FAILED', 'Could not save report test values.', 500);
    }

    // 5. Insert chat messages if any
    if (chat_messages && chat_messages.length > 0) {
      const messageRows = chat_messages.map((m) => ({
        report_id: reportId,
        user_id: user.id,
        role: m.role,
        content: m.content.trim(),
      }));

      const { error: chatInsertError } = await supabase.from('chat_messages').insert(messageRows);
      if (chatInsertError) {
        console.warn('[API /api/reports POST] Chat insert warning:', chatInsertError.message);
      }
    }

    // 6. Handle optional original file storage
    let savedFilePath: string | null = null;
    if (keep_file && fileBase64 && fileMimeType) {
      try {
        const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '').trim();
        const buffer = Buffer.from(cleanBase64, 'base64');

        if (buffer.length <= 10 * 1024 * 1024) {
          const sanitizedName = (fileName || 'document')
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .slice(0, 80);
          const storagePath = `${user.id}/${reportId}/${Date.now()}_${sanitizedName}`;

          const { error: uploadError } = await supabase.storage
            .from('report-files')
            .upload(storagePath, buffer, {
              contentType: fileMimeType,
              upsert: true,
            });

          if (!uploadError) {
            savedFilePath = storagePath;
            await supabase.from('reports').update({ file_path: storagePath }).eq('id', reportId);
          } else {
            console.warn('[API /api/reports POST] File upload error:', uploadError.message);
          }
        }
      } catch (fileErr) {
        console.warn('[API /api/reports POST] File processing error:', fileErr);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[API /api/reports POST] Success: 200, report_id: ${reportId}, duration: ${duration}ms`);

    return ok({
      report_id: reportId,
      title: defaultTitle,
      has_file: Boolean(savedFilePath),
      message: 'Saved. You can find it in History.',
    });
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[API /api/reports POST] Fatal error: duration ${duration}ms`, err);
    return fail('INTERNAL_ERROR', 'Failed to save report.', 500);
  }
}
