'use client';

import { useState, useEffect } from 'react';
import { ExplanationResult, Language } from '@/lib/types';

interface ExplanationCardProps {
  result: ExplanationResult;
  language: Language;
}

const statusConfig: Record<
  ExplanationResult['status'],
  { color: string; bg: string; label: string; border: string }
> = {
  normal: {
    color: 'text-green-800',
    bg: 'bg-green-100',
    label: '✓ Normal',
    border: 'border-green-200',
  },
  slightly_high: {
    color: 'text-amber-800',
    bg: 'bg-yellow-100',
    label: '↑ Slightly High (Please verify)',
    border: 'border-yellow-200',
  },
  slightly_low: {
    color: 'text-amber-800',
    bg: 'bg-yellow-100',
    label: '↓ Slightly Low (Please verify)',
    border: 'border-yellow-200',
  },
  high: {
    color: 'text-red-800',
    bg: 'bg-red-100',
    label: '↑↑ High (Needs attention)',
    border: 'border-red-200',
  },
  low: {
    color: 'text-red-800',
    bg: 'bg-red-100',
    label: '↓↓ Low (Needs attention)',
    border: 'border-red-200',
  },
  unclear: {
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    label: '? Unclear',
    border: 'border-gray-200',
  },
};

export default function ExplanationCard({ result, language }: ExplanationCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const config = statusConfig[result.status] || statusConfig.unclear;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setHasSpeechSupport(true);
    }

    return () => {
      // Clean up speech on unmount
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = () => {
    if (!hasSpeechSupport || typeof window === 'undefined') return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = [
      `${result.test_name}.`,
      `Your value is ${result.value} ${result.unit}.`,
      result.reference_range ? `Reference range is ${result.reference_range}.` : '',
      result.simple_meaning,
      result.urgency_note,
    ]
      .filter(Boolean)
      .join(' ');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (language === 'hindi' || language === 'hinglish') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <article
      className={`bg-white rounded-xl border-2 ${config.border} shadow-sm overflow-hidden transition-all hover:shadow-md`}
      aria-label={`Explanation for ${result.test_name}`}
    >
      <div className="p-4 sm:p-5">
        {/* Header: Test Name, Value, Range, Status, Speech */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{result.test_name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xl font-bold text-gray-900">{result.value}</span>
              {result.unit && <span className="text-sm text-gray-500">{result.unit}</span>}
              {result.reference_range && (
                <span className="text-xs text-gray-400">| Ref: {result.reference_range}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}
            >
              {config.label}
            </span>
            {hasSpeechSupport && (
              <button
                onClick={handleSpeak}
                className={`p-2 rounded-full transition-colors ${
                  isSpeaking
                    ? 'bg-sky-100 text-sky-600 ring-2 ring-sky-400'
                    : 'bg-gray-100 text-gray-500 hover:bg-sky-50 hover:text-sky-600'
                }`}
                aria-label={isSpeaking ? `Stop reading ${result.test_name}` : `Listen to explanation of ${result.test_name}`}
                title={isSpeaking ? 'Stop reading' : 'Listen'}
              >
                {isSpeaking ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Section 1: What This Test Measures */}
        {result.what_test_measures && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              What this test measures
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">{result.what_test_measures}</p>
          </div>
        )}

        {/* Section 2: What This Result May Mean */}
        {result.simple_meaning && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              What this result may mean
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">{result.simple_meaning}</p>
          </div>
        )}

        {/* Section 3: Possible General Reasons */}
        {result.possible_general_reasons && result.possible_general_reasons.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Possible general reasons
            </h4>
            <ul className="space-y-1">
              {result.possible_general_reasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-sky-500 mt-1" aria-hidden="true">
                    •
                  </span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 4: Questions to Ask Your Doctor */}
        {result.questions_for_doctor && result.questions_for_doctor.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Questions to ask your doctor
            </h4>
            <ul className="space-y-1">
              {result.questions_for_doctor.map((q, idx) => (
                <li key={idx} className="text-sm text-teal-800 flex items-start gap-2">
                  <span className="text-teal-500 mt-0.5" aria-hidden="true">
                    💬
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 5: Important Note */}
        {result.urgency_note && (
          <div className={`mt-3 p-3 rounded-lg ${config.bg} border ${config.border}`}>
            <p className={`text-xs font-medium ${config.color}`}>
              <span className="font-semibold">Important note:</span> {result.urgency_note}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
