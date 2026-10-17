'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import TrendChart from '@/components/TrendChart';
import Disclaimer from '@/components/Disclaimer';
import { fetchReportsList, SavedReportSummary } from '@/lib/reportsApi';

export default function TrendsPage() {
  const [reports, setReports] = useState<SavedReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchReportsList();
    if (res.ok && res.data) {
      setReports(res.data.reports || []);
    } else {
      setError(res.error || 'Failed to load report history for trends.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Header />

        <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
          {/* Header & Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lab Test Trends Over Time</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Visualize changes and track numerical values across your saved medical reports.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/history"
                className="px-3.5 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Saved Reports
              </Link>
              <Link
                href="/"
                className="px-3.5 py-2 bg-sky-600 text-white hover:bg-sky-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Report
              </Link>
            </div>
          </div>

          <Disclaimer compact />

          {/* Loading Skeleton */}
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-6 shadow-2xs animate-pulse">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="h-6 bg-gray-200 rounded-lg w-48" />
                <div className="h-6 bg-gray-100 rounded-lg w-32" />
              </div>
              <div className="h-72 bg-gray-50 rounded-xl" />
              <div className="h-4 bg-gray-100 rounded-md w-1/2 mx-auto" />
            </div>
          )}

          {/* Error Alert */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-700 font-medium mb-3">{error}</p>
              <button
                onClick={loadReports}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State when no reports exist at all */}
          {!loading && !error && reports.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center shadow-2xs">
              <div className="w-16 h-16 mx-auto bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Saved Reports Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                To view health trends over time, save your analyzed lab reports to your MedDecode account.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-600 to-teal-600 text-white font-semibold text-sm rounded-xl hover:from-sky-700 hover:to-teal-700 transition-all shadow-md shadow-sky-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Analyze a Report Now
              </Link>
            </div>
          )}

          {/* Render Trend Chart with reports */}
          {!loading && !error && reports.length > 0 && (
            <TrendChart reports={reports} />
          )}
        </main>
      </div>

      <footer className="mt-12 py-6 text-center border-t border-gray-200 bg-white">
        <p className="text-sm text-gray-600 font-medium">
          <strong>MedDecode</strong> — Understand your medical report, confidently.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Educational laboratory report understanding tool. Not a medical device or healthcare provider.
        </p>
      </footer>
    </div>
  );
}
