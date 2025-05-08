"use client";

import React, { useState, useEffect } from "react";
import { getLocalEmail } from "@/utils/localStorage";

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

function NewSchedulePage() {
  const [view, setView] = useState<"schedule" | "recommended">("schedule");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [scheduleData, setScheduleData] = useState<Semester[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawScheduleData, setRawScheduleData] = useState<any>(null);
  const [scheduleName, setScheduleName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedScheduleId, setSavedScheduleId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch schedule data from the demo_schedule endpoint
        const scheduleRes = await fetch('/api/demo_schedule', {method: 'POST'});
        const scheduleJson = await scheduleRes.json();

        if (!scheduleJson.success) {
          throw new Error(scheduleJson.error || 'Failed to generate schedule');
        }

        // Store the raw schedule data for later use
        setRawScheduleData(scheduleJson.schedule);

        // Transform the schedule data for display
        const scheduleArray: Semester[] = Object.entries(scheduleJson.schedule).map(
          ([term, courseCodes]) => ({
            term,
            courses: Array.isArray(courseCodes)
              ? courseCodes.map((code: string) => ({
                  code,
                  title: "Unknown",
                  credits: 3,
                }))
              : [],
          })
        );

        console.log("Schedule API response:", scheduleJson);
        setScheduleData(scheduleArray);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const toggleCourse = (courseCode: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseCode) ? prev.filter((c) => c !== courseCode) : [...prev, courseCode]
    );
  };

  const openSaveModal = () => {
    // Set a default name based on the current date
    setScheduleName(`Schedule ${new Date().toLocaleDateString()}`);
    setShowNameModal(true);
  };

  const saveSchedule = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Get user email from local storage
      const email = getLocalEmail();
      
      if (!email) {
        setError("Please sign in to save your schedule");
        setShowNameModal(false);
        return;
      }
      
      // Validate that we have schedule data
      if (!rawScheduleData) {
        setError("No schedule data available to save");
        setShowNameModal(false);
        return;
      }
      
      // Save the schedule to the user's saved schedules
      const response = await fetch('/api/save-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify({
          schedule: rawScheduleData,
          name: scheduleName.trim() || `Schedule ${new Date().toLocaleDateString()}`
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        // Special handling for the case when the table doesn't exist
        if (data.needsSetup) {
          setShowNameModal(false);
          setSuccessMessage(`Your schedule was generated successfully, but couldn't be saved to the database. The saved_schedules table needs to be created in Supabase.`);
          setSavedScheduleId('local');
          return;
        }
        throw new Error(data.error || 'Failed to save schedule');
      }
      
      // Close the modal
      setShowNameModal(false);
      
      // Set success message and saved schedule ID
      setSuccessMessage(`Schedule "${data.name || scheduleName}" saved successfully!`);
      setSavedScheduleId(data.schedule_id);
      
      // Clear any previous errors
      setError(null);
      
      // We'll let the user decide when to navigate to myschedule page via the success message
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSchedule = scheduleData;

  return (
    <div className="min-h-screen bg-gray-100 text-black p-6">
      <div className="flex justify-center gap-4 mb-8">
        <button
          className={`px-6 py-2 rounded-full font-semibold ${
            view === "schedule" ? "bg-blue-600 text-white" : "bg-white border text-blue-600"
          }`}
          onClick={() => setView("schedule")}
        >
          Generated Schedule
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

      {loading && (
        <div className="text-center py-10">
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-6 px-4 bg-red-100 border border-red-300 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {view === "schedule" ? (
        <>
          <h1 className="text-3xl font-bold text-center mb-6">Generated Schedule</h1>
          <YearSelector selectedYear={selectedYear} onSelect={setSelectedYear} />

          {filteredSchedule.length > 0 ? (
            <>
              <div className="flex flex-wrap justify-center gap-6">
                {filteredSchedule.map((semester, index) => (
                  <SemesterCard
                    key={index}
                    semester={semester}
                    onCourseClick={setActiveCourse}
                  />
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <button
                  onClick={openSaveModal}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                  disabled={loading}
                >
                  Confirm and Save Schedule
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-lg text-gray-600">No schedule data available.</p>
            </div>
          )}
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
      
      {/* Success Message */}
      {successMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Success!</h3>
            <p className="text-green-600 mb-4">{successMessage}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="px-4 py-2 border border-gray-300 rounded"
              >
                Continue Editing
              </button>
              <button
                onClick={() => window.location.href = '/myschedule'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View My Schedules
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save Schedule Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Save Your Schedule</h3>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <p className="text-gray-600 mb-4">Give your schedule a name to help you identify it later.</p>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Enter schedule name"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNameModal(false)}
                className="px-4 py-2 border border-gray-300 rounded"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveSchedule}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center min-w-[100px]"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewSchedulePage;
