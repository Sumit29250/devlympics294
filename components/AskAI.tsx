'use client';

import { useState } from 'react';
import { ReportEntry, Language, AskResponse } from '@/lib/types';
import { askQuestionApi } from '@/lib/api';
import { isEmergencyQuery, getEmergencyNotice } from '@/lib/safety';

interface AskAIProps {
  entries: ReportEntry[];
  language: Language;
}

export default function AskAI({ entries, language }: AskAIProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  // Client-side instant feedback check
  const handleInputChange = (val: string) => {
    setQuestion(val);
    if (isEmergencyQuery(val)) {
      setIsEmergency(true);
      setEmergencyMessage(getEmergencyNotice(language));
    } else if (isEmergency && !val.trim()) {
      setIsEmergency(false);
    }
  };

  const handleAsk = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    // Client-side emergency check
    if (isEmergencyQuery(trimmed)) {
      setIsEmergency(true);
      setEmergencyMessage(getEmergencyNotice(language));
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnswer(null);
    setIsEmergency(false);
    setDemoMode(false);

    try {
      const response = await askQuestionApi({
        question: trimmed,
        language,
        tests: entries,
      });

      if (!response.ok || !response.data) {
        setError(response.error || 'Something went wrong. Please try again.');
        return;
      }

      const data = response.data;

      if (data.emergency) {
        setIsEmergency(true);
        setEmergencyMessage(data.answer);
        return;
      }

      if (response.demoMode) {
        setDemoMode(true);
      }

      setAnswer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAsk();
          }}
          placeholder="e.g., What does low hemoglobin mean?"
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
          aria-label="Ask about your report"
          disabled={isLoading}
        />
        <button
          onClick={handleAsk}
          disabled={isLoading || !question.trim()}
          className="px-5 py-3 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          aria-label="Submit question"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
          Ask
        </button>
      </div>

      {/* Emergency Notice */}
      {isEmergency && (
        <div
          className="bg-red-50 border-2 border-red-300 rounded-xl p-5 animate-in"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0" aria-hidden="true">
              🚨
            </span>
            <div>
              <h4 className="font-bold text-red-800 mb-1">Emergency Medical Warning</h4>
              <p className="text-sm text-red-700 whitespace-pre-line leading-relaxed">{emergencyMessage}</p>
              <div className="mt-3 pt-3 border-t border-red-200 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">
                  📞 India: 112
                </span>
                <span className="inline-flex items-center px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">
                  📞 US: 911
                </span>
                <span className="inline-flex items-center px-2.5 py-1 bg-white text-red-700 border border-red-300 text-xs font-medium rounded-lg">
                  Mental Health: 9152987821 (iCall)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {answer && !isEmergency && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 animate-in" aria-live="polite">
          {demoMode && (
            <div className="mb-3 px-3 py-1 bg-amber-100 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium inline-block">
              🔧 Demo Mode: showing pre-written educational response
            </div>
          )}
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{answer.answer}</p>
          <p className="text-xs text-gray-500 italic mt-3 pt-3 border-t border-sky-200">
            {answer.disclaimer || 'Educational information only. Please consult a doctor.'}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 italic text-center">
        Educational information only. Please consult a doctor.
      </p>
    </div>
  );
}
