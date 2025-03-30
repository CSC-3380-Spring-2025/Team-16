"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/global/styles/globals.css";

interface Course {
  course: string;
  status: string;
}

interface ProfileInfo {
  name: string;
  major: string;
  graduationYear: string;
}

export default function Page() {
  const [roadmap, setRoadmap] = useState<Course[]>([
    { course: "MATH 1550", status: "Completed" },
    { course: "CS 1101", status: "In Progress" },
    { course: "CS 3102", status: "Planned" },
  ]);

  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    name: "John Doe",
    major: "Computer Science",
    graduationYear: "2025",
  });

  const [date, setDate] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(prefersDarkMode);
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const courseSuggestionsData = [
    { course: "CS 4101", reason: "Advanced Programming" },
    { course: "MATH 3001", reason: "Mathematical Foundations" },
    { course: "PHYS 1001", reason: "Basic Physics for CS" },
  ];

  const [courseSuggestions, setCourseSuggestions] = useState(courseSuggestionsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestionSearchTerm, setSuggestionSearchTerm] = useState("");

  const handleNavigate = (url: string): void => {
    router.push(url);
  };

  const removeCourse = (index: number): void => {
    const confirmation = window.confirm("Are you sure you want to remove this course?");
    if (confirmation) {
      setRoadmap(roadmap.filter((_, i) => i !== index));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleSuggestionSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSuggestionSearchTerm(e.target.value);
  };

  const filteredCourses = roadmap.filter(course =>
    course.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuggestions = courseSuggestions.filter(suggestion =>
    suggestion.course.toLowerCase().includes(suggestionSearchTerm.toLowerCase())
  );

  return (
    <div className={`${darkMode ? "bg-black text-white" : "bg-white text-black"} min-h-screen flex flex-col items-center relative font-[family-name:var(--font-geist-mono)]`}>
      <div className="h-16 w-full"></div>

      <div className="w-full max-w-5xl px-6 pt-0 pb-8 relative">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold pl-0">Welcome, User!</h1>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`fixed top-20 right-6 w-6 h-6 flex items-center justify-center rounded-full transition-all ease-in-out duration-200 hover:scale-110 z-40 ${
              darkMode ? "bg-white text-black" : "bg-black text-white"
            } text-sm`}
          >
            {darkMode ? "🌞" : "🌙"}
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className={`border-2 ${darkMode ? "border-gray-700" : "border-gray-200"} p-4 rounded-lg shadow-sm`} style={{ height: '320px' }}>
            <h2 className="text-xl mb-3">Your Course Roadmap</h2>
            <input
              type="text"
              placeholder="Search courses"
              value={searchTerm}
              onChange={handleSearch}
              className={`w-full p-2 border rounded mb-3 text-md ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}
            />
            <ul className="space-y-2 overflow-y-auto" style={{ height: 'calc(320px - 120px)' }}>
              {filteredCourses.map((item, index) => (
                <li key={index} className="flex justify-between items-center p-2 border-b">
                  <span className="text-md">
                    <strong>{item.course}</strong> - {item.status}
                  </span>
                  <button
                    onClick={() => removeCourse(index)}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={`border-2 ${darkMode ? "border-gray-700" : "border-gray-200"} p-4 rounded-lg shadow-sm`} style={{ height: '320px' }}>
            <h2 className="text-xl mb-3">Course Suggestions</h2>
            <input
              type="text"
              placeholder="Search suggestions"
              value={suggestionSearchTerm}
              onChange={handleSuggestionSearch}
              className={`w-full p-2 border rounded mb-3 text-md ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}
            />
            <ul className="space-y-2 overflow-y-auto" style={{ height: 'calc(320px - 120px)' }}>
              {filteredSuggestions.map((item, index) => (
                <li key={index} className="p-2 border-b text-md">
                  <strong>{item.course}</strong> - {item.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className={`border-2 ${darkMode ? "border-gray-700" : "border-gray-200"} p-4 rounded-lg shadow-sm`} style={{ height: '320px' }}>
            <h2 className="text-lg mb-2">Calendar</h2>
            <p className="text-md mb-1"><strong>{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong></p>
            <p className="text-md mb-3"><strong>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={`${day}-${index}`} className="font-bold py-1">{day}</div>
              ))}
              {Array.from({ length: new Date(date.getFullYear(), date.getMonth(), 1).getDay() })
                .map((_, i) => <div key={`empty-${i}`} className="py-1"></div>)}
              {Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() })
                .map((_, i) => (
                  <div key={i} className={`py-1 ${i + 1 === date.getDate() ? "bg-[#0d93c4] text-white rounded-full" : ""}`}>
                    {i + 1}
                  </div>
                ))}
            </div>
          </div>

          <div className={`border-2 ${darkMode ? "border-gray-700" : "border-gray-200"} p-6 rounded-lg shadow-sm flex flex-col items-center justify-center`} style={{ height: '140px' }}>
            <h2 className="text-lg mb-3 text-left w-full">Upload Transcript</h2>
            <div className="text-center">
              <button 
                className="large-btn"
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
