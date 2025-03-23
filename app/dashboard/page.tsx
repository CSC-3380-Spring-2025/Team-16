"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Profile and course data types
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

  // Update time every second
  useEffect(() => {
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
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  // Detect dark mode preference from system settings
  useEffect(() => {
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(prefersDarkMode);
  }, []);

  // Handle navigation to different pages
  const handleNavigate = (url: string): void => {
    router.push(url);
  };

  // Remove course from course roadmap
  const removeCourse = (index: number): void => {
    const confirmation = window.confirm("Are you sure you want to remove this course?");
    if (confirmation) {
      setRoadmap(roadmap.filter((_, i) => i !== index));
    }
  };

  // Handles course search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  // Handles suggestion search input
  const handleSuggestionSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSuggestionSearchTerm(e.target.value);
  };

  // Filter courses based on search term
  const filteredCourses = roadmap.filter(course =>
    course.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter course suggestions based on search term
  const filteredSuggestions = courseSuggestions.filter(suggestion =>
    suggestion.course.toLowerCase().includes(suggestionSearchTerm.toLowerCase())
  );

  // Random emojis for profile picture
  const emojiList = ["😀", "😁", "😎", "😊", "🙃", "😜", "😇", "🥳"];
  const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];

  return (
    <div className={`${darkMode ? "bg-black text-white" : "bg-white text-black"} p-6 relative`}>
      <div className="flex items-center gap-0">
        <Image
          src="/logo.svg"
          alt="ScheduleLSU logo"
          width={75}
          height={75}
          style={{
            transform: "rotate(90deg)",
            filter: darkMode ? "invert(1)" : "invert(0)"
          }}
          priority
        />
        <h1 className="text-2xl font-bold">ScheduleLSU Dashboard</h1>
      </div>

      {/* Layout for the 4 boxes */}
      <div className="grid grid-cols-2 grid-rows-2 gap-6 mt-6" style={{ gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr 1fr' }}>

        {/* Profile Box */}
        <div className="border p-4 flex flex-col justify-between">
          {/* Profile information and emoji circle */}
          <div className="flex flex-col items-center justify-center flex-grow text-center">
            {/* Circle profile with random emojis */}
            <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-6xl mb-4">
              {randomEmoji}
            </div>

            {/* Profile Info */}
            <p className="text-4xl font-semibold">Welcome {profileInfo.name}!</p>
            <p className="mt-2 text-xl"><strong>Major:</strong> {profileInfo.major}</p>
            <p className="text-xl"><strong>Graduation Year:</strong> {profileInfo.graduationYear}</p>
          </div>

          {/* "My Profile" Button */}
          <div className="w-full flex justify-start mt-auto">
            <button
              onClick={() => handleNavigate('/user')}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all ${darkMode ? "border-2 border-white" : "border-2 border-black"}`}
            >
              My Profile
            </button>
          </div>
        </div>

        {/* Calendar Box */}
        <div className="border p-4">
          <p className="text-2xl"><strong>{date.toLocaleTimeString()}</strong></p>
          <p className="mt-2 text-2xl"><strong>{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>

          <div className="grid grid-cols-7 gap-1 text-center mt-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="font-bold">{day}</div>
            ))}
            {Array.from({ length: new Date(date.getFullYear(), date.getMonth(), 1).getDay() })
              .map((_, i) => <div key={`empty-${i}`}></div>)}
            {Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() })
              .map((_, i) => (
                <div key={i} className={`p-2 ${i + 1 === date.getDate() ? "bg-blue-500 text-white rounded" : ""}`}>
                  {i + 1}
                </div>
              ))}
          </div>
        </div>

        {/* Course Roadmap Box */}
        <div className="border p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-xl">Your Course Roadmap</h2>
            <input
              type="text"
              placeholder="Search courses"
              value={searchTerm}
              onChange={handleSearch}
              className={`mt-2 p-2 border rounded w-full ${darkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}
            />
            <ul className="mt-2">
              {filteredCourses.map((item, index) => (
                <li key={index} className="p-2 border-b flex justify-between">
                  <span>
                    <strong>{item.course}</strong> - {item.status}
                  </span>
                  <button
                    onClick={() => removeCourse(index)}
                    className="ml-4 text-red-500"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* My Schedule Button */}
          <div className="mt-auto flex justify-start">
            <button
              onClick={() => handleNavigate('/myschedule')}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all ${darkMode ? "border-2 border-white" : "border-2 border-black"}`}
            >
              My Schedule
            </button>
          </div>
        </div>

        {/* Course Suggestions Box */}
        <div className="border p-4 flex flex-col justify-between">
          <h2 className="text-xl">Course Suggestions</h2>
          <input
            type="text"
            placeholder="Search suggestions"
            value={suggestionSearchTerm}
            onChange={handleSuggestionSearch}
            className={`mt-2 p-2 border rounded w-full ${darkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}
          />
          <ul className="mt-2">
            {filteredSuggestions.map((suggestion, index) => (
              <li key={index} className="p-2 border-b">
                <strong>{suggestion.course}</strong> - {suggestion.reason}
              </li>
            ))}
          </ul>

          {/* Upload File Button */}
          <div className="mt-auto flex justify-start">
            <button
              onClick={() => handleNavigate('/upload')}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all ${darkMode ? "border-2 border-white" : "border-2 border-black"}`}
            >
              Upload File
            </button>
          </div>
        </div>
      </div>

      {/* Dark Mode Button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full transition-all ease-in-out transform hover:scale-110 ${
          darkMode ? "bg-white" : "bg-black"
        } border-2 border-${darkMode ? "black" : "white"}`}
        style={{
          fontSize: "1rem",
        }}
      >
        {darkMode ? "🌞" : "🌙"}
      </button>
    </div>
  );
}
