'use client';

import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-xs print:hidden">
      <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" aria-label="MedDecode Home">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-teal-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-600 to-teal-600 bg-clip-text text-transparent">
              MedDecode
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              Understand your medical report, confidently.
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
