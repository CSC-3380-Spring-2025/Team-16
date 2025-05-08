"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword, user, isLoading } = useAuth();
  const router = useRouter();
  
  // Redirect if already logged in
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Don't redirect if there's a redirect link
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('redirect')) return;
    
    let mounted = true;
    let redirecting = false;
    
    const checkAuth = async () => {
      if (!mounted || redirecting) return;
      
      try {        
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user;
        
        if (currentUser && mounted && !redirecting) {
          console.log('User authenticated, redirecting');
          redirecting = true;
          
          setTimeout(() => {
            if (mounted) router.push('/dashboard');
          }, 100);
        }
      } catch (error) {
        console.log('Auth check error:', error);
      }
    };
    
    if (!isLoading) {
      if (user && !redirecting) {
        console.log('User found in context');
        redirecting = true;
        
        setTimeout(() => {
          if (mounted) router.push('/dashboard');
        }, 100);
      } else if (!redirecting) {
        checkAuth();
      }
    }
    
    return () => { mounted = false; };
  }, [isLoading, user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    // Check if email looks right
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    // Handle password reset request
    if (isResetPassword) {
      try {
        const { error } = await resetPassword(email);
        
        if (error) {
          setStatus(`Error: ${error.message}`);
        } else {
          setStatus('Password reset email sent! Please check your inbox.');
        }
      } catch (error) {
        console.error('Error sending reset email:', error);
        if (error instanceof Error) {
          setStatus(`Error: ${error.message}`);
        } else {
          setStatus('An error occurred while sending the reset email.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Check if password is long enough
    if (password.length < 6) {
      setStatus('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setStatus('Passwords do not match');
          setLoading(false);
        } else {
          // Sign up with email and password
          const { error } = await signUp(email, password);
          
          if (error) {
            setStatus(`Error: ${error.message}`);
            // Clears password when there's an error
            setPassword('');
            setConfirmPassword('');
            setLoading(false);
          } else {
            setStatus('Account created successfully! Redirecting...');
            localStorage.setItem('isAuthenticated', 'true');
            window.location.href = '/dashboard';
          }
        }
      } else {
        if (!password) {
          setStatus('Password is required');
          setLoading(false);
        } else {
          const { error } = await signIn(email, password);
          
          if (error) {
            setStatus(`Error: ${error.message}`);
            setPassword('');
            setLoading(false);
          } else {
            setStatus('Sign in successful! Redirecting...');
            localStorage.setItem('isAuthenticated', 'true');
            window.location.href = '/dashboard';
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('An unknown error occurred. Please try again.');
      }
      setPassword('');
      if (isSignUp) {
        setConfirmPassword('');
      }
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
          <form onSubmit={handleAuth} className="font-[family-name:var(--font-geist-mono)]">
            <p className="special-header text-lg m-4 text-center justify-center align-center font-[family-name:var(--font-geist-mono)]">
              {isResetPassword ? "Reset Password" : (isSignUp ? "Create Account" : "Sign in")}
            </p>
            
            <p>LSU Email:</p>
            <input
              type="email"
              name="email"
              className="text-input-field mb-4"
              placeholder="studentID@lsu.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            {!isResetPassword && (
              <>
                <p>Password:</p>
                <input
                  type="password"
                  name="password"
                  className="text-input-field mb-4"
                  placeholder={isSignUp ? "Create a password" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isResetPassword}
                />
              </>
            )}
            
            {isSignUp && (
              <>
                <p>Confirm Password:</p>
                <input
                  type="password"
                  name="confirmPassword"
                  className="text-input-field mb-4"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </>
            )}
            
            <div className="flex justify-center mt-4">
              <button
                type="submit"
                className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (isResetPassword ? "Sending Reset Email..." : (isSignUp ? "Creating Account..." : "Signing In...")) : (isResetPassword ? "Send Reset Email" : (isSignUp ? "Create Account" : "Sign In"))}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              {isResetPassword ? (
                <button 
                  type="button" 
                  className="text-blue-600 hover:underline text-sm"
                  onClick={() => {
                    setIsResetPassword(false);
                    setStatus(null);
                  }}
                >
                  Back to Sign In
                </button>
              ) : (
                <>
                  <button 
                    type="button" 
                    className="text-blue-600 hover:underline text-sm mr-4"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setStatus(null);
                      setPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    {isSignUp 
                      ? "Already have an account? Sign in" 
                      : "Don't have an account? Create one"}
                  </button>
                  
                  {!isSignUp && (
                    <button 
                      type="button" 
                      className="text-blue-600 hover:underline text-sm"
                      onClick={() => {
                        setIsResetPassword(true);
                        setStatus(null);
                        setPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </>
              )}
            </div>
            
            {status && (
              <div className={`mt-4 p-3 rounded-md text-sm text-center ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {status}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}