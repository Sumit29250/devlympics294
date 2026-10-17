'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { saveReport, SaveReportPayload } from '@/lib/reportsApi';
import { ExplanationResult, Language } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

interface SaveReportBarProps {
  results: ExplanationResult[];
  overallSummary: string;
  language: Language;
  patientName?: string;
  reportDate?: string;
  labName?: string;
  uploadedFile?: { base64: string; mimeType: string; name: string } | null;
  chatMessages?: { role: 'user' | 'assistant'; content: string }[];
}

export default function SaveReportBar({
  results,
  overallSummary,
  language,
  patientName,
  reportDate,
  labName,
  uploadedFile,
  chatMessages = [],
}: SaveReportBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields for save
  const defaultTitle = `${labName ? labName.trim() : 'Lab Report'}${
    reportDate ? ` – ${reportDate}` : ` – ${new Date().toLocaleDateString('en-GB')}`
  }`;
  const [title, setTitle] = useState(defaultTitle);
  const [keepFile, setKeepFile] = useState(false);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  // Hide completely if Supabase is not configured (guest mode)
  if (!configured) {
    return null;
  }

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);

    const payload: SaveReportPayload = {
      title: title.trim() || defaultTitle,
      patient_name: patientName?.trim() || null,
      lab_name: labName?.trim() || null,
      report_date: reportDate?.trim() || null,
      language,
      overall_summary: overallSummary,
      tests: results.map((r, idx) => ({
        position: idx + 1,
        test_name: r.test_name,
        value: r.value,
        unit: r.unit,
        reference_range: r.reference_range,
        status: r.status,
        simple_meaning: r.simple_meaning,
        what_test_measures: r.what_test_measures,
        urgency_note: r.urgency_note,
        possible_general_reasons: r.possible_general_reasons,
        questions_for_doctor: r.questions_for_doctor,
      })),
      chat_messages: chatMessages,
      keep_file: keepFile && Boolean(uploadedFile),
      fileBase64: keepFile && uploadedFile ? uploadedFile.base64 : undefined,
      fileMimeType: keepFile && uploadedFile ? uploadedFile.mimeType : undefined,
      fileName: keepFile && uploadedFile ? uploadedFile.name : undefined,
    };

    const response = await saveReport(payload);

    if (response.ok && response.data) {
      setSavedReportId(response.data.report_id);
    } else {
      setError(response.error || 'Failed to save report. Please try again.');
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 print:hidden animate-in">
      {savedReportId ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-teal-50 border border-teal-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              ✅
            </span>
            <div>
              <p className="font-semibold text-teal-900">Saved to your account</p>
              <p className="text-xs text-teal-700">You can find this report in your History anytime.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/history/${savedReportId}`}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-xs sm:text-sm font-semibold shadow-2xs"
            >
              View in History →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save This Report to Your Account
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                🔒 Nothing is saved unless you click Save. Saving is always an explicit action.
              </p>
            </div>

            {!user && (
              <Link
                href="/login?next=/"
                className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto"
              >
                Sign in to save this report →
              </Link>
            )}
          </div>

          {user && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="saveReportTitle" className="block text-xs font-medium text-gray-600 mb-1">
                    Report Title
                  </label>
                  <input
                    id="saveReportTitle"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Annual Checkup – Oct 2026"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                    maxLength={100}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-teal-600 text-white font-semibold text-sm rounded-xl hover:from-sky-700 hover:to-teal-700 transition-all shadow-md shadow-sky-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save to My Account
                      </>
                    )}
                  </button>
                </div>
              </div>

              {uploadedFile && (
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={keepFile}
                    onChange={(e) => setKeepFile(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                  />
                  <span>
                    Also keep the original uploaded file (<strong>{uploadedFile.name}</strong>) securely in my private storage
                  </span>
                </label>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
