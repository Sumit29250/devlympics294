import { ClientApiResponse } from './api';

export interface SavedReportSummary {
  id: string;
  title: string;
  patient_name?: string | null;
  lab_name?: string | null;
  report_date?: string | null;
  language: string;
  overall_summary?: string;
  has_file: boolean;
  created_at: string;
  counts: {
    total: number;
    normal: number;
    needs_attention: number;
  };
  tests?: {
    test_name: string;
    normalized_name: string;
    value: string;
    numeric_value?: number | null;
    unit: string;
    reference_range: string;
    status: string;
  }[];
}

export interface SavedReportTest {
  id: string;
  report_id: string;
  position: number;
  test_name: string;
  value: string;
  numeric_value?: number | null;
  unit: string;
  reference_range: string;
  status: 'normal' | 'slightly_high' | 'slightly_low' | 'high' | 'low' | 'unclear';
  simple_meaning: string;
  what_test_measures: string;
  urgency_note: string;
  possible_general_reasons: string[];
  questions_for_doctor: string[];
  normalized_name: string;
}

export interface SavedChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface SavedReportDetail {
  report: {
    id: string;
    title: string;
    patient_name?: string | null;
    lab_name?: string | null;
    report_date?: string | null;
    language: string;
    overall_summary: string;
    file_path?: string | null;
    created_at: string;
  };
  tests: SavedReportTest[];
  chat_messages: SavedChatMessage[];
}

export interface SaveReportPayload {
  title?: string;
  patient_name?: string | null;
  lab_name?: string | null;
  report_date?: string | null;
  language: string;
  overall_summary: string;
  tests: {
    position?: number;
    test_name: string;
    value: string;
    unit: string;
    reference_range: string;
    status: string;
    simple_meaning: string;
    what_test_measures: string;
    urgency_note: string;
    possible_general_reasons?: string[];
    questions_for_doctor?: string[];
  }[];
  chat_messages?: { role: 'user' | 'assistant'; content: string }[];
  keep_file?: boolean;
  fileBase64?: string;
  fileMimeType?: string;
  fileName?: string;
}

async function apiRequest<T>(url: string, options: RequestInit): Promise<ClientApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const json = await res.json();
    if (json.ok && json.data !== undefined) {
      return { ok: true, data: json.data, message: json.message };
    }
    return {
      ok: false,
      error: json.error?.message || json.message || 'Request failed.',
      code: json.error?.code || String(res.status),
    };
  } catch {
    return {
      ok: false,
      error: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    };
  }
}

export async function fetchReportsList(): Promise<ClientApiResponse<{ reports: SavedReportSummary[] }>> {
  return apiRequest<{ reports: SavedReportSummary[] }>('/api/reports', {
    method: 'GET',
  });
}

export async function fetchReportDetail(id: string): Promise<ClientApiResponse<SavedReportDetail>> {
  return apiRequest<SavedReportDetail>(`/api/reports/${id}`, {
    method: 'GET',
  });
}

export async function saveReport(
  payload: SaveReportPayload
): Promise<ClientApiResponse<{ report_id: string; title: string; has_file: boolean }>> {
  return apiRequest<{ report_id: string; title: string; has_file: boolean }>('/api/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteReport(id: string): Promise<ClientApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/reports/${id}`, {
    method: 'DELETE',
  });
}

export async function appendReportChatMessage(
  reportId: string,
  message: { role: 'user' | 'assistant'; content: string }
): Promise<ClientApiResponse<{ message: SavedChatMessage }>> {
  return apiRequest<{ message: SavedChatMessage }>(`/api/reports/${reportId}/chat`, {
    method: 'POST',
    body: JSON.stringify(message),
  });
}

export async function getReportFileUrl(
  reportId: string
): Promise<ClientApiResponse<{ signedUrl: string }>> {
  return apiRequest<{ signedUrl: string }>(`/api/reports/${reportId}/file`, {
    method: 'GET',
  });
}

export async function deleteUserAccount(
  confirmation: string
): Promise<ClientApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>('/api/account', {
    method: 'DELETE',
    body: JSON.stringify({ confirmation }),
  });
}
