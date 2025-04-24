"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "@/app/global/styles/globals.css";
import { getLocalProfile } from "../../utils/localStorage";

interface Course {
  course: string;
  status: string;
}

// Supabase links
const supabaseUrl = "https://yutarvvbovvomsbtegrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGFydnZib3Z2b21zYnRlZ3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzcwOTEsImV4cCI6MjA2MDU1MzA5MX0.07f-gbofDPAbeu2UGOAH4DSn2x1YF_5Z4qsKRhKPeMs";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Page() {
  const [roadmap, setRoadmap] = useState<Course[]>([
    { course: "MATH 1550", status: "Completed" },
    { course: "CS 1101", status: "In Progress" },
    { course: "CS 3102", status: "Planned" },
  ]);

  const router = useRouter();

  // Course suggestions
  const courseSuggestionsData = [
    { course: "CS 4101", reason: "Advanced Programming" },
    { course: "MATH 3001", reason: "Mathematical Foundations" },
    { course: "PHYS 1001", reason: "Basic Physics for CS" },
  ];

  const [courseSuggestions, setCourseSuggestions] = useState(courseSuggestionsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestionSearchTerm, setSuggestionSearchTerm] = useState("");

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");

  // Get user data and profile from Supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setProfile(data);
      }
    };

    getUser();
    
    // Get user's name from local storage
    const localProfile = getLocalProfile();
    if (localProfile?.name) {
      setUserName(localProfile.name);
    }
  }, []);

  // Update username when it changes in local storage
  useEffect(() => {
    const handleStorageChange = () => {
      const localProfile = getLocalProfile();
      if (localProfile?.name) {
        setUserName(localProfile.name);
      }
    };
    
    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Check periodically for changes
    const interval = setInterval(handleStorageChange, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Search input for courses
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  // Search input for course suggestions
  const handleSuggestionSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSuggestionSearchTerm(e.target.value);
  };

  // Filter courses by search
  const filteredCourses = roadmap.filter(course =>
    course.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter suggestions by search
  const filteredSuggestions = courseSuggestions.filter(suggestion =>
    suggestion.course.toLowerCase().includes(suggestionSearchTerm.toLowerCase())
  );

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
            <input
              type="text"
              placeholder="Search courses"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-2 border rounded mb-3 text-sm sm:text-md bg-gray-50"
            />
            <ul className="space-y-2 overflow-y-auto max-h-[200px] sm:max-h-[220px]">
              {filteredCourses.map((item, index) => (
                <li key={index} className="p-2 border-b">
                  <span className="text-sm sm:text-md">
                    <strong>{item.course}</strong> - {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-2 border-gray-200 p-4 rounded-lg shadow-sm min-h-[320px]">
            <h2 className="text-lg sm:text-xl mb-3">Course Suggestions</h2>
            <input
              type="text"
              placeholder="Search suggestions"
              value={suggestionSearchTerm}
              onChange={handleSuggestionSearch}
              className="w-full p-2 border rounded mb-3 text-sm sm:text-md bg-gray-50"
            />
            <ul className="space-y-2 overflow-y-auto max-h-[200px] sm:max-h-[220px]">
              {filteredSuggestions.map((item, index) => (
                <li key={index} className="p-2 border-b text-sm sm:text-md">
                  <strong>{item.course}</strong> - {item.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="border-2 border-gray-200 p-6 rounded-lg shadow-sm flex flex-col items-center justify-between" style={{ minHeight: '140px' }}>
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
        </div>
      </div>
    </div>
  );
}