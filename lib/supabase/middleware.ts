import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured, getSupabaseEnv } from './config';

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, run in guest-only mode
  if (!isSupabaseConfigured()) {
    // If trying to access history or trends when Supabase is not configured, redirect home
    if (
      request.nextUrl.pathname.startsWith('/history') ||
      request.nextUrl.pathname.startsWith('/trends')
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT use getSession(); getUser() safely validates with the Supabase auth server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedPath =
    request.nextUrl.pathname.startsWith('/history') ||
    request.nextUrl.pathname.startsWith('/trends');

  if (isProtectedPath && !user) {
    // Relative redirect path with open-redirect protection
    const redirectUrl = new URL('/login', request.url);
    const nextPath = request.nextUrl.pathname + request.nextUrl.search;
    if (nextPath.startsWith('/') && !nextPath.startsWith('//')) {
      redirectUrl.searchParams.set('next', nextPath);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated user visits /login, redirect to next or home
  if (request.nextUrl.pathname === '/login' && user) {
    const rawNext = request.nextUrl.searchParams.get('next');
    const safeNext =
      rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/history';
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return supabaseResponse;
}
