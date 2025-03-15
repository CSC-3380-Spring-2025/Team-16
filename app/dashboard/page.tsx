"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // For navigation

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

    const courseSuggestions = [
        { course: "CS 4101", reason: "Advanced Programming" },
        { course: "MATH 3001", reason: "Mathematical Foundations" },
        { course: "PHYS 1001", reason: "Basic Physics for CS" },
    ];

    const router = useRouter(); // Use the router to navigate to another page

    const handleNavigate = () => {
        router.push("http://localhost:3000/upload"); // Navigate to the upload page
    };

    const removeCourse = (index: number) => {
        setRoadmap(roadmap.filter((_, i) => i !== index));
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            {/* Student Info Panel */}
            <div style={{"padding":"3"}} className="mt-2 mb-2 min-w-screen">
                <h2 className="text-xl">Your Profile Information</h2>
                <div className="border p-4 mt-2 subsection-container">
                    <p><strong>Name:</strong> {profileInfo.name}</p>
                    <p><strong>Major:</strong> {profileInfo.major}</p>
                    <p><strong>Graduation Year:</strong> {profileInfo.graduationYear}</p>
                </div>
            </div>

            {/* Course Plan */}
            <div style={{"padding":"3"}} className="mt-2 mb-2 min-w-screen">
                <h2 className="text-xl">Your Course Roadmap</h2>
                <ul className="mt-2 subsection-container">
                    {roadmap.map((item, index) => (
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
            <div style={{"padding":"3"}} className="mt-2 mb-2 min-w-screen">
                <h2 className="text-xl ">Course Suggestions</h2>
                <ul className="mt-2 subsection-container">
                    {courseSuggestions.map((suggestion, index) => (
                        <li key={index} className="p-2 border-b">
                            <strong>{suggestion.course}</strong> - {suggestion.reason}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Transcript Upload */}
            <div className="mt-6">
                <h2 className="text-xl">Upload Transcript</h2>
                {/* Button to navigate to the upload page */}
                <button 
                    onClick={handleNavigate} 
                    className="button text-white"
                >
                    Upload Your Transcript
                </button>
            </div>
        </div>
    );
}
