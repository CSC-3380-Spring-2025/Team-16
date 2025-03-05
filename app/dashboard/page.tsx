"use client";

import { useState } from "react";

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

    const [uploadedTranscript, setUploadedTranscript] = useState(null);
    const courseSuggestions = [
        { course: "CS 4101", reason: "Advanced Programming" },
        { course: "MATH 3001", reason: "Mathematical Foundations" },
        { course: "PHYS 1001", reason: "Basic Physics for CS" },
    ];

    const handleUpload = (event) => {
        setUploadedTranscript(event.target.files[0]);
    };

    const removeCourse = (index) => {
        setRoadmap(roadmap.filter((_, i) => i !== index));
    };

    const savePlan = () => {
        alert("Schedule saved!");
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>

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
                <ul className="mt-2">
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
            <div className="mt-6">
                <h2 className="text-xl">Course Suggestions</h2>
                <ul className="mt-2">
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
                <input type="file" onChange={handleUpload} className="mt-2" />
                {uploadedTranscript && <p className="text-green-600 mt-2">Uploaded: {uploadedTranscript.name}</p>}
            </div>

            {/* Save & Export */}
            <div className="mt-6">
                <button
                    onClick={savePlan}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Save Schedule
                </button>
            </div>
        </div>
    );
}

