import { z } from 'zod';

export const LanguageSchema = z.enum(['english', 'hindi', 'hinglish']);

export const TestStatusSchema = z.enum([
  'normal',
  'slightly_high',
  'slightly_low',
  'high',
  'low',
  'unclear',
]);

// Single test input schema (supports camelCase or snake_case)
export const TestInputSchema = z
  .object({
    id: z.string().optional(),
    test_name: z.string().optional(),
    testName: z.string().optional(),
    value: z.union([z.string(), z.number()]).transform((v) => String(v).trim()),
    unit: z.string().optional().default(''),
    reference_range: z.string().optional(),
    referenceRange: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    needs_verification: z.boolean().optional(),
    needsVerification: z.boolean().optional(),
  })
  .transform((data) => ({
    id: data.id || `test-${Math.random().toString(36).substring(2, 9)}`,
    test_name: (data.test_name || data.testName || '').trim(),
    value: data.value,
    unit: (data.unit || '').trim(),
    reference_range: (data.reference_range || data.referenceRange || '').trim(),
    confidence: data.confidence ?? 1.0,
    needs_verification: data.needs_verification ?? data.needsVerification ?? false,
  }));

// POST /api/extract-report request
export const ExtractReportRequestSchema = z.object({
  fileBase64: z.string().min(1, 'File base64 data is required'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'], {
    message: 'Unsupported file type. Please upload a JPG, PNG, or PDF file.',
  }),
});

// Gemini extraction output schema
export const GeminiExtractResponseSchema = z.object({
  patient_name: z.string().nullable().optional().default(null),
  report_date: z.string().nullable().optional().default(null),
  lab_name: z.string().nullable().optional().default(null),
  tests: z
    .array(
      z.object({
        test_name: z.string().optional().default(''),
        testName: z.string().optional(),
        value: z.union([z.string(), z.number()]).transform((v) => String(v).trim()).optional().default(''),
        unit: z.string().optional().default(''),
        reference_range: z.string().optional().default(''),
        referenceRange: z.string().optional(),
        confidence: z.number().min(0).max(1).optional().default(0.8),
      }).transform((t) => ({
        test_name: (t.test_name || t.testName || '').trim(),
        value: t.value,
        unit: (t.unit || '').trim(),
        reference_range: (t.reference_range || t.referenceRange || '').trim(),
        confidence: t.confidence,
      }))
    )
    .default([]),
});

// POST /api/explain request
export const ExplainRequestSchema = z.object({
  language: LanguageSchema.default('english'),
  patient_name: z.string().optional().default(''),
  patientName: z.string().optional(),
  report_date: z.string().optional().default(''),
  reportDate: z.string().optional(),
  lab_name: z.string().optional().default(''),
  labName: z.string().optional(),
  tests: z.array(TestInputSchema).min(1, 'At least one test is required').max(60, 'Maximum 60 tests allowed per report'),
}).transform((data) => ({
  language: data.language,
  patient_name: (data.patient_name || data.patientName || '').trim(),
  report_date: (data.report_date || data.reportDate || '').trim(),
  lab_name: (data.lab_name || data.labName || '').trim(),
  tests: data.tests,
}));

// Gemini explanation single result
export const ExplanationResultSchema = z.object({
  test_name: z.string().default(''),
  value: z.string().default(''),
  unit: z.string().default(''),
  reference_range: z.string().default(''),
  status: TestStatusSchema.default('unclear'),
  simple_meaning: z.string().default(''),
  what_test_measures: z.string().default(''),
  possible_general_reasons: z.array(z.string()).default([]),
  questions_for_doctor: z.array(z.string()).default([]),
  urgency_note: z.string().default(''),
});

// Gemini explanation output
export const GeminiExplainResponseSchema = z.object({
  results: z.array(ExplanationResultSchema).default([]),
  overall_summary: z.string().default(''),
});

// POST /api/ask request
export const AskRequestSchema = z.object({
  question: z
    .string()
    .min(1, 'Question cannot be empty')
    .max(500, 'Question must be 500 characters or fewer'),
  language: LanguageSchema.default('english'),
  tests: z.array(z.any()).optional().default([]),
});

// Gemini ask output
export const GeminiAskResponseSchema = z.object({
  answer: z.string(),
  related_tests: z.array(z.string()).optional().default([]),
});
