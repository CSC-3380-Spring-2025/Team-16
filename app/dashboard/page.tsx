"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "@/app/global/styles/globals.css";
import { getLocalProfile, getLocalTranscript } from "../../utils/localStorage";
import { useAuthCheck } from '../../hooks/useAuthCheck';
import { parseTranscriptFromSupabase, getLastSemesterCourses, extractCourseInfo } from "../../utils/transcriptFormatter";

interface Course {
  course: string;
  status: string;
  title?: string;
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
  
  const [majorProgress, setMajorProgress] = useState({
    completedCourses: 0,
    totalCourses: 40, // Default estimate for a typical degree
    percentage: 0
  });
  
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
      console.log('Fetching user data and processing transcript...');
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
          
          // Extract current classes from transcript data
          if (data?.credit) {
            try {
              // Parse the transcript data
              const transcriptData = parseTranscriptFromSupabase(data.credit);
              
              // Get the last semester's courses
              const lastSemesterCourses = getLastSemesterCourses(transcriptData);
              
              // Get the raw transcript data to extract course names
              console.log('Checking for rawTranscriptData in localStorage...');
              const rawTranscriptStr = localStorage.getItem('rawTranscriptData');
              console.log('rawTranscriptData exists:', !!rawTranscriptStr);
              
              if (rawTranscriptStr) {
                try {
                  console.log('rawTranscriptStr length:', rawTranscriptStr.length);
                  console.log('First 100 chars of rawTranscriptStr:', rawTranscriptStr.substring(0, 100));
                  
                  // Parse the raw transcript data
                  const rawData = JSON.parse(rawTranscriptStr);
                  console.log('rawData structure:', Object.keys(rawData));
                  
                  // Extract course names from the transcript text
                  const courseMap = extractCourseInfo(rawData);
                  console.log('Extracted course map:', courseMap);
                  console.log('Number of courses extracted:', Object.keys(courseMap).length);
                  
                  // Update the roadmap with the last semester's courses
                  if (lastSemesterCourses.length > 0) {
                    console.log('Last semester courses:', lastSemesterCourses);
                    
                    // Create a mapping of course codes to course names
                    const currentClasses = lastSemesterCourses.map(course => {
                      // Normalize the course code for consistent lookup
                      const normalizedCode = course.replace(/"/g, '').trim();
                      
                      // Look up the course name in our extracted map
                      const courseName = courseMap[normalizedCode] || '';
                      
                      return {
                        course: normalizedCode,
                        status: "Current",
                        title: courseName
                      };
                    });
                    
                    // Update the roadmap with the current classes
                    setRoadmap(currentClasses);
                  }
                } catch (error) {
                  console.error('Error processing raw transcript data:', error);
                }
              }
            } catch (error) {
              console.error('Error processing transcript data:', error);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    // Get user's name and transcript data from local storage
    const getLocalData = () => {
      const localProfile = getLocalProfile();
      if (localProfile?.name) {
        setUserName(localProfile.name);
      }
      
      // Check local storage for transcript data
      if (typeof window !== 'undefined') {
        const transcriptStr = localStorage.getItem('userTranscript');
        const rawTranscriptStr = localStorage.getItem('rawTranscriptData');
        
        console.log('Checking local storage for transcript data...');
        console.log('userTranscript exists:', !!transcriptStr);
        console.log('rawTranscriptData exists:', !!rawTranscriptStr);
        
        if (transcriptStr && rawTranscriptStr) {
          try {
            const transcriptData = JSON.parse(transcriptStr);
            const rawData = JSON.parse(rawTranscriptStr);
            
            // Extract course names from raw transcript data
            const courseMap = extractCourseInfo(rawData);
            console.log('Extracted course map from local storage:', courseMap);
            
            // Calculate major progress
            const completedCoursesCount = calculateCompletedCourses(transcriptData);
            const majorSpecificTotal = getMajorTotalCourses(localProfile?.major || '');
            const progressPercentage = Math.min(Math.round((completedCoursesCount / majorSpecificTotal) * 100), 100);
            
            setMajorProgress({
              completedCourses: completedCoursesCount,
              totalCourses: majorSpecificTotal,
              percentage: progressPercentage
            });
            
            // If we have Completed data, extract the last semester
            if (transcriptData.Completed && transcriptData.Completed.length > 0) {
              const lastSemester = transcriptData.Completed[transcriptData.Completed.length - 1];
              const semesterMatch = lastSemester.match(/Sem(?:e)?ster \d+:\[(.*?)\]/);
              
              if (semesterMatch && semesterMatch[1]) {
                // Extract course codes
                const courses = semesterMatch[1].split(',').map((course: string) => {
                  return course.replace(/"/g, '').trim();
                });
                
                // Update roadmap
                if (courses.length > 0) {
                  console.log('Local storage courses:', courses);
                  
                  const currentClasses = courses.map((course: string) => {
                    // Normalize the course code for consistent lookup
                    const normalizedCode = course.replace(/"/g, '').trim();
                    
                    // Get the course name from our map
                    const courseName = courseMap[normalizedCode] || '';
                    
                    return {
                      course: normalizedCode,
                      status: "Current",
                      title: courseName
                    };
                  });
                  setRoadmap(currentClasses);
                }
              }
            }
          } catch (error) {
            console.error('Error parsing local transcript data:', error);
          }
        }
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

  // Helper function to calculate completed courses from transcript data
  const calculateCompletedCourses = (transcriptData: any) => {
    if (!transcriptData || !transcriptData.Completed || !Array.isArray(transcriptData.Completed)) {
      return 0;
    }
    
    let totalCompletedCourses = 0;
    
    // Loop through all completed semesters
    transcriptData.Completed.forEach((semester: string) => {
      const semesterMatch = semester.match(/Sem(?:e)?ster \d+:\[(.*?)\]/);
      if (semesterMatch && semesterMatch[1]) {
        // Count the number of courses in this semester
        const courses = semesterMatch[1].split(',').filter(Boolean);
        totalCompletedCourses += courses.length;
      }
    });
    
    return totalCompletedCourses;
  };
  
  // Helper function to get total courses based on major
  const getMajorTotalCourses = (major: string) => {
    // Default values based on typical degree requirements
    const majorRequirements: Record<string, number> = {
      'Computer Science': 40,
      'Computer Engineering': 42,
      'Electrical Engineering': 40,
      'Mechanical Engineering': 40,
      'Civil Engineering': 40,
      'Business': 38,
      'Psychology': 36,
      'Biology': 40,
      'Chemistry': 40,
      'Physics': 40,
      'Mathematics': 38,
      'English': 36,
      'History': 36,
      'Political Science': 36,
      'Sociology': 36,
      'Art': 36,
      'Music': 36,
      'Theatre': 36
    };
    
    // Return the specific major requirement or default to 40
    return majorRequirements[major] || 40;
  };

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
            <h2 className="text-lg sm:text-xl mb-3">Your Current Classes</h2>
            <input
              type="text"
              placeholder="Search courses"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-2 border rounded mb-3 text-sm sm:text-md bg-gray-50"
            />
            <ul className="space-y-2 overflow-y-auto max-h-[200px] sm:max-h-[220px]">
              {(() => {
                console.log('Filtered courses to display:', filteredCourses);
                return filteredCourses.map((item, index) => {
                  console.log(`Course ${index}:`, item.course, 'Title:', item.title);
                  return (
                    <li key={index} className="p-2 border-b">
                      <span className="text-sm sm:text-md">
                        {item.title ? (
                          <strong>{item.course} - {item.title}</strong>
                        ) : (
                          <strong>{item.course}</strong>
                        )}
                      </span>
                    </li>
                  );
                });
              })()}
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

        <div className="flex flex-col gap-4">
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
          
          <div className="border-2 border-gray-200 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg mb-3">Major Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div 
                className="bg-purple-600 h-4 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${majorProgress.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span>{majorProgress.completedCourses} courses completed</span>
              <span>{majorProgress.percentage}%</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Estimated total: {majorProgress.totalCourses} courses
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}