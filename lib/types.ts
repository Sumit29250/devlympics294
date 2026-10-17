export type Language = 'english' | 'hindi' | 'hinglish';

export type TestStatus = 'normal' | 'slightly_high' | 'slightly_low' | 'high' | 'low' | 'unclear';

export interface ReportEntry {
  id: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  confidence?: number;
  needsVerification?: boolean;
}

export interface ExtractedReportData {
  patient_name: string | null;
  report_date: string | null;
  lab_name: string | null;
  tests: {
    test_name: string;
    value: string;
    unit: string;
    reference_range: string;
    confidence: number;
    needs_verification?: boolean;
  }[];
}

export interface ExtractionResult {
  patientName?: string;
  reportDate?: string;
  labName?: string;
  entries: ReportEntry[];
}

export interface ExplanationResult {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  status: TestStatus;
  simple_meaning: string;
  what_test_measures: string;
  possible_general_reasons: string[];
  questions_for_doctor: string[];
  urgency_note: string;
}

export interface ExplainSummaryCounts {
  total: number;
  normal: number;
  needs_attention: number;
  unclear?: number;
}

export interface ExplainResponse {
  results: ExplanationResult[];
  overall_summary: string;
  summary_counts?: ExplainSummaryCounts;
}

export interface AskResponse {
  answer: string;
  related_tests?: string[];
  emergency?: boolean;
  disclaimer?: string;
}

export interface HealthResponse {
  ok: boolean;
  geminiConfigured: boolean;
  model: string;
}
