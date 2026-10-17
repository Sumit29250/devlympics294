import { Language, ReportEntry, ExtractionResult, ExplainResponse, AskResponse, HealthResponse } from './types';

export interface ClientApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
  demoMode?: boolean;
  message?: string;
}

async function requestWithTimeout<T>(
  url: string,
  options: RequestInit,
  timeoutMs = 35000
): Promise<ClientApiResponse<T>> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(id);

    // Rate limited
    if (res.status === 429) {
      return {
        ok: false,
        error: 'Too many requests, please wait a minute.',
        code: 'RATE_LIMIT_EXCEEDED',
      };
    }

    // Payload too large
    if (res.status === 413) {
      return {
        ok: false,
        error: 'File is too large (max 10MB). Please upload a smaller file.',
        code: 'PAYLOAD_TOO_LARGE',
      };
    }

    let json: {
      ok?: boolean;
      data?: T;
      error?: { code?: string; message?: string };
      demoMode?: boolean;
      message?: string;
    };

    try {
      json = await res.json();
    } catch {
      return {
        ok: false,
        error: `Server returned an invalid response (${res.status}).`,
        code: 'INVALID_JSON_RESPONSE',
      };
    }

    if (json.ok && json.data !== undefined) {
      return {
        ok: true,
        data: json.data,
        demoMode: json.demoMode,
        message: json.message,
      };
    }

    return {
      ok: false,
      error: json.error?.message || json.message || 'An unexpected error occurred.',
      code: json.error?.code || 'UNKNOWN_ERROR',
      demoMode: json.demoMode,
    };
  } catch (err: unknown) {
    clearTimeout(id);
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: false,
        error: 'Request timed out. Please try again.',
        code: 'TIMEOUT',
      };
    }
    return {
      ok: false,
      error: 'Network error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
    };
  }
}

export async function extractReportApi(
  fileBase64: string,
  mimeType: string
): Promise<ClientApiResponse<ExtractionResult>> {
  return requestWithTimeout<ExtractionResult>('/api/extract-report', {
    method: 'POST',
    body: JSON.stringify({ fileBase64, mimeType }),
  });
}

export async function explainReportApi(payload: {
  language: Language;
  tests: ReportEntry[];
  patient_name?: string;
  report_date?: string;
  lab_name?: string;
}): Promise<ClientApiResponse<ExplainResponse>> {
  // Format tests to ensure test_name and reference_range match schema
  const formattedTests = payload.tests.map((t) => ({
    id: t.id,
    test_name: t.testName,
    value: t.value,
    unit: t.unit,
    reference_range: t.referenceRange,
  }));

  return requestWithTimeout<ExplainResponse>('/api/explain', {
    method: 'POST',
    body: JSON.stringify({
      language: payload.language,
      patient_name: payload.patient_name || '',
      report_date: payload.report_date || '',
      lab_name: payload.lab_name || '',
      tests: formattedTests,
    }),
  });
}

export async function askQuestionApi(payload: {
  question: string;
  language: Language;
  tests?: ReportEntry[];
}): Promise<ClientApiResponse<AskResponse>> {
  const formattedTests = (payload.tests || []).map((t) => ({
    test_name: t.testName,
    value: t.value,
    unit: t.unit,
    reference_range: t.referenceRange,
  }));

  return requestWithTimeout<AskResponse>('/api/ask', {
    method: 'POST',
    body: JSON.stringify({
      question: payload.question,
      language: payload.language,
      tests: formattedTests,
    }),
  });
}

export async function checkHealthApi(): Promise<ClientApiResponse<HealthResponse>> {
  return requestWithTimeout<HealthResponse>('/api/health', {
    method: 'GET',
  });
}
