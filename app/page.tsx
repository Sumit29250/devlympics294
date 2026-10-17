'use client';

import { useState, useRef } from 'react';
import Header from '@/components/Header';
import LanguageSelector from '@/components/LanguageSelector';
import Disclaimer from '@/components/Disclaimer';
import EmergencyNotice from '@/components/EmergencyNotice';
import ReportUploader from '@/components/ReportUploader';
import ReportForm from '@/components/ReportForm';
import ExplanationCard from '@/components/ExplanationCard';
import SummaryCards from '@/components/SummaryCards';
import DoctorSheet from '@/components/DoctorSheet';
import AskAI from '@/components/AskAI';
import SaveReportBar from '@/components/SaveReportBar';
import { Language, ReportEntry, ExtractionResult, ExplainResponse } from '@/lib/types';
import { sampleCBCReport, samplePatientName, sampleReportDate, sampleLabName } from '@/lib/sampleReport';
import { explainReportApi } from '@/lib/api';

export default function Home() {
  const [language, setLanguage] = useState<Language>('english');
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [patientName, setPatientName] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [labName, setLabName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [explainResponse, setExplainResponse] = useState<ExplainResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const [showEmergency, setShowEmergency] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Check how many valid test rows exist
  const validRowsCount = entries.filter(
    (e) => e.testName.trim().length > 0 && e.value.trim().length > 0
  ).length;

  const handleLoadSample = () => {
    setEntries([...sampleCBCReport]);
    setPatientName(samplePatientName);
    setReportDate(sampleReportDate);
    setLabName(sampleLabName);
    setUploadedFile(null);
    setExplainResponse(null);
    setDemoMode(false);
    setDemoMessage('');
    setExplainError(null);
  };

  const handleExtracted = (result: ExtractionResult, isDemoMode?: boolean, message?: string) => {
    if (result.entries.length > 0) {
      setEntries(result.entries);
    }
    if (result.patientName) setPatientName(result.patientName);
    if (result.reportDate) setReportDate(result.reportDate);
    if (result.labName) setLabName(result.labName);
    setExplainResponse(null);
    setExplainError(null);

    if (isDemoMode) {
      setDemoMode(true);
      setDemoMessage(
        message || 'Demo Mode: showing pre-written sample explanations because the Gemini API is unavailable.'
      );
    }
  };

  const handleExplain = async () => {
    if (validRowsCount === 0) return;

    setIsExplaining(true);
    setExplainError(null);
    setExplainResponse(null);

    try {
      const response = await explainReportApi({
        language,
        tests: entries.filter((e) => e.testName.trim().length > 0 && e.value.trim().length > 0),
        patient_name: patientName,
        report_date: reportDate,
        lab_name: labName,
      });

      if (!response.ok || !response.data) {
        throw new Error(response.error || 'Failed to explain the report.');
      }

      if (response.demoMode) {
        setDemoMode(true);
        setDemoMessage(
          response.message ||
            'Demo Mode: showing pre-written sample explanations because the Gemini API is unavailable.'
        );
      }

      setExplainResponse(response.data);

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      setExplainError(
        err instanceof Error ? err.message : 'Failed to explain the report. Please try again.'
      );
    } finally {
      setIsExplaining(false);
    }
  };

  const handleReset = () => {
    setEntries([]);
    setPatientName('');
    setReportDate('');
    setLabName('');
    setUploadedFile(null);
    setExplainResponse(null);
    setDemoMode(false);
    setDemoMessage('');
    setExplainError(null);
  };

  // Re-run explanation if language changes while viewing results
  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    if (explainResponse && validRowsCount > 0) {
      setIsExplaining(true);
      try {
        const response = await explainReportApi({
          language: newLang,
          tests: entries.filter((e) => e.testName.trim().length > 0 && e.value.trim().length > 0),
          patient_name: patientName,
          report_date: reportDate,
          lab_name: labName,
        });
        if (response.ok && response.data) {
          setExplainResponse(response.data);
          if (response.demoMode) {
            setDemoMode(true);
          }
        }
      } catch {
        // preserve existing response if re-fetch fails
      } finally {
        setIsExplaining(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Header />

        {showEmergency && <EmergencyNotice onDismiss={() => setShowEmergency(false)} />}

        <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 print:p-0">
          {/* Main Educational Disclaimer */}
          <div className="mb-6 print:hidden">
            <Disclaimer />
          </div>

          {/* Demo Mode Banner */}
          {demoMode && (
            <div
              className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 print:hidden animate-in shadow-xs"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0" aria-hidden="true">
                  🔧
                </span>
                <div>
                  <p className="font-semibold text-amber-800">
                    Demo Mode: showing pre-written sample explanations because the Gemini API is unavailable.
                  </p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    {demoMessage || 'Add your key to .env.local as GEMINI_API_KEY to activate live Gemini 2.0 Flash AI.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Language Selector & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
            <LanguageSelector language={language} onLanguageChange={handleLanguageChange} />
            {entries.length > 0 && (
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors font-medium flex items-center gap-1 self-start sm:self-auto"
                aria-label="Start over with a new report"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Start Over
              </button>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="mb-6 text-center print:hidden">
            <p className="text-xs text-gray-400">
              🔒 Your report is processed temporarily to generate explanations. Nothing is saved unless you sign in and choose Save.
            </p>
          </div>

          {/* Report Input Section */}
          {!explainResponse && (
            <div className="space-y-6 print:hidden">
              {/* Load Sample Report Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleLoadSample}
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-teal-600 transition-all shadow-md shadow-sky-100 flex items-center justify-center gap-2"
                  aria-label="Load sample CBC report"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Load Sample CBC Report
                </button>
              </div>

              {/* Upload Dropzone */}
              <section
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
                aria-label="Upload report section"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Upload Lab Report
                </h2>
                <ReportUploader
                  onExtracted={handleExtracted}
                  language={language}
                  onFileSelected={setUploadedFile}
                />
              </section>

              {/* Manual Entry / Editable Table Section */}
              <section
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
                aria-label="Report table section"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {entries.length > 0 ? 'Review & Edit Report Values' : 'Enter Report Values Manually'}
                </h2>
                <ReportForm
                  entries={entries}
                  patientName={patientName}
                  reportDate={reportDate}
                  labName={labName}
                  onEntriesChange={setEntries}
                  onPatientNameChange={setPatientName}
                  onReportDateChange={setReportDate}
                  onLabNameChange={setLabName}
                />
              </section>

              {/* Confirm & Explain Button */}
              {entries.length > 0 && (
                <button
                  onClick={handleExplain}
                  disabled={isExplaining || validRowsCount === 0}
                  className="w-full py-4 bg-gradient-to-r from-sky-600 to-teal-600 text-white font-bold text-lg rounded-xl hover:from-sky-700 hover:to-teal-700 transition-all shadow-lg shadow-sky-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  aria-label="Confirm and explain my report"
                >
                  {isExplaining ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      MedDecode is reading your report…
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      Confirm & Explain My Report ({validRowsCount} tests)
                    </>
                  )}
                </button>
              )}

              {explainError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700" role="alert">
                  {explainError}
                </div>
              )}
            </div>
          )}

          {/* Results Section */}
          {explainResponse && (
            <div ref={resultsRef} className="space-y-6 animate-in" aria-live="polite">
              {/* Back to Edit Button */}
              <button
                onClick={() => setExplainResponse(null)}
                className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 print:hidden"
                aria-label="Go back to edit report"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Edit Report
              </button>

              {/* Compact Disclaimer above results */}
              <div className="print:hidden">
                <Disclaimer compact />
              </div>

              {/* Summary Cards */}
              <SummaryCards
                results={explainResponse.results}
                overallSummary={explainResponse.overall_summary}
                summaryCounts={explainResponse.summary_counts}
              />

              {/* Save Report to Account (Supabase) */}
              <SaveReportBar
                results={explainResponse.results}
                overallSummary={explainResponse.overall_summary}
                language={language}
                patientName={patientName}
                reportDate={reportDate}
                labName={labName}
                uploadedFile={uploadedFile}
              />

              {/* Individual Explanation Cards */}
              <section className="space-y-4 print:hidden" aria-label="Detailed test explanations">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Detailed Explanations
                </h2>
                {explainResponse.results.map((result, index) => (
                  <ExplanationCard key={`${result.test_name}-${index}`} result={result} language={language} />
                ))}
              </section>

              {/* Doctor Discussion Sheet */}
              <section
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
                aria-label="Doctor discussion sheet section"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 print:hidden">
                  <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Doctor Discussion Sheet
                </h2>
                <DoctorSheet
                  results={explainResponse.results}
                  overallSummary={explainResponse.overall_summary}
                  patientName={patientName}
                  reportDate={reportDate}
                  labName={labName}
                  entries={entries}
                />
              </section>

              {/* Follow-up Questions Box */}
              <section
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 print:hidden"
                aria-label="Ask questions about your report"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Ask About Your Report
                </h2>
                <AskAI entries={entries} language={language} />
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center border-t border-gray-200 print:hidden bg-white">
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
