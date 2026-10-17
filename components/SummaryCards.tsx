'use client';

import { ExplanationResult, ExplainSummaryCounts } from '@/lib/types';

interface SummaryCardsProps {
  results: ExplanationResult[];
  overallSummary: string;
  summaryCounts?: ExplainSummaryCounts;
}

export default function SummaryCards({ results, overallSummary, summaryCounts }: SummaryCardsProps) {
  const total = summaryCounts?.total ?? results.length;
  const normalCount = summaryCounts?.normal ?? results.filter((r) => r.status === 'normal').length;
  const attentionCount =
    summaryCounts?.needs_attention ??
    results.filter((r) => ['high', 'low', 'slightly_high', 'slightly_low'].includes(r.status)).length;
  const unclearCount = summaryCounts?.unclear ?? results.filter((r) => r.status === 'unclear').length;

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-sky-50 rounded-xl p-4 text-center border border-sky-100">
          <p className="text-3xl font-bold text-sky-600">{total}</p>
          <p className="text-xs text-sky-700 font-medium mt-1">Total Tests</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <p className="text-3xl font-bold text-green-600">{normalCount}</p>
          <p className="text-xs text-green-700 font-medium mt-1">Normal</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
          <p className="text-3xl font-bold text-amber-600">{attentionCount}</p>
          <p className="text-xs text-amber-700 font-medium mt-1">Need Attention</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
          <p className="text-3xl font-bold text-gray-500">{unclearCount}</p>
          <p className="text-xs text-gray-600 font-medium mt-1">Unclear</p>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="bg-gradient-to-br from-sky-50 to-teal-50 rounded-xl p-5 border border-sky-100">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Overall Summary
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{overallSummary}</p>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-xs">
        <p className="text-sm text-gray-600">
          ⚕️ <strong>This is not a diagnosis.</strong> Please discuss these results with your doctor.
        </p>
      </div>
    </div>
  );
}
