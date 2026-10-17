import Link from 'next/link';
import Header from '@/components/Header';
import HistoryList from '@/components/HistoryList';
import PrivacyControls from '@/components/PrivacyControls';
import Disclaimer from '@/components/Disclaimer';

export const metadata = {
  title: 'Saved Reports History — MedDecode',
  description: 'View and manage your saved medical laboratory reports privately.',
};

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Header />

        <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Saved Lab Reports</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Private health records saved explicitly by your account.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/trends"
                className="px-3.5 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                View Trends
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

          {/* List of Reports */}
          <HistoryList />

          {/* Privacy and Data Controls */}
          <section className="pt-6 border-t border-gray-200">
            <PrivacyControls />
          </section>
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
