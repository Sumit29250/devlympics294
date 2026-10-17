'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { User } from '@supabase/supabase-js';

export default function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check initial user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // In guest mode (Supabase not configured), hide Auth button completely
  if (!configured) {
    return null;
  }

  if (loading) {
    return <div className="w-16 h-8 bg-gray-100 rounded-full animate-pulse" />;
  }

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setMenuOpen(false);
      router.push('/');
      router.refresh();
    }
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-full hover:bg-sky-100 transition-colors shadow-2xs"
        aria-label="Sign in to your account"
      >
        Sign in
      </Link>
    );
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Account';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
        aria-expanded={menuOpen}
        aria-haspopup="true"
        aria-label="User account menu"
      >
        <span className="w-5 h-5 rounded-full bg-gradient-to-r from-sky-500 to-teal-500 text-white flex items-center justify-center text-xs font-bold">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[100px] sm:max-w-[140px] truncate">{displayName}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in">
          <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-500 truncate">
            {user.email}
          </div>

          <Link
            href="/history"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
          >
            <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Saved Reports
          </Link>

          <Link
            href="/trends"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
          >
            <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Trends
          </Link>

          <div className="border-t border-gray-100 my-1" />

          <button
            onClick={handleSignOut}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
