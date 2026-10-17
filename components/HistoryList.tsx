'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchReportsList, deleteReport, SavedReportSummary } from '@/lib/reportsApi';

export default function HistoryList() {
  const [reports, setReports] = useState<SavedReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchReportsList();
    if (res.ok && res.data) {
      setReports(res.data.reports || []);
    } else {
      setError(res.error || 'Failed to load report history.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    const res = await deleteReport(deleteTargetId);
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== deleteTargetId));
      setDeleteTargetId(null);
    } else {
      alert(res.error || 'Failed to delete report.');
    }
    setIsDeleting(false);
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading saved reports">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-3 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-2/3">
                <div className="h-5 bg-gray-200 rounded-md w-3/4" />
                <div className="h-3 bg-gray-100 rounded-md w-1/2" />
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-20" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-6 bg-gray-100 rounded-full w-24" />
              <div className="h-6 bg-gray-100 rounded-full w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-700 font-medium mb-3">{error}</p>
        <button
          onClick={loadReports}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center shadow-2xs">
        <div className="w-16 h-16 mx-auto bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">No Saved Reports Yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          When you analyze a medical lab report on the home page, click &ldquo;Save to my account&rdquo; to keep a private record and track trends over time.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-600 to-teal-600 text-white font-semibold text-sm rounded-xl hover:from-sky-700 hover:to-teal-700 transition-all shadow-md shadow-sky-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload or Analyze a Report
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>{reports.length} report{reports.length === 1 ? '' : 's'} saved</span>
        <span>Newest first</span>
      </div>

      <div className="space-y-3">
        {reports.map((report) => {
          const attentionCount = report.counts?.needs_attention || 0;
          const normalCount = report.counts?.normal || 0;
          const totalCount = report.counts?.total || 0;

          return (
            <div
              key={report.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-md transition-shadow relative group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/history/${report.id}`}
                      className="text-base sm:text-lg font-bold text-gray-800 hover:text-sky-600 transition-colors"
                    >
                      {report.title}
                    </Link>
                    {report.has_file && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-gray-100 text-gray-600">
                        📎 PDF/Image attached
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                    {report.patient_name && <span>Patient: {report.patient_name}</span>}
                    {report.lab_name && <span>• Lab: {report.lab_name}</span>}
                    {report.report_date && <span>• Date: {report.report_date}</span>}
                    <span className="capitalize">• Language: {report.language}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    href={`/history/${report.id}`}
                    className="px-3.5 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
                  >
                    View Report →
                  </Link>
                  <button
                    onClick={() => setDeleteTargetId(report.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                    aria-label={`Delete report ${report.title}`}
                    title="Delete report"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-50">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {totalCount} test{totalCount === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  ✓ {normalCount} normal
                </span>
                {attentionCount > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                    ⚠️ {attentionCount} need attention
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
                    All within range
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete this report?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete this lab report, test values, doctor questions, and any attached original document. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {isDeleting ? 'Deleting…' : 'Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
