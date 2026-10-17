import { NextRequest } from 'next/server';
import { callGeminiJSON, isGeminiConfigured } from '@/lib/gemini';
import { ExtractReportRequestSchema, GeminiExtractResponseSchema } from '@/lib/schemas';
import { ok, fail } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';
import { ExtractionResult, ReportEntry } from '@/lib/types';

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

    const parseResult = ExtractReportRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || 'Invalid request payload';
      return fail('VALIDATION_ERROR', issue, 400);
    }

    const { fileBase64, mimeType } = parseResult.data;

    // 3. Strip any data URI header defensively
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '').trim();

    // 4. Validate size (max 10MB decoded binary ≈ 13.7MB base64)
    const approxBytes = (cleanBase64.length * 3) / 4;
    if (approxBytes > 10 * 1024 * 1024) {
      return fail('PAYLOAD_TOO_LARGE', 'File size exceeds 10MB limit. Please upload a smaller file.', 413);
    }

    // 5. Check if Gemini is configured
    if (!isGeminiConfigured()) {
      return fail(
        'GEMINI_API_KEY_MISSING',
        'Gemini API key is missing or invalid. Please add it to .env.local as GEMINI_API_KEY and restart the server. To test the app, click "Load Sample CBC Report".',
        400,
        { demoMode: true }
      );
    }

    // 6. Call Gemini Vision / Document OCR
    const extractionPrompt = `You are MedDecode's medical document OCR system. Carefully inspect this medical lab report image/document.
Extract all visible diagnostic test names, values, units, reference intervals, and assess extraction confidence.

Return ONLY a JSON object matching this schema:
{
  "patient_name": "patient name if visible, or null",
  "report_date": "report date if visible, or null",
  "lab_name": "diagnostic center or laboratory name if visible, or null",
  "tests": [
    {
      "test_name": "full name of the test in English",
      "value": "measured numerical or categorical value as string",
      "unit": "measurement unit or empty string",
      "reference_range": "reference interval or empty string",
      "confidence": 0.95
    }
  ]
}

Rules:
- Extract EVERY test result row visible in the document.
- confidence is a number from 0.0 to 1.0 reflecting how clearly legible the row was.
- If a value or test name is smudged, blurry, handwriting is uncertain, or cropped, assign confidence < 0.7.
- Retain original units and formatting.
- Normalize unnecessary whitespace.
- Return ONLY valid JSON, no markdown formatting.`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: extractionPrompt },
        ],
      },
    ];

    const extracted = await callGeminiJSON({
      contents,
      schema: GeminiExtractResponseSchema,
      timeoutMs: 35000,
    });

    // 7. Post-process extracted test rows
    const rawTests = extracted.tests || [];
    const validRows = rawTests.filter(
      (t) => t.test_name.trim().length > 0 || t.value.trim().length > 0
    );

    if (validRows.length === 0) {
      return fail(
        'NO_TESTS_FOUND',
        'Could not detect any test entries in this image. Please make sure the report is clearly visible, or enter values manually in the table.',
        422
      );
    }

    const processedEntries: ReportEntry[] = validRows.map((t, idx) => {
      const conf = typeof t.confidence === 'number' ? t.confidence : 0.8;
      const isLowConfidence = conf < 0.7;
      const isMissingCritical = !t.test_name.trim() || !t.value.trim();

      return {
        id: `ext-${Date.now()}-${idx + 1}`,
        testName: t.test_name.trim(),
        value: t.value.trim(),
        unit: t.unit.trim(),
        referenceRange: t.reference_range.trim(),
        confidence: conf,
        needsVerification: isLowConfidence || isMissingCritical,
      };
    });

    const extractionResult: ExtractionResult = {
      patientName: extracted.patient_name?.trim() || '',
      reportDate: extracted.report_date?.trim() || '',
      labName: extracted.lab_name?.trim() || '',
      entries: processedEntries,
    };

    const duration = Date.now() - startTime;
    console.log(`[API /api/extract-report] Success: 200, duration: ${duration}ms, rows: ${processedEntries.length}`);

    return ok<ExtractionResult>(extractionResult);
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[API /api/extract-report] Error: duration ${duration}ms`, err instanceof Error ? err.message : String(err));

    return fail(
      'EXTRACTION_FAILED',
      'Could not extract report from the uploaded document. Please check your Gemini API key, or use "Load Sample CBC Report" / manual entry.',
      500,
      { demoMode: true }
    );
  }
}
