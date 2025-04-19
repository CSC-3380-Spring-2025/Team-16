import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase links
const supabase = createClient(
  "https://yutarvvbovvomsbtegrk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGFydnZib3Z2b21zYnRlZ3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzcwOTEsImV4cCI6MjA2MDU1MzA5MX0.07f-gbofDPAbeu2UGOAH4DSn2x1YF_5Z4qsKRhKPeMs"
);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  try {
    // Get auth code from URL
    const code = requestUrl.searchParams.get('code');
    if (code) {
      // Exchange code for auth tokens
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Redirect to dashboard on success
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
      }
      throw error;
    }

    // Get tokens from URL hash
    const urlWithHash = request.headers.get('referer') || request.url;
    if (urlWithHash.includes('#access_token=')) {
      const [, fragment] = urlWithHash.split('#');
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        // Set session using tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (!error) {
          // Redirect to dashboard on success
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
        }
        throw error;
      }
    }

    // If no auth info found, throws an error
    throw new Error('No authentication credentials found');
  } catch (error) {
    console.error('Auth error:', error);
    // Redirect to login on failure
    return NextResponse.redirect(new URL('/login?error=auth_error', requestUrl.origin));
  }
}