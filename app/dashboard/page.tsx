"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "@/app/global/styles/globals.css";
import { getLocalProfile } from "../../utils/localStorage";
import { useAuthCheck } from '../../hooks/useAuthCheck';

interface Course {
  course: string;
  status: string;
}

interface CourseSuggestion {
  course: string;
  reason: string;
}

interface AltMajorResult {
  majors: string[];
  minor: string;
}

const supabaseUrl = "https://yutarvvbovvomsbtegrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGFydnZib3Z2b21zYnRlZ3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzcwOTEsImV4cCI6MjA2MDU1MzA5MX0.07f-gbofDPAbeu2UGOAH4DSn2x1YF_5Z4qsKRhKPeMs";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Page() {
  return <DashboardContent />;
}

function DashboardContent() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Course[]>([{
    course: "MATH 1550", status: "Completed" },{
    course: "CS 1101", status: "In Progress" },{
    course: "CS 3102", status: "Planned"
  }]);

  const [courseSuggestions, setCourseSuggestions] = useState<CourseSuggestion[]>([{
    course: "CS 4101", reason: "Advanced Programming" },{
    course: "MATH 3001", reason: "Mathematical Foundations" },{
    course: "PHYS 1001", reason: "Basic Physics for CS"
  }]);

  const [altMajors, setAltMajors] = useState<string[]>([]);
  const [altMinor, setAltMinor] = useState<string>("");
  const [showAltMajor, setShowAltMajor] = useState<boolean>(false);

  const [searchRoadmap, setSearchRoadmap] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<string>("");

  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, hasLocalProfile, isChecking } = useAuthCheck('/login', false);

  useEffect(() => {
    if (!isChecking && !isAuthenticated && !hasLocalProfile && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    if (!isChecking) {
      setIsLoading(false);
    }
  }, [isAuthenticated, hasLocalProfile, isChecking]);

  useEffect(() => {
    const localProfile = getLocalProfile();
    if (localProfile?.name) {
      setUserName(localProfile.name);
    }
  }, []);

  const fetchAltMajors = async () => {
    try {
      const response = await fetch("/api/dashboard", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Response not OK");
      const data: AltMajorResult = await response.json();
      setAltMajors(data.majors);
      setAltMinor(data.minor);
      setShowAltMajor(true);
    } catch (err) {
      alert("Failed to load alternative major suggestions.");
    }
  };

  if (isLoading || isChecking) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div><p className="mt-4 text-lg">Loading...</p></div></div>;
  }

  return (
    <div className="bg-white text-black min-h-screen flex flex-col items-center relative font-[family-name:var(--font-geist-mono)] px-4 sm:px-6">
      <div className="h-16 w-full"></div>
      <div className="w-full max-w-5xl px-0 sm:px-6 pt-0 pb-8 relative">
        <div className="flex justify-start">
          <h1 className="text-2xl font-bold mb-4">Welcome, {userName || 'User'}!</h1>
        </div>
      </div>

      <div className="w-full max-w-5xl px-0 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="border-2 border-gray-200 p-4 rounded-lg shadow-sm min-h-[320px]">
            <h2 className="text-lg sm:text-xl mb-3">Your Course Roadmap</h2>
            <input type="text" placeholder="Search courses" value={searchRoadmap} onChange={e => setSearchRoadmap(e.target.value)} className="w-full p-2 mb-3 border rounded" />
            <ul className="space-y-2 overflow-y-auto max-h-[200px] sm:max-h-[220px]">
              {roadmap.filter(item => item.course.toLowerCase().includes(searchRoadmap.toLowerCase())).map((item, index) => (
                <li key={index} className="p-2 border-b text-sm sm:text-md">
                  <strong>{item.course}</strong> - {item.status}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-2 border-gray-200 p-4 rounded-lg shadow-sm min-h-[320px]">
            <h2 className="text-lg sm:text-xl mb-3">Course Suggestions</h2>
            <input type="text" placeholder="Search suggestions" value={searchSuggestions} onChange={e => setSearchSuggestions(e.target.value)} className="w-full p-2 mb-3 border rounded" />
            <ul className="space-y-2 overflow-y-auto max-h-[200px] sm:max-h-[220px]">
              {courseSuggestions.filter(item => item.course.toLowerCase().includes(searchSuggestions.toLowerCase())).map((item, index) => (
                <li key={index} className="p-2 border-b text-sm sm:text-md">
                  <strong>{item.course}</strong> - {item.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="border-2 border-gray-200 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg w-full text-left">Upload Transcript</h2>
            <div className="w-full flex justify-center">
              <button 
                className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all"
                onClick={() => router.push('/upload')}
              >
                Upload
              </button>
            </div>
          </div>

          <div className="border-2 border-gray-200 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg w-full text-left">Alternative Major</h2>
            <div className="w-full flex justify-center mb-2">
              <button
                onClick={fetchAltMajors}
                className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all"
              >
                Upload
              </button>
            </div>
            {showAltMajor && (
              <div className="text-sm">
                <p className="font-bold">Top 3 Majors:</p>
                <ul className="list-disc list-inside">
                  {altMajors.map((major, i) => (
                    <li key={i}>{major}</li>
                  ))}
                </ul>
                <p className="font-bold mt-2">Suggested Minor:</p>
                <p>{altMinor}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}