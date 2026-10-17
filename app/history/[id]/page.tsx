'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import SummaryCards from '@/components/SummaryCards';
import ExplanationCard from '@/components/ExplanationCard';
import DoctorSheet from '@/components/DoctorSheet';
import Disclaimer from '@/components/Disclaimer';
import {
  fetchReportDetail,
  getReportFileUrl,
  appendReportChatMessage,
  SavedReportDetail,
  SavedChatMessage,
} from '@/lib/reportsApi';
import { ExplanationResult, ReportEntry, Language } from '@/lib/types';
import { askQuestionApi } from '@/lib/api';
import { isEmergencyQuery, getEmergencyNotice } from '@/lib/safety';

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params?.id as string;

  const [data, setData] = useState<SavedReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // File viewing
  const [fileLoading, setFileLoading] = useState(false);

  // Chat state
  const [chatList, setChatList] = useState<SavedChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');

  useEffect(() => {
    if (!reportId) return;

    setLoading(true);
    fetchReportDetail(reportId)
      .then((res) => {
        if (res.ok && res.data) {
          setData(res.data);
          setChatList(res.data.chat_messages || []);
        } else {
          setError(res.error || 'Could not load report details.');
        }
      })
      .finally(() => setLoading(false));
  }, [reportId]);

  const handleViewOriginalFile = async () => {
    if (!reportId) return;
    setFileLoading(true);
    const res = await getReportFileUrl(reportId);
    if (res.ok && res.data?.signedUrl) {
      window.open(res.data.signedUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert(res.error || 'Could not generate secure file URL.');
    }
    setFileLoading(false);
  };

  const handleAskFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isAsking || !data) return;

    // Check emergency client-side
    if (isEmergencyQuery(trimmed)) {
      setIsEmergency(true);
      setEmergencyMessage(getEmergencyNotice((data.report.language as Language) || 'english'));
      return;
    }

    setIsAsking(true);
    setChatError(null);
    setIsEmergency(false);

    // Optimistically add user question
    const tempUserMsg: SavedChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setChatList((prev) => [...prev, tempUserMsg]);
    setQuestion('');

    try {
      // 1. Persist user message to DB
      await appendReportChatMessage(reportId, { role: 'user', content: trimmed });

      // 2. Query Gemini /api/ask
      const reportEntries: ReportEntry[] = data.tests.map((t) => ({
        id: t.id,
        testName: t.test_name,
        value: t.value,
        unit: t.unit,
        referenceRange: t.reference_range,
      }));

      const askRes = await askQuestionApi({
        question: trimmed,
        language: (data.report.language as Language) || 'english',
        tests: reportEntries,
      });

      if (askRes.ok && askRes.data) {
        if (askRes.data.emergency) {
          setIsEmergency(true);
          setEmergencyMessage(askRes.data.answer);
          return;
        }

        const assistantMsgText = askRes.data.answer;
        const tempAssistantMsg: SavedChatMessage = {
          id: `temp-${Date.now() + 1}`,
          role: 'assistant',
          content: assistantMsgText,
          created_at: new Date().toISOString(),
        };

        setChatList((prev) => [...prev, tempAssistantMsg]);

        // 3. Persist assistant response to DB
        await appendReportChatMessage(reportId, { role: 'assistant', content: assistantMsgText });
      } else {
        setChatError(askRes.error || 'Failed to get an AI response.');
      }
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Error processing question.');
    } finally {
      setIsAsking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-40 bg-white rounded-2xl border border-gray-100" />
          <div className="h-60 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-3">
            <p className="text-red-700 font-semibold">{error || 'Report not found'}</p>
            <Link
              href="/history"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
            >
              ← Back to History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { report, tests } = data;

  // Convert DB tests to ExplanationResult format for existing UI components
  const explanationResults: ExplanationResult[] = tests.map((t) => ({
    test_name: t.test_name,
    value: t.value,
    unit: t.unit,
    reference_range: t.reference_range,
    status: t.status,
    simple_meaning: t.simple_meaning,
    what_test_measures: t.what_test_measures,
    possible_general_reasons: t.possible_general_reasons || [],
    questions_for_doctor: t.questions_for_doctor || [],
    urgency_note: t.urgency_note,
  }));

  const reportEntries: ReportEntry[] = tests.map((t) => ({
    id: t.id,
    testName: t.test_name,
    value: t.value,
    unit: t.unit,
    referenceRange: t.reference_range,
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Header />

        <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 print:p-0">
          {/* Top Bar Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <Link
              href="/history"
              className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 self-start"
            >
              ← Back to Saved Reports
            </Link>

            {report.file_path && (
              <button
                onClick={handleViewOriginalFile}
                disabled={fileLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
              >
                {fileLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                    Generating secure link…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Original File (60s secure link)
                  </>
                )}
              </button>
            )}
          </div>

          {/* Report Header Metadata Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-2xs print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{report.title}</h1>
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-3 py-1 rounded-full capitalize self-start sm:self-auto">
                {report.language}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
              <div>
                <span className="font-semibold text-gray-400 block">Patient</span>
                {report.patient_name || 'Not specified'}
              </div>
              <div>
                <span className="font-semibold text-gray-400 block">Report Date</span>
                {report.report_date || 'Not specified'}
              </div>
              <div>
                <span className="font-semibold text-gray-400 block">Laboratory</span>
                {report.lab_name || 'Not specified'}
              </div>
              <div>
                <span className="font-semibold text-gray-400 block">Saved On</span>
                {new Date(report.created_at).toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>

          <Disclaimer compact />

          {/* Reusable Summary Cards */}
          <SummaryCards
            results={explanationResults}
            overallSummary={report.overall_summary}
          />

          {/* Reusable Explanation Cards */}
          <section className="space-y-4 print:hidden" aria-label="Detailed test explanations">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Detailed Explanations
            </h2>
            {explanationResults.map((result, index) => (
              <ExplanationCard
                key={`${result.test_name}-${index}`}
                result={result}
                language={(report.language as Language) || 'english'}
              />
            ))}
          </section>

          {/* Doctor Discussion Sheet Print Component */}
          <section
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
            aria-label="Doctor discussion sheet section"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 print:hidden">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Doctor Discussion Sheet
            </h2>
            <DoctorSheet
              results={explanationResults}
              overallSummary={report.overall_summary}
              patientName={report.patient_name || ''}
              reportDate={report.report_date || ''}
              labName={report.lab_name || ''}
              entries={reportEntries}
            />
          </section>

          {/* Persistent Chat History & Follow-up Q&A Box */}
          <section
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4 print:hidden"
            aria-label="Questions about this report"
          >
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Follow-up Questions & Answers
            </h2>

            {/* Conversation History */}
            {chatList.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-100">
                {chatList.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-sky-600 text-white rounded-tr-xs'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-xs shadow-2xs whitespace-pre-line'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span
                        className={`text-3xs block mt-1 ${
                          msg.role === 'user' ? 'text-sky-200 text-right' : 'text-gray-400'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isEmergency && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-sm text-red-700 animate-in">
                <p className="font-bold text-red-800 mb-1">🚨 Emergency Warning</p>
                <p className="whitespace-pre-line">{emergencyMessage}</p>
              </div>
            )}

            {chatError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                {chatError}
              </div>
            )}

            {/* Question Input Form */}
            <form onSubmit={handleAskFollowUp} className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask another question about this report…"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
                disabled={isAsking}
              />
              <button
                type="submit"
                disabled={isAsking || !question.trim()}
                className="px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isAsking ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Ask'
                )}
              </button>
            </form>

            <p className="text-2xs text-gray-400 italic text-center">
              Questions and answers are saved privately to this report history. Educational information only.
            </p>
          </section>
        </main>
      </div>

      <footer className="mt-12 py-6 text-center border-t border-gray-200 bg-white print:hidden">
        <p className="text-sm text-gray-600 font-medium">
          <strong>MedDecode</strong> — Understand your medical report, confidently.
        </p>
      </footer>
    </div>
  );
}
