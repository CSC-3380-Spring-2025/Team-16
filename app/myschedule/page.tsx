"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

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

// Components
const YearSelector = ({ selectedYear, onSelect }: { selectedYear: string; onSelect: (year: string) => void }) => (
  <div className="flex justify-center gap-4 mb-8">
    {["2023", "2024", "2025"].map((year) => (
      <button
        key={year}
        onClick={() => onSelect(year)}
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
);

const SemesterCard = ({ semester, onCourseClick }: { semester: Semester; onCourseClick: (course: Course) => void }) => (
  <div className="bg-white rounded-lg shadow-md p-4">
    <h2 className="text-lg font-semibold mb-4 text-center">{semester.term}</h2>
    <div className="space-y-2">
      {semester.courses.map((course, i) => (
        <div
          key={i}
          onClick={() => onCourseClick(course)}
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
);

const RecommendedCard = ({ course, selected, toggle }: { course: RecommendedCourse; selected: boolean; toggle: () => void }) => (
  <div
    className={`p-4 border rounded-lg shadow-sm transition cursor-pointer ${
      selected ? "bg-blue-100 border-blue-500" : "bg-white"
    }`}
    onClick={toggle}
  >
    <h2 className="text-xl font-semibold mb-1">{course.course}</h2>
    <p className="text-gray-700 font-medium">{course.title}</p>
    <p className="text-sm text-gray-500 mt-2">{course.reason}</p>
    {selected && <p className="text-sm text-blue-600 mt-2 font-bold">✓ Selected</p>}
  </div>
);

const CourseModal = ({ course, onClose }: { course: Course; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
      <h2 className="text-xl font-bold mb-2">{course.code}</h2>
      <p className="mb-2 text-gray-700 font-semibold">{course.title}</p>
      <p className="mb-4 text-gray-600">Credits: {course.credits}</p>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Close
      </button>
    </div>
  </div>
);

function SchedulePage() {
  const [view, setView] = useState<"schedule" | "recommended">("schedule");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [scheduleData, setScheduleData] = useState<Semester[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  useEffect(() => {
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch(`/api/schedule?email=${user.email}`);
    const completedSemesters = await res.json();

    const formatted = Object.entries(completedSemesters).map(([semester, courseCodes]) => ({
      term: semester,
      courses: (courseCodes as string[]).map(code => ({
        code,
        title: "Course Title Placeholder", // replace with real title from Course Catalog if needed
        credits: 3 // placeholder
      }))
    }));

    setScheduleData(formatted);
  };

  fetchData();
}, []);


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
          <YearSelector selectedYear={selectedYear} onSelect={setSelectedYear} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchedule.map((semester, index) => (
              <SemesterCard key={index} semester={semester} onCourseClick={setActiveCourse} />
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6 text-center">Recommended Next Classes</h1>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((course) => (
              <RecommendedCard
                key={course.course}
                course={course}
                selected={selectedCourses.includes(course.course)}
                toggle={() => toggleCourse(course.course)}
              />
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

      {activeCourse && <CourseModal course={activeCourse} onClose={() => setActiveCourse(null)} />}
    </div>
  );
}

export default function Page() {
  return <SchedulePage />;
}
