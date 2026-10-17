'use client';

import { Language } from '@/lib/types';

interface LanguageSelectorProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const languages: { value: Language; label: string; icon: string }[] = [
  { value: 'english', label: 'English', icon: '🇬🇧' },
  { value: 'hindi', label: 'हिंदी', icon: '🇮🇳' },
  { value: 'hinglish', label: 'Hinglish', icon: '🌐' },
];

export default function LanguageSelector({ language, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="Select language">
      <span className="text-sm text-gray-600 font-medium mr-1">Language:</span>
      {languages.map((lang) => (
        <button
          key={lang.value}
          onClick={() => onLanguageChange(lang.value)}
          role="radio"
          aria-checked={language === lang.value}
          aria-label={`Select ${lang.label}`}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            language === lang.value
              ? 'bg-sky-500 text-white shadow-md shadow-sky-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="mr-1">{lang.icon}</span>
          {lang.label}
        </button>
      ))}
    </div>
  );
}
