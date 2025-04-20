"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute"; 
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

  const router = useRouter();

  const courseSuggestionsData = [
    { course: "CS 4101", reason: "Advanced Programming" },
    { course: "MATH 3001", reason: "Mathematical Foundations" },
    { course: "PHYS 1001", reason: "Basic Physics for CS" },
  ];

  const [courseSuggestions, setCourseSuggestions] = useState(courseSuggestionsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestionSearchTerm, setSuggestionSearchTerm] = useState("");

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
    <ProtectedRoute>
      <div className="bg-white text-black min-h-screen flex flex-col items-center relative font-[family-name:var(--font-geist-mono)] px-4 sm:px-6">
        <div className="h-16 w-full"></div>

        <div className="w-full max-w-5xl px-0 sm:px-6 pt-0 pb-8 relative">
          <div className="flex justify-start">
            <h1 className="text-xl sm:text-2xl font-bold">Welcome, {profileInfo.name}!</h1>
          </div>
        </div>

        <div className="w-full max-w-5xl px-0 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Roadmap Section */}
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
                  <li key={index} className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm sm:text-md">
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

            {/* Suggestions Section */}
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

          {/* Right Column */}
          <div className="flex flex-col">
            <div className="border-2 border-gray-200 p-6 rounded-lg shadow-sm flex flex-col items-center justify-between" style={{ minHeight: '140px' }}>
              <h2 className="text-lg w-full text-left">Upload Transcript</h2>
              <div className="w-full flex justify-center">
                <button 
                  className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all"
                  style={{ width: '120px' }}
                  onClick={() => router.push('/upload')}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
