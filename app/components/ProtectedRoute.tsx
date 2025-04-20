// components/ProtectedRoute.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://hofhaamlvsijnvticmif.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmhhYW1sdnNpam52dGljbWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzOTczMjUsImV4cCI6MjA1Njk3MzMyNX0.Zv3iiqsSUyYVf8xq9eRuc4SF34_sD5QN-TJ36fxEHFE"
);

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) return <div className="text-center mt-20">Checking login...</div>;

  return <>{children}</>;
}
