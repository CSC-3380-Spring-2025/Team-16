"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasResetToken, setHasResetToken] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Look for reset token
    const checkForResetToken = async () => {
      try {
        // Get hash from URL
        const hash = window.location.hash;
        
        if (hash && hash.includes('type=recovery')) {
          console.log('Reset token detected in URL');
          setHasResetToken(true);
        } else {
          console.log('No reset token found in URL');
        }
      } catch (error) {
        console.error('Error checking for reset token:', error);
      }
    };

    checkForResetToken();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setStatus(null);
      
      if (!newPassword || !confirmPassword) {
        setStatus('Error: All fields are required');
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setStatus('Error: Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setStatus('Error: Passwords do not match');
        setLoading(false);
        return;
      }

      // Change password
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        console.error('Error updating password:', error);
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('Password updated successfully! Redirecting to login...');
        
        // Sign out user
        await supabase.auth.signOut();
        
        // Go to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error during password reset:', error);
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Keep user on page during reset
  useEffect(() => {
    if (hasResetToken) {
      // Show warning if leaving
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        const message = 'You need to complete your password reset before leaving this page.';
        e.preventDefault();
        e.returnValue = message;
        return message;
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [hasResetToken]);

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-[calc(100vh-56px)] p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
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
          
          {!hasResetToken ? (
            <div className="font-[family-name:var(--font-geist-mono)] text-center">
              <p className="special-header text-lg m-4 text-center justify-center align-center font-[family-name:var(--font-geist-mono)]">
                Reset Password
              </p>
              <p className="mb-4">
                If you've received a password reset email, please click the link in the email.
              </p>
              <Link
                href="/login"
                className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="font-[family-name:var(--font-geist-mono)]">
              <p className="special-header text-lg m-4 text-center justify-center align-center font-[family-name:var(--font-geist-mono)]">
                Reset Your Password
              </p>
              
              <p>New Password:</p>
              <input
                type="password"
                name="newPassword"
                className="text-input-field mb-4"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              
              <p>Confirm Password:</p>
              <input
                type="password"
                name="confirmPassword"
                className="text-input-field mb-4"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Updating Password..." : "Update Password"}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Back to Sign In
                </Link>
              </div>
              
              {status && (
                <div className={`mt-4 p-3 rounded text-center ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {status}
                </div>
              )}
            </form>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
