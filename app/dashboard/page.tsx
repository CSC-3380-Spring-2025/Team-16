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

// Supabase links
const supabaseUrl = "https://yutarvvbovvomsbtegrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGFydnZib3Z2b21zYnRlZ3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzcwOTEsImV4cCI6MjA2MDU1MzA5MX0.07f-gbofDPAbeu2UGOAH4DSn2x1YF_5Z4qsKRhKPeMs";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Page() {
  return <DashboardContent />;
}

// Separate the dashboard content into its own component
function DashboardContent() {
  // 1. All hooks must be called unconditionally and in the same order
  const router = useRouter();
  
  // 2. Define all state variables first
  const [roadmap, setRoadmap] = useState<Course[]>([
    { course: "MATH 1550", status: "Completed" },
    { course: "CS 1101", status: "In Progress" },
    { course: "CS 3102", status: "Planned" },
  ]);
  
  const [courseSuggestions, setCourseSuggestions] = useState<CourseSuggestion[]>([
    { course: "CS 4101", reason: "Advanced Programming" },
    { course: "MATH 3001", reason: "Mathematical Foundations" },
    { course: "PHYS 1001", reason: "Basic Physics for CS" },
  ]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestionSearchTerm, setSuggestionSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  // 3. Use the auth hook
  const { isAuthenticated, hasLocalProfile, isChecking } = useAuthCheck('/login', false);
  
  // 4. Define all effects
  // Handle authentication redirect
  useEffect(() => {
    if (!isChecking && !isAuthenticated && !hasLocalProfile && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    if (!isChecking) {
      setIsLoading(false);
    }
  }, [isAuthenticated, hasLocalProfile, isChecking]);
  
  // Get user data from Supabase
  useEffect(() => {
    const getUser = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    // Get user's name from local storage
    const getLocalData = () => {
      const localProfile = getLocalProfile();
      if (localProfile?.name) {
        setUserName(localProfile.name);
      }
    };

    getUser();
    getLocalData();
  }, []);

  // Listen for local storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const localProfile = getLocalProfile();
      if (localProfile?.name) {
        setUserName(localProfile.name);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      const interval = setInterval(handleStorageChange, 2000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, []);
  
  // 5. Define all event handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSuggestionSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuggestionSearchTerm(e.target.value);
  };
  
  // 6. Derived values
  const filteredCourses = roadmap.filter(course =>
    course.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter suggestions by search
  const filteredSuggestions = courseSuggestions.filter(suggestion =>
    suggestion.course.toLowerCase().includes(suggestionSearchTerm.toLowerCase())
  );
  
  // 7. Conditional rendering
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // 8. Main render
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