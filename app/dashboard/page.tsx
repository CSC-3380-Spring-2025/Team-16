"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 

export default function Page() {
    const [roadmap, setRoadmap] = useState([
        { course: "MATH 1550", status: "Completed" },
        { course: "CS 1101", status: "In Progress" },
        { course: "CS 3102", status: "Planned" },
    ]);
    const [profileInfo, setProfileInfo] = useState({
        name: "John Doe",
        major: "Computer Science",
        graduationYear: "2025",
    });

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

    useEffect(() => {
        // Check user's system preference for dark mode
        const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDarkMode(prefersDarkMode);
    }, []);

    const handleNavigate = () => {
        router.push("http://localhost:3000/upload");
    };

    const removeCourse = (index) => {
        const confirmation = window.confirm("Are you sure you want to remove this course?");
        if (confirmation) {
            setRoadmap(roadmap.filter((_, i) => i !== index));
        }
    };

    const addCourse = (course, status) => {
        setRoadmap([...roadmap, { course, status }]);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSuggestionSearch = (e) => {
        setSuggestionSearchTerm(e.target.value);
    };

    const filteredCourses = roadmap.filter(course =>
        course.course.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSuggestions = courseSuggestions.filter(suggestion =>
        suggestion.course.toLowerCase().includes(suggestionSearchTerm.toLowerCase())
    );

    return (
        <div className={`${darkMode ? "bg-black text-white" : "bg-white text-black"} p-6`}>
            {/* Logo and Dashboard Header */}
            <div className="flex items-center gap-0">
                <Image
                    src="/logo.svg"
                    alt="ScheduleLSU logo"
                    width={75}
                    height={75}
                    style={{ 
                        transform: "rotate(90deg)",
                        filter: darkMode ? "invert(1)" : "invert(0)" // Invert colors for dark mode
                    }}
                    priority
                />
                <h1 className="text-2xl font-bold">ScheduleLSU Dashboard</h1>
            </div>

            {/* Dark Mode Toggle */}
            <button 
                onClick={() => setDarkMode(!darkMode)} 
                className="mt-4 px-3 py-1 bg-gray-500 text-white rounded"
            >
                Toggle {darkMode ? "Light" : "Dark"} Mode
            </button>

            {/* Student Info Panel */}
            <div className="mt-6">
                <h2 className="text-xl">Your Profile Information</h2>
                <div className="border p-4 mt-2">
                    <p><strong>Name:</strong> {profileInfo.name}</p>
                    <p><strong>Major:</strong> {profileInfo.major}</p>
                    <p><strong>Graduation Year:</strong> {profileInfo.graduationYear}</p>
                </div>
            </div>

            {/* Course Plan */}
            <div className="mt-6">
                <h2 className="text-xl">Your Course Roadmap</h2>
                <input
                    type="text"
                    placeholder="Search courses"
                    value={searchTerm}
                    onChange={handleSearch}
                    className={`mt-2 p-2 border rounded ${darkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}
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

            {/* Course Suggestions */}
            <div className="mt-6">
                <h2 className="text-xl">Course Suggestions</h2>
                <input
                    type="text"
                    placeholder="Search suggestions"
                    value={suggestionSearchTerm}
                    onChange={handleSuggestionSearch}
                    className={`mt-2 p-2 border rounded ${darkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}
                />
                <ul className="mt-2">
                    {filteredSuggestions.map((suggestion, index) => (
                        <li key={index} className="p-2 border-b">
                            <strong>{suggestion.course}</strong> - {suggestion.reason}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Transcript Upload */}
            <div className="mt-6">
                <h2 className="text-xl">Upload Transcript</h2>
                <button 
                    onClick={handleNavigate} 
                    className="px-4 py-2 bg-blue-500 text-white rounded mt-2"
                >
                    Upload Your Transcript
                </button>
            </div>
        </div>
    );
}
