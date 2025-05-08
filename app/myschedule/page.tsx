"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
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

type SavedSchedule = {
  id: string;
  created_at: string;
  schedule_data: any;
  is_active: boolean;
  name?: string;
};

// Components
const YearSelector = ({ selectedYear, onSelect }: { selectedYear: string; onSelect: (year: string) => void }) => (
  <div className="flex justify-center gap-4 mb-8">
    {["2023", "2024", "2025"].map((year) => (
      <button
        key={year}
        onClick={() => onSelect(year)}
        className={`px-4 py-2 rounded-full text-sm font-semibold font-mono ${

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

const SemesterCard = ({
  semester,
  onCourseClick,
  onCourseRemove,
  isEditable,
}: {
  semester: Semester;
  onCourseClick: (course: Course) => void;
  onCourseRemove?: (courseIndex: number, term: string) => void;
  isEditable?: boolean;
}) => (
  <div className="bg-white rounded-lg shadow-md p-4">
    <h2 className="text-lg font-semibold font-mono mb-4 text-center ">{semester.term}</h2>

    <div className="space-y-2">
      {semester.courses.map((course, i) => (
        <div
          key={i}
          className="cursor-pointer hover:bg-blue-50 transition rounded p-2 border border-blue-200 font-mono flex justify-between items-center"
        >
          <div
            onClick={() => onCourseClick(course)}
            className="cursor-pointer flex-1"
          >
            <strong>{course.code}</strong> - {course.credits} credits
          </div>
          {isEditable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCourseRemove?.(i, semester.term);
              }}
              className="ml-4 text-red-600 hover:underline font-bold"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>

    <div className="mt-4 text-center text-sm font-bold font-mono text-gray-700">
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
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<SavedSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleName, setScheduleName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    const fetchSavedSchedules = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user email from local storage
        const email = getLocalEmail();

        if (!email) {
          setError("Please sign in to view your saved schedules");
          return;
        }

        try {
          // Fetch saved schedules from Supabase
          const { data, error } = await supabase
            .from("saved_schedules")
            .select("*")
            .eq("email", email)
            .order('created_at', { ascending: false });

          if (error) {
            // If the error is about the table not existing, handle it gracefully
            if (error.message.includes("relation \"public.saved_schedules\" does not exist")) {
              console.log("The saved_schedules table doesn't exist yet. This is normal if no schedules have been saved.");
              setSavedSchedules([]);
              return;
            } else {
              throw new Error(error.message);
            }
          }

          setSavedSchedules(data || []);

          // If there's at least one saved schedule, set it as active
          if (data && data.length > 0) {
            setActiveSchedule(data[0]);
            loadSchedule(data[0]);
          }
        } catch (supabaseError) {
          console.error("Supabase error:", supabaseError);
          // Set an empty array for saved schedules to avoid breaking the UI
          setSavedSchedules([]);
          setError("Unable to fetch saved schedules. Please try again later.");
        }
      } catch (err) {
        console.error("Error fetching saved schedules:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedSchedules();
  }, []);

  const loadSchedule = (schedule: SavedSchedule) => {
    try {
      const scheduleData = schedule.schedule_data;

      if (!scheduleData || typeof scheduleData !== "object") {
        console.error("Invalid schedule data", scheduleData);
        return;
      }

      const scheduleArray: Semester[] = Object.entries(scheduleData).map(
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

      console.log("Loaded schedule:", scheduleArray);
      setScheduleData(scheduleArray);

      if (scheduleArray.length > 0) {
        const firstYear = scheduleArray[0].term.match(/\d{4}/)?.[0];
        if (firstYear) setSelectedYear(firstYear);
      }
    } catch (err) {
      console.error("Error loading schedule:", err);
    }
  };

  const toggleCourse = (courseCode: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseCode) ? prev.filter((c) => c !== courseCode) : [...prev, courseCode]
    );
  };

  const removeCourse = (courseIndex: number, term: string) => {
    setScheduleData((prev) =>
      prev.map((sem) =>
        sem.term === term
          ? {
              ...sem,
              courses: sem.courses.filter((_, i) => i !== courseIndex),
            }
          : sem
      )
    );
  };

  const saveScheduleChanges = async () => {
    if (!activeSchedule) return;

    try {
      setLoading(true);
      setError(null);

      // Convert schedule data back to the original format
      const scheduleData: Record<string, string[]> = {};

      // Process each semester in the filtered schedule data
      filteredSchedule.forEach((semester) => {
        // Add this semester's courses to the scheduleData object
        scheduleData[semester.term] = semester.courses.map((course) => course.code);
      });

      try {
        // Update the schedule in Supabase
        const { error } = await supabase
          .from("saved_schedules")
          .update({
            schedule_data: scheduleData,
            updated_at: new Date().toISOString()
          })
          .eq("id", activeSchedule.id);

        if (error) {
          // Handle the case where the table doesn't exist yet
          if (error.message.includes("relation \"public.saved_schedules\" does not exist")) {
            setError("Unable to save schedule: The saved_schedules table doesn't exist yet.");
            return;
          }
          throw new Error(error.message);
        }

        alert("Schedule updated successfully!");

        // Update the local state
        setActiveSchedule({
          ...activeSchedule,
          schedule_data: scheduleData
        });
      } catch (supabaseError) {
        console.error("Supabase error:", supabaseError);
        setError(supabaseError instanceof Error ? supabaseError.message : 'An unknown error occurred');
      }
    } catch (err) {
      console.error("Error updating schedule:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const setActiveScheduleAndLoad = (schedule: SavedSchedule) => {
    setActiveSchedule(schedule);
    loadSchedule(schedule);
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from("saved_schedules")
        .delete()
        .eq("id", scheduleId);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      const updatedSchedules = savedSchedules.filter(s => s.id !== scheduleId);
      setSavedSchedules(updatedSchedules);

      // If we deleted the active schedule, set a new one
      if (activeSchedule?.id === scheduleId) {
        if (updatedSchedules.length > 0) {
          setActiveScheduleAndLoad(updatedSchedules[0]);
        } else {
          setActiveSchedule(null);
          setScheduleData([]);
        }
      }

      alert("Schedule deleted successfully!");
    } catch (err) {
      console.error("Error deleting schedule:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveScheduleWithName = async () => {
    if (!activeSchedule || !scheduleName.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from("saved_schedules")
        .update({
          name: scheduleName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", activeSchedule.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setSavedSchedules(prev =>
        prev.map(s =>
          s.id === activeSchedule.id
            ? { ...s, name: scheduleName.trim() }
            : s
        )
      );

      setActiveSchedule({
        ...activeSchedule,
        name: scheduleName.trim()
      });

      setShowNameModal(false);
      alert("Schedule name updated successfully!");
    } catch (err) {
      console.error("Error updating schedule name:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedule = scheduleData.filter((s) => s.term.includes(selectedYear));

  return (
    <div className="min-h-screen bg-gray-100 text-black p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <button
            className={`px-6 py-2 rounded-full font-semibold ${
              view === "schedule" ? "bg-blue-600 text-white" : "bg-white border text-blue-600"
            }`}
            onClick={() => setView("schedule")}
          >
            My Schedules
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
        <Link
          href="/new-schedule"
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition"
        >
          Generate New Schedule
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-xl font-semibold">Loading...</p>
        </div>
      ) : view === "schedule" ? (
        <>
          {savedSchedules.length > 0 ? (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Your Saved Schedules</h2>
                <div className="flex flex-wrap gap-3 mb-6">
                  {savedSchedules.map((schedule) => (
                    <button
                      key={schedule.id}
                      onClick={() => setActiveScheduleAndLoad(schedule)}
                      className={`px-4 py-2 rounded-lg border ${activeSchedule?.id === schedule.id ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'}`}
                    >
                      {schedule.name || `Schedule ${new Date(schedule.created_at).toLocaleDateString()}`}
                    </button>
                  ))}
                </div>

                {activeSchedule && (
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => {
                        setScheduleName(activeSchedule.name || '');
                        setShowNameModal(true);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Rename Schedule
                    </button>
                    <button
                      onClick={() => saveScheduleChanges()}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      disabled={loading}
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => deleteSchedule(activeSchedule.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      disabled={loading}
                    >
                      Delete Schedule
                    </button>
                  </div>
                )}
              </div>

              {activeSchedule && (
                <>
                  <h1 className="text-3xl font-bold font-mono text-center mb-6">
                    {activeSchedule.name || `Schedule from ${new Date(activeSchedule.created_at).toLocaleDateString()}`}
                  </h1>

                  <YearSelector selectedYear={selectedYear} onSelect={setSelectedYear} />

                  {filteredSchedule.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-6">
                      {filteredSchedule.map((semester, index) => (
                        <SemesterCard
                          key={index}
                          semester={semester}
                          onCourseClick={setActiveCourse}
                          onCourseRemove={removeCourse}
                          isEditable={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-lg text-gray-600">No courses found for {selectedYear}.</p>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">No Saved Schedules</h2>
              <p className="text-gray-600 mb-6">You don't have any saved schedules yet.</p>
              <Link
                href="/new-schedule"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Generate Your First Schedule
              </Link>
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold font-mono mb-6 text-center">Recommended Classes</h1>

          {recommendations.length > 0 ? (
            <>
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
          ) : (
            <div className="text-center py-10">
              <p className="text-lg text-gray-600">No recommendations available.</p>
            </div>
          )}
        </>
      )}

      {activeCourse && <CourseModal course={activeCourse} onClose={() => setActiveCourse(null)} />}

      {/* Rename Schedule Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Rename Schedule</h3>
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
              >
                Cancel
              </button>
              <button
                onClick={saveScheduleWithName}
                className="px-4 py-2 bg-blue-500 text-white rounded"
                disabled={!scheduleName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchedulePage;
