'use client';

import { ExplanationResult, ReportEntry } from '@/lib/types';

interface DoctorSheetProps {
  results: ExplanationResult[];
  overallSummary: string;
  patientName: string;
  reportDate: string;
  labName: string;
  entries: ReportEntry[];
}

export default function DoctorSheet({
  results,
  overallSummary,
  patientName,
  reportDate,
  labName,
  entries,
}: DoctorSheetProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Print Button - hidden when printing */}
      <button
        onClick={handlePrint}
        className="print:hidden w-full py-3.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-teal-100"
        aria-label="Download or print doctor discussion sheet"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Download / Print Doctor Discussion Sheet
      </button>

      {/* Printable Content - visible only when printing */}
      <div className="hidden print:block print-content" id="printable-doctor-sheet">
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">MedDecode — Doctor Discussion Sheet</h1>
          <p className="text-sm text-gray-600 mt-1">
            Understand your medical report, confidently. • Generated for consultation with your doctor
          </p>
        </div>

        {/* Patient and Lab Metadata */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div>
            <span className="font-semibold text-gray-700">Patient:</span>{' '}
            <span className="text-gray-900">{patientName || 'Not specified'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Report Date:</span>{' '}
            <span className="text-gray-900">{reportDate || new Date().toISOString().split('T')[0]}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Lab / Clinic:</span>{' '}
            <span className="text-gray-900">{labName || 'Not specified'}</span>
          </div>
        </div>

        {/* Test Values Table */}
        <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide">
          1. Verified Lab Test Values
        </h2>
        <table className="w-full text-sm mb-6 border border-gray-300 border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="text-left p-2 border-r border-gray-300">Test Name</th>
              <th className="text-left p-2 border-r border-gray-300">Measured Value</th>
              <th className="text-left p-2 border-r border-gray-300">Unit</th>
              <th className="text-left p-2 border-r border-gray-300">Reference Range</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-200">
                <td className="p-2 border-r border-gray-200 font-medium">{entry.testName}</td>
                <td className="p-2 border-r border-gray-200">{entry.value}</td>
                <td className="p-2 border-r border-gray-200">{entry.unit || '—'}</td>
                <td className="p-2 border-r border-gray-200">{entry.referenceRange || '—'}</td>
                <td className="p-2 capitalize">
                  {results.find((r) => r.test_name.toLowerCase() === entry.testName.toLowerCase())?.status.replace('_', ' ') || 'Normal'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Overview */}
        <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide">
          2. Educational Overview
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-sm text-gray-800 leading-relaxed">
          {overallSummary}
        </div>

        {/* Doctor Questions */}
        <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide">
          3. Suggested Questions to Discuss with Your Doctor
        </h2>
        <div className="space-y-4 mb-6">
          {results.map((result, idx) => (
            <div key={idx} className="border-b border-gray-200 pb-3">
              <p className="font-semibold text-gray-900 text-sm">
                • {result.test_name} ({result.value} {result.unit}) — <span className="capitalize">{result.status.replace('_', ' ')}</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">{result.simple_meaning}</p>
              {result.questions_for_doctor && result.questions_for_doctor.length > 0 && (
                <ul className="mt-1.5 list-disc list-inside text-xs text-teal-900 space-y-0.5">
                  {result.questions_for_doctor.map((q, qIdx) => (
                    <li key={qIdx}>{q}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Full Medical Disclaimer */}
        <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>Medical Disclaimer:</strong> MedDecode provides educational explanations only. It does not provide medical diagnosis, treatment, or emergency advice. Always consult a qualified healthcare professional. This discussion sheet is designed solely to facilitate conversations between patients and licensed healthcare providers.
          </p>
        </div>
      </div>
    </div>
  );
}
