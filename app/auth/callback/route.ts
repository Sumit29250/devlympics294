import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Open-redirect protection: validate next is a relative path
  const safeNext =
    next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (code) {
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
      console.error('[Auth Callback] Code exchange error:', error.message);
    }
  }

  // If error or no code, redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=Authentication%20failed`);
}
