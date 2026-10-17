import { ExplainResponse, AskResponse, ExplanationResult } from './types';

export function validateExplainResponse(data: unknown): ExplainResponse | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.results)) return null;
  if (typeof obj.overall_summary !== 'string') return null;

  const validStatuses = ['normal', 'slightly_high', 'slightly_low', 'high', 'low', 'unclear'];

  const results: ExplanationResult[] = [];
  for (const item of obj.results) {
    if (!item || typeof item !== 'object') return null;
    const r = item as Record<string, unknown>;
    if (typeof r.test_name !== 'string') return null;
    if (typeof r.value !== 'string') return null;
    if (typeof r.unit !== 'string') return null;
    if (typeof r.reference_range !== 'string') return null;
    if (typeof r.status !== 'string' || !validStatuses.includes(r.status)) {
      r.status = 'unclear';
    }
    if (typeof r.simple_meaning !== 'string') r.simple_meaning = '';
    if (typeof r.what_test_measures !== 'string') r.what_test_measures = '';
    if (!Array.isArray(r.possible_general_reasons)) r.possible_general_reasons = [];
    if (!Array.isArray(r.questions_for_doctor)) r.questions_for_doctor = [];
    if (typeof r.urgency_note !== 'string') r.urgency_note = '';

    results.push({
      test_name: r.test_name as string,
      value: r.value as string,
      unit: r.unit as string,
      reference_range: r.reference_range as string,
      status: r.status as ExplanationResult['status'],
      simple_meaning: r.simple_meaning as string,
      what_test_measures: r.what_test_measures as string,
      possible_general_reasons: (r.possible_general_reasons as unknown[]).map(String),
      questions_for_doctor: (r.questions_for_doctor as unknown[]).map(String),
      urgency_note: r.urgency_note as string,
    });
  }

  return {
    results,
    overall_summary: obj.overall_summary as string,
  };
}

export function validateAskResponse(data: unknown): AskResponse | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.answer !== 'string') return null;
  return {
    answer: obj.answer,
    disclaimer: typeof obj.disclaimer === 'string'
      ? obj.disclaimer
      : 'This is educational information only. Please consult a qualified healthcare professional.',
  };
}

export function parseJsonFromText(text: string): unknown {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // fall through
      }
    }
    // Try to find JSON object in text
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        // fall through
      }
    }
    return null;
  }
}
