import { NextRequest } from 'next/server';
import { callGeminiJSON, isGeminiConfigured } from '@/lib/gemini';
import { ExplainRequestSchema, GeminiExplainResponseSchema } from '@/lib/schemas';
import { ok, fail } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';
import { computeTestStatus } from '@/lib/status';
import { getDemoExplainResponse, getGenericTestExplanation } from '@/lib/demoFallback';
import { ExplainResponse, ExplanationResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Rate limiting
    const rateLimit = checkRateLimit(request, 20, 60000);
    if (!rateLimit.allowed) {
      return fail('RATE_LIMIT_EXCEEDED', 'Too many requests, please wait a minute.', 429);
    }

    // 2. Parse & validate input
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('INVALID_JSON', 'Request body must be valid JSON.', 400);
    }

    const parseResult = ExplainRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || 'Invalid report data';
      return fail('VALIDATION_ERROR', issue, 400);
    }

    const { language, tests } = parseResult.data;

    // 3. Pre-compute deterministic status server-side for each test
    const precomputedStatuses = tests.map((t) => ({
      test_name: t.test_name,
      value: t.value,
      unit: t.unit,
      reference_range: t.reference_range,
      server_status: computeTestStatus(t.value, t.reference_range),
    }));

    // 4. Fallback directly if Gemini is not configured
    if (!isGeminiConfigured()) {
      const demoData = getDemoExplainResponse(tests, language);
      const duration = Date.now() - startTime;
      console.log(`[API /api/explain] Demo mode served (no key): duration ${duration}ms`);
      return ok<ExplainResponse>(demoData, {
        demoMode: true,
        message:
          'Gemini API key is missing or invalid. Please add it to .env.local as GEMINI_API_KEY and restart the server.',
      });
    }

    // 5. Construct AI Prompt with Ground Truth Status
    let languageGuidance = '';
    if (language === 'hindi') {
      languageGuidance =
        'Translate all explanatory text into simple Hindi (Devanagari script). Keep the "test_name" and units in their original English form so the patient can match them to their report.';
    } else if (language === 'hinglish') {
      languageGuidance =
        'Translate all explanatory text into Hinglish (conversational Hindi written in Roman/English alphabet with standard medical terms). Keep the "test_name" and units in their original English form.';
    } else {
      languageGuidance =
        'Explain everything in simple, clear, compassionate English suitable for an everyday patient.';
    }

    const promptPayload = precomputedStatuses.map((t) => ({
      test_name: t.test_name,
      value: t.value,
      unit: t.unit,
      reference_range: t.reference_range,
      ground_truth_status: t.server_status,
    }));

    const explainPrompt = `Analyze the following medical laboratory report values.

${languageGuidance}

TEST DATA WITH VERIFIED SERVER STATUS:
${JSON.stringify(promptPayload, null, 2)}

INSTRUCTIONS:
1. Explain each test in simple language for an Indian patient.
2. The "status" for each test has already been determined by rule-based analysis (ground_truth_status). You MUST reflect this status ("${promptPayload.map((p) => p.ground_truth_status).join('", "')}") and never contradict it.
3. For each test, provide:
   - "simple_meaning": what this specific result might mean in everyday terms
   - "what_test_measures": simple description of the organ or biological function tested
   - "possible_general_reasons": 2-4 general non-diagnostic factors that can cause variations (e.g. diet, hydration, stress, recent mild infection)
   - "questions_for_doctor": 2-3 specific, polite questions the patient can ask their doctor
   - "urgency_note": brief reassurance or recommendation to review with their doctor
4. "overall_summary": A compassionate, non-diagnostic 2-4 sentence overview of the entire report, highlighting which values are within range and which should be discussed with their physician.
5. Emphasize that this is an educational summary and NOT a clinical diagnosis.
6. Return ONLY valid JSON matching the schema.`;

    try {
      const aiResponse = await callGeminiJSON({
        contents: [{ role: 'user', parts: [{ text: explainPrompt }] }],
        schema: GeminiExplainResponseSchema,
        timeoutMs: 35000,
      });

      // 6. Overwrite AI status with server-computed status (Code decides status, AI explains)
      // And ensure order and length match input tests exactly
      const finalResults: ExplanationResult[] = precomputedStatuses.map((expected) => {
        const found = aiResponse.results.find(
          (r) => r.test_name.toLowerCase().trim() === expected.test_name.toLowerCase().trim()
        );

        if (found) {
          return {
            ...found,
            test_name: expected.test_name,
            value: expected.value,
            unit: expected.unit,
            reference_range: expected.reference_range,
            status: expected.server_status, // ALWAYS enforce server status
          };
        }

        // If Gemini dropped a test, fill it with generic fallback
        return getGenericTestExplanation(
          expected.test_name,
          expected.value,
          expected.unit,
          expected.reference_range,
          expected.server_status,
          language
        );
      });

      // 7. Calculate server-computed summary counts
      const normalCount = finalResults.filter((r) => r.status === 'normal').length;
      const attentionCount = finalResults.filter((r) =>
        ['high', 'low', 'slightly_high', 'slightly_low'].includes(r.status)
      ).length;
      const unclearCount = finalResults.filter((r) => r.status === 'unclear').length;

      const responsePayload: ExplainResponse = {
        results: finalResults,
        overall_summary: aiResponse.overall_summary || 'Please discuss these results with your doctor.',
        summary_counts: {
          total: finalResults.length,
          normal: normalCount,
          needs_attention: attentionCount,
          unclear: unclearCount,
        },
      };

      const duration = Date.now() - startTime;
      console.log(`[API /api/explain] AI success: 200, duration: ${duration}ms, tests: ${finalResults.length}`);

      return ok<ExplainResponse>(responsePayload);
    } catch (aiErr: unknown) {
      console.warn('[API /api/explain] Gemini error, falling back to Demo Mode:', aiErr instanceof Error ? aiErr.message : String(aiErr));

      // Fallback to Demo Mode on any Gemini failure
      const demoData = getDemoExplainResponse(tests, language);
      const duration = Date.now() - startTime;
      console.log(`[API /api/explain] Demo fallback served: duration ${duration}ms`);

      return ok<ExplainResponse>(demoData, {
        demoMode: true,
        message: 'Gemini API was temporarily unavailable. Showing pre-verified educational explanations.',
      });
    }
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[API /api/explain] Critical failure: duration ${duration}ms`, err instanceof Error ? err.message : String(err));

    return fail(
      'EXPLAIN_FAILED',
      'Unable to process the report. Please try again or load the sample report.',
      500,
      { demoMode: true }
    );
  }
}
