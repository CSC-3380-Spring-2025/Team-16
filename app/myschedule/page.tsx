"use client";

import React, { useState } from "react";

// Types
type Course = {
  code: string;
  title: string;
  credits: number;
};

type Semester = {
  term: string;
  courses: Course[];
};

type RecommendedCourse = {
  course: string;
  title: string;
  reason: string;
};

// Data
const scheduleData: Semester[] = [
  { term: "Spring 2023", courses: [{ code: "ART 2050", title: "DIGITAL ART I", credits: 3 }] },
  {
    term: "Fall 2023",
    courses: [
      { code: "BIOL 1001", title: "GENERAL BIOLOGY", credits: 3 },
      { code: "CPLT 2201", title: "INTRO WORLD LIT TRAD", credits: 3 },
      { code: "CSC 1350", title: "COMP SCI I-MJRS", credits: 4 },
      { code: "MATH 1550", title: "CALCULUS I", credits: 5 },
      { code: "PSYC 2000", title: "INTRO TO PSYCHOLOGY", credits: 3 }
    ]
  },
  {
    term: "Spring 2024",
    courses: [
      { code: "CSC 1351", title: "COMP SCI II-MJRS", credits: 4 },
      { code: "ENGL 2000", title: "ENGLISH COMP", credits: 3 },
      { code: "HNRS 2021", title: "SONGWRITING", credits: 3 },
      { code: "MATH 1553", title: "HON- AN GEOM CAL II", credits: 4 },
      { code: "PHYS 2001", title: "GENERAL PHYSICS", credits: 3 },
      { code: "PHYS 2108", title: "LAB WRK TECHN PHYS", credits: 1 }
    ]
  },
  {
    term: "Fall 2024",
    courses: [
      { code: "CSC 2259", title: "DISCRETE STRUCTURES", credits: 3 },
      { code: "CSC 3102", title: "ADV DATA STRUCTURES", credits: 3 },
      { code: "HNRS 2000", title: "WHERE WE'RE HEADED", credits: 3 },
      { code: "MATH 2090", title: "DIFF EQ & LIN ALGEBRA", credits: 4 },
      { code: "PHYS 2002", title: "GENERAL PHYSICS", credits: 3 },
      { code: "PHYS 2109", title: "GEN PHYSICS LAB", credits: 1 }
    ]
  },
  {
    term: "Spring 2025",
    courses: [
      { code: "CMST 2060", title: "PUBLIC SPEAKING", credits: 3 },
      { code: "CSC 2262", title: "NUMERICAL METHODS", credits: 3 },
      { code: "CSC 3200", title: "ETHICS IN COMPUTING", credits: 1 },
      { code: "CSC 3304", title: "INTRO TO SYSTM PROG", credits: 3 },
      { code: "CSC 3380", title: "OBJ ORIENTED DESIGN", credits: 3 },
      { code: "HNRS 2020", title: "ENGINEERING ETHICS", credits: 3 }
    ]
  }
];

const recommendations: RecommendedCourse[] = [
  { course: "CSC 4101", title: "Theory of Computation", reason: "Required for Computer Science major" },
  { course: "MATH 3001", title: "Advanced Calculus", reason: "Pre-requisite for CSC 4101" },
  { course: "ENGL 2025", title: "Introduction to Literature", reason: "Fulfills General Education requirement" },
  { course: "PHIL 2010", title: "Symbolic Logic", reason: "Recommended for algorithmic thinking" },
  { course: "CSC 4220", title: "Software Engineering", reason: "Core requirement for Software Development track" },
  { course: "STAT 3032", title: "Statistics for Engineers", reason: "Required for technical electives" }
];

// Combined Component
export default function SchedulePage() {
  const [view, setView] = useState<"schedule" | "recommended">("schedule");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const toggleCourse = (courseCode: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseCode) ? prev.filter((c) => c !== courseCode) : [...prev, courseCode]
    );
  };

  const filteredSchedule = scheduleData.filter((s) => s.term.includes(selectedYear));

  return (
    <div className="min-h-screen bg-gray-100 text-black p-6">
      <div className="flex justify-center gap-4 mb-8">
        <button
          className={`px-6 py-2 rounded-full font-semibold ${
            view === "schedule" ? "bg-blue-600 text-white" : "bg-white border text-blue-600"
          }`}
          onClick={() => setView("schedule")}
        >
          My Schedule
        </button>
        <button
          className={`px-6 py-2 rounded-full font-semibold ${
            view === "recommended" ? "bg-blue-600 text-white" : "bg-white border text-blue-600"
          }`}
          onClick={() => setView("recommended")}
        >
          Recommended Classes
        </button>
      </div>

      {view === "schedule" ? (
        <>
          <h1 className="text-3xl font-bold text-center mb-6">Schedule for {selectedYear}</h1>
          <div className="flex justify-center gap-4 mb-8">
            {["2023", "2024", "2025"].map((year) => (
              <button
                key={year}
                onClick={() => {
                  setSelectedYear(year);
                  setActiveCourse(null);
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedYear === year
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-blue-400 text-blue-600"
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchedule.map((semester, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-4 text-center">{semester.term}</h2>
                <div className="space-y-2">
                  {semester.courses.map((course, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveCourse(course)}
                      className="cursor-pointer hover:bg-blue-50 transition rounded p-2 border border-blue-200"
                    >
                      <strong>{course.code}</strong> - {course.credits} credits
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center text-sm font-medium text-gray-700">
                  Total: {semester.courses.reduce((sum, c) => sum + c.credits, 0)} Hours
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6 text-center">Recommended Next Classes</h1>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((course) => (
              <div
                key={course.course}
                className={`p-4 border rounded-lg shadow-sm transition cursor-pointer ${
                  selectedCourses.includes(course.course)
                    ? "bg-blue-100 border-blue-500"
                    : "bg-white"
                }`}
                onClick={() => toggleCourse(course.course)}
              >
                <h2 className="text-xl font-semibold mb-1">{course.course}</h2>
                <p className="text-gray-700 font-medium">{course.title}</p>
                <p className="text-sm text-gray-500 mt-2">{course.reason}</p>
                {selectedCourses.includes(course.course) && (
                  <p className="text-sm text-blue-600 mt-2 font-bold">✓ Selected</p>
                )}
              </div>
            ))}
          </div>

          {selectedCourses.length > 0 && (
            <div className="mt-10 text-center">
              <h2 className="text-lg font-semibold mb-2">Your Planned Classes:</h2>
              <ul className="inline-block text-left list-disc ml-6">
                {selectedCourses.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {activeCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-2">{activeCourse.code}</h2>
            <p className="mb-2 text-gray-700 font-semibold">{activeCourse.title}</p>
            <p className="mb-4 text-gray-600">Credits: {activeCourse.credits}</p>
            <button
              onClick={() => setActiveCourse(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default function Page() {
  return <SchedulePage />;
}
