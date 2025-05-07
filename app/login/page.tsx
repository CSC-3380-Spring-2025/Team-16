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
  
  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    // Only run this on the client side
    if (typeof window === 'undefined') return;
    
    // Don't redirect if we're on the login page with a redirect parameter
    // This prevents redirect loops
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('redirect')) {
      return;
    }
    
    // Create a flag to track if we're already redirecting
    let mounted = true;
    let redirectInProgress = false;
    
    const checkAuthAndRedirect = async () => {
      // Don't proceed if component is unmounted or redirect is in progress
      if (!mounted || redirectInProgress) return;
      
      try {        
        // Check auth state directly with Supabase
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user;
        
        if (currentUser && mounted && !redirectInProgress) {
          console.log('Login page: User is already authenticated, redirecting to dashboard');
          redirectInProgress = true;
          
          // Use Next.js router for client-side navigation with a small delay
          setTimeout(() => {
            if (mounted) {
              router.push('/dashboard');
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error checking auth state in login page:', error);
      }
    };
    
    // Check if user is authenticated from context
    if (!isLoading) {
      if (user && !redirectInProgress) {
        // User is authenticated according to context
        console.log('Login page: User authenticated from context, redirecting to dashboard');
        redirectInProgress = true;
        
        // Use setTimeout to avoid immediate redirect that might cause issues
        setTimeout(() => {
          if (mounted) {
            router.push('/dashboard');
          }
        }, 100);
      } else if (!redirectInProgress) {
        // No user in context, check with Supabase directly
        checkAuthAndRedirect();
      }
    }
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      mounted = false;
    };
  }, [isLoading, user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    // Validate email format
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

    // Validate password length for login/signup
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
            // Clear password on error
            setPassword('');
            setConfirmPassword('');
            setLoading(false);
          } else {
            // Show success message and redirect to dashboard
            setStatus('Account created successfully! Redirecting...');
            
            // Store authentication state in localStorage
            localStorage.setItem('isAuthenticated', 'true');
            
            // Force immediate navigation to dashboard
            window.location.href = '/dashboard';
          }
        }
      } else {
        // Validate password
        if (!password) {
          setStatus('Password is required');
          setLoading(false);
        } else {
          // Sign in with email and password
          const { error } = await signIn(email, password);
          
          if (error) {
            setStatus(`Error: ${error.message}`);
            // Clear password on error
            setPassword('');
            setLoading(false);
          } else {
            // Show success message
            setStatus('Sign in successful! Redirecting...');
            
            // Store authentication state in localStorage
            localStorage.setItem('isAuthenticated', 'true');
            
            // Force immediate navigation to dashboard
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
      // Clear password fields on any error
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