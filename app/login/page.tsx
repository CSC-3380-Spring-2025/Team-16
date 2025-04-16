"use client";
import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  "https://hofhaamlvsijnvticmif.supabase.co", // Supabase URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmhhYW1sdnNpam52dGljbWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzOTczMjUsImV4cCI6MjA1Njk3MzMyNX0.Zv3iiqsSUyYVf8xq9eRuc4SF34_sD5QN-TJ36fxEHFE" // Supabase anon key
);

export default function Page() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleLoginAttempt = async () => {
    if (!email) return;

    setStatus(null);
    setShowCodeInput(false);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (res.ok) {
        setStatus("Verification code sent to your email.");
        setShowCodeInput(true);
      } else {
        setStatus(result.error || "Failed to send verification email.");
      }
    } catch (err) {
      console.error(err);
      setStatus("An unexpected error occurred.");
    }
  };

  const handleCodeSubmit = async () => {
    try {
      const res = await fetch("/api/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, encrypted: verificationCode }),
      });

      const result = await res.json();

      if (res.ok && result.verified) {
        // Log the successful login attempt to Supabase
        const { error } = await supabase.from("login_attempts").insert([{ email }]);
        if (error) {
          setStatus(`Supabase error: ${error.message}`);
        } else {
          setStatus("Verification successful and login recorded.");
          setShowCodeInput(false);
        }
      } else {
        setStatus("Invalid code. Try again.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Server error during verification.");
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
          <div className="font-[family-name:var(--font-geist-mono)]">
            <p className="special-header text-lg m-4 text-center justify-center align-center font-[family-name:var(--font-geist-mono)]">Sign in</p>
            <p>LSU Email:</p>
            <input
              name="emailField"
              className="text-input-field mb-4"
              placeholder="studentID@lsu.edu"
              maxLength={50}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="text-center">
              <button className="button" onClick={handleLoginAttempt}>Continue</button>
            </div>

            {/* After Email Verification is complete*/}
            {showCodeInput && (
              <div className="mt-4">
                <p>Enter the verification code sent to your email:</p>
                <input
                  className="text-input-field mb-2"
                  maxLength={5}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
                <div className="text-center">
                  <button className="button" onClick={handleCodeSubmit}>Verify Code</button>
                </div>
              </div>
            )}

            {status && <p className="text-sm mt-2 text-center">{status}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
