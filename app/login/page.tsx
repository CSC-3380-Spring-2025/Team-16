"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from 'next/navigation';

// Supabase links
const supabase = createClient(
  "https://yutarvvbovvomsbtegrk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGFydnZib3Z2b21zYnRlZ3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzcwOTEsImV4cCI6MjA2MDU1MzA5MX0.07f-gbofDPAbeu2UGOAH4DSn2x1YF_5Z4qsKRhKPeMs"
);

export default function Page() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Handles hash-based auth
    const handleHashBasedAuth = async () => {
      if (window.location.hash && window.location.hash.includes('access_token=')) {
        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (!error) {
            router.push('/dashboard');
            return;
          }
        }
      }
    };

    // Check for hash-based auth first
    handleHashBasedAuth();

    // Then checks for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
      if (session) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setStatus(null);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          shouldCreateUser: true
        },
      });

      if (error) {
        setStatus(error.message);
      } else {
        setStatus('Check your email for the login link!');
      }
    } catch (error) {
      setStatus('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="section-container flex items-center align-items-center justify-center sm:flex-row gap-8" style={{ margin: 'auto'}}>
          <div className="flex flex-col items-center sm:flex-row" style={{ margin: "auto" }}>
            <Image
              src="/logo.svg"
              alt="ScheduleLSU logo"
              width={100}
              height={100}
              style={{ transform: 'rotate(90deg)' }}
              priority
            />
            <div style={{ height: 100 }} className="flex justify-center items-center text-lg lg:text-base h-10 font-[family-name:helvetica]">
              <p style={{ fontSize: "28px" }}>ScheduleLSU</p>
            </div>
          </div>
          <form onSubmit={handleSignIn} className="font-[family-name:var(--font-geist-mono)]">
            <p className="special-header text-lg m-4 text-center justify-center align-center font-[family-name:var(--font-geist-mono)]">Sign in</p>
            <p>LSU Email:</p>
            <input
              type="email"
              name="email"
              className="text-input-field mb-4"
              placeholder="studentID@lsu.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex justify-center">
              <button
                type="submit"
                className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Sending link..." : "Sign In"}
              </button>
            </div>
            {status && (
              <p className="mt-4 text-sm text-center">{status}</p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}