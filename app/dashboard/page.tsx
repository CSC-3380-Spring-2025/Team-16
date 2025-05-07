"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "@/app/global/styles/globals.css";
import { getLocalProfile, getLocalTranscript } from "../../utils/localStorage";
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

function DashboardContent(): JSX.Element {
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
  const [searchTerm, setSearchTerm] = useState("");

  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [currentCourses, setCurrentCourses] = useState<string[]>([]);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [rawTranscriptData, setRawTranscriptData] = useState<any[]>([]);
  const [totalCreditHours, setTotalCreditHours] = useState<number>(0);
  
  // Use the auth hook
  const { isAuthenticated, hasLocalProfile, isChecking } = useAuthCheck('/login', false);

  useEffect(() => {
    if (!isChecking && !isAuthenticated && !hasLocalProfile && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    if (!isChecking) {
      setIsLoading(false);
    }
  }, [isChecking, isAuthenticated, hasLocalProfile]);

  
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
      
      // Get transcript data
      const transcriptData = getLocalTranscript();
      setTranscript(transcriptData);
      
      // Extract current courses (IP) and completed courses
      if (transcriptData) {
        setCurrentCourses(transcriptData.IP || []);
        
        // Extract all completed courses from all semesters
        const allCompleted: string[] = [];
        if (Array.isArray(transcriptData.Completed)) {
          transcriptData.Completed.forEach((semesterData: string) => {
            const match = semesterData.match(/Semester \d+:\[(.*)\]/);
            if (match && match[1]) {
              const courses = match[1].split(',').map((course: string) => course.trim());
              allCompleted.push(...courses);
            }
          });
        }
        setCompletedCourses(allCompleted);
        
        // Get raw transcript data if available
        if (transcriptData._rawData && Array.isArray(transcriptData._rawData)) {
          setRawTranscriptData(transcriptData._rawData);
        }
      }
    };

    getUser();
    getLocalData();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const localProfile = getLocalProfile();
      if (localProfile?.name) {
        setUserName(localProfile.name);
      }
      
      // Update transcript data on storage change
      const transcriptData = getLocalTranscript();
      setTranscript(transcriptData);
      
      // Extract current courses (IP) and completed courses
      if (transcriptData) {
        setCurrentCourses(transcriptData.IP || []);
        
        // Extract all completed courses from all semesters
        const allCompleted: string[] = [];
        if (Array.isArray(transcriptData.Completed)) {
          transcriptData.Completed.forEach((semesterData: string) => {
            const match = semesterData.match(/Semester \d+:\[(.*)\]/);
            if (match && match[1]) {
              const courses = match[1].split(',').map((course: string) => course.trim());
              allCompleted.push(...courses);
            }
          });
        }
        setCompletedCourses(allCompleted);
        
        // Get raw transcript data if available
        if (transcriptData._rawData && Array.isArray(transcriptData._rawData)) {
          setRawTranscriptData(transcriptData._rawData);
        }
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

  // Filter suggestions by search
  const filteredSuggestions = courseSuggestions.filter(suggestion =>
    suggestion.course.toLowerCase().includes(searchSuggestions.toLowerCase())
  );
  
  // Calculate total credit hours from transcript data
  const getCreditHours = () => {
    if (!rawTranscriptData || !Array.isArray(rawTranscriptData) || rawTranscriptData.length === 0) {
      return 0;
    }
    
    return rawTranscriptData.reduce((total, course) => {
      // Only count courses that have been completed (not IP)
      if (course.GR !== 'IP' && course.CARR !== 'IP') {
        // Use EARN field for credit hours, convert to number
        const earnedCredits = parseFloat(course.EARN) || 0;
        return total + earnedCredits;
      }
      return total;
    }, 0);
  };
  
  // Conditional rendering
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
          <div className="border-2 border-gray-200 p-4 rounded-lg shadow-sm" style={{ height: '320px' }}>
            <h2 className="text-lg sm:text-xl mb-3">Your Current Courses</h2>
            <input
              type="text"
              placeholder="Search current courses"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded mb-3 text-sm sm:text-md bg-gray-50"
            />
            {rawTranscriptData && rawTranscriptData.length > 0 ? (
              // Display courses from raw transcript data
              <ul className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 80px)' }}>
                {rawTranscriptData
                  .filter(course => course.GR === "IP" || course.CARR === "IP") // Find in-progress courses
                  .filter(course => {
                    const courseCode = `${course.DEPT} ${course.CRSE}`;
                    const courseTitle = course.TITLE || "";
                    return courseCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
                  })
                  .map((course, index) => {
                    const courseCode = `${course.DEPT} ${course.CRSE}`;
                    const courseTitle = course.TITLE || "Course";
                    
                    return (
                      <li key={index} className="p-2 border-b text-sm sm:text-md">
                        <strong>{courseCode}</strong> - {courseTitle}
                      </li>
                    );
                  })}
              </ul>
            ) : (
              // No current courses in transcript
              <div className="flex flex-col items-center justify-center h-[200px]">
                <p className="text-sm text-gray-500">No current courses found.</p>
              </div>
            )}
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
          {/* Upload Transcript Box */}
          <div className="border-2 border-gray-200 p-4 rounded-lg shadow-sm flex flex-col items-center justify-between" style={{ minHeight: '120px' }}>
            <h2 className="text-lg w-full text-left mb-3">Upload Transcript</h2>
            <div className="w-full flex justify-center">
              <button 
                className="button text-sm flex items-center gap-1 hover:brightness-95 active:scale-[0.98] transition-all"
                onClick={() => router.push('/upload')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload
              </button>
            </div>
          </div>
          
          {/* Degree Progress Box */}
          <div className="border-2 border-gray-200 p-4 rounded-lg shadow-sm" style={{ height: '160px' }}>
            <h2 className="text-lg sm:text-xl mb-3">Degree Progress</h2>
            <div className="flex flex-col justify-center h-[calc(100%-2rem)]">
              {/* Progress display */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium">{Math.round((getCreditHours() / 120) * 100)}%</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-md h-2.5 mb-6">
                <div 
                  className="h-2.5 rounded-md" 
                  style={{ width: `${Math.min(Math.max((getCreditHours() / 120) * 100, 0), 100)}%`, backgroundColor: '#0d93c4' }}
                ></div>
              </div>
              
              {/* Simple message */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                Based on your earned credit hours
              </div>
            </div>
          </div>

          {/* Alternative Major Box */}
          <div className="border-2 border-gray-200 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg sm:text-xl mb-3">Alternative Major</h2>
            <div className="w-full flex justify-center mb-2">
              <button
                onClick={fetchAltMajors}
                className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all"
              >
                Get Suggestions
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