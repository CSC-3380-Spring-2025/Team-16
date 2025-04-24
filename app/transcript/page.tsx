"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  getLocalTranscript, 
  setLocalTranscript, 
  getLocalProfile,
  getLocalEmail
} from "../../utils/localStorage";

// Supabase links
const supabaseUrl = "https://yutarvvbovvomsbtegrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGFydnZib3Z2b21zYnRlZ3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzcwOTEsImV4cCI6MjA2MDU1MzA5MX0.07f-gbofDPAbeu2UGOAH4DSn2x1YF_5Z4qsKRhKPeMs";
const supabase = createClient(supabaseUrl, supabaseKey);

// Define a cleaner data structure
interface Semester {
  name: string;
  courses: string[];
}

interface TranscriptData {
  Completed: Semester[];
  IP: string[];
}

export default function TranscriptPage() {
  // State variables
  const [transcript, setTranscript] = useState<TranscriptData>({
    Completed: [],
    IP: []
  });
  const [newSemester, setNewSemester] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");
  const [newIPCourse, setNewIPCourse] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Load transcript data on page load
  useEffect(() => {
    const savedTranscript = getLocalTranscript();
    if (savedTranscript) {
      // Convert to the expected format if needed
      const formattedTranscript: TranscriptData = {
        Completed: Array.isArray(savedTranscript.Completed) 
          ? savedTranscript.Completed.map((semesterEntry: string) => {
              const colonIndex = semesterEntry.indexOf(':');
              const semesterName = semesterEntry.substring(0, colonIndex);
              const startBracket = semesterEntry.indexOf('[');
              const endBracket = semesterEntry.lastIndexOf(']');
              const coursesStr = semesterEntry.substring(startBracket + 1, endBracket);
              const courses: string[] = coursesStr.split(',').map(c => c.trim().replace(/\"/g, ''));
              return { name: semesterName, courses };
            }) 
          : [],
        IP: Array.isArray(savedTranscript.IP) 
          ? savedTranscript.IP 
          : []
      };
      setTranscript(formattedTranscript);
    }
  }, []);

  // Add a new semester
  const addSemester = () => {
    if (!newSemester.trim()) return;
    
    // Check if semester already exists
    if (transcript.Completed.some(sem => sem.name === newSemester)) {
      setMessage({ text: "This semester already exists", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return;
    }
    
    setTranscript(prev => ({
      ...prev,
      Completed: [...prev.Completed, { name: newSemester, courses: [] }]
    }));
    setNewSemester("");
  };

  // Add a course to a semester
  const addCourseToSemester = () => {
    if (!currentSemester || !newCourse.trim()) return;
    
    setTranscript(prev => {
      const updatedCompleted = prev.Completed.map(semesterEntry => {
        if (semesterEntry.name === currentSemester) {
          // Check if course already exists
          if (semesterEntry.courses.includes(newCourse)) {
            setMessage({ text: "This course already exists in this semester", type: "error" });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
            return semesterEntry;
          }
          
          // Add the new course
          return { ...semesterEntry, courses: [...semesterEntry.courses, newCourse] };
        }
        return semesterEntry;
      });
      
      return {
        ...prev,
        Completed: updatedCompleted
      };
    });
    setNewCourse("");
  };

  // Add a course to In Progress
  const addIPCourse = () => {
    if (!newIPCourse.trim()) return;
    
    // Check if course already exists in IP
    if (transcript.IP.includes(newIPCourse)) {
      setMessage({ text: "This course is already in your In Progress list", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return;
    }
    
    setTranscript(prev => ({
      ...prev,
      IP: [...prev.IP, newIPCourse]
    }));
    setNewIPCourse("");
  };

  // Remove a course from a semester
  const removeCourse = (semesterName: string, course: string) => {
    setTranscript(prev => {
      const updatedCompleted = prev.Completed.map(semesterEntry => {
        if (semesterEntry.name === semesterName) {
          // Remove the course
          return { ...semesterEntry, courses: semesterEntry.courses.filter(c => c !== course) };
        }
        return semesterEntry;
      });
      
      return {
        ...prev,
        Completed: updatedCompleted
      };
    });
  };

  // Remove a course from In Progress
  const removeIPCourse = (course: string) => {
    setTranscript(prev => ({
      ...prev,
      IP: prev.IP.filter(c => c !== course)
    }));
  };

  // Remove a semester
  const removeSemester = (semesterName: string) => {
    setTranscript(prev => ({
      ...prev,
      Completed: prev.Completed.filter(semesterEntry => semesterEntry.name !== semesterName)
    }));
  };

  // Save transcript data
  const saveTranscript = async () => {
    setIsSaving(true);
    setMessage({ text: "", type: "" });
    
    try {
      // Format the transcript data with extra quotes as requested
      const formattedTranscript = {
        Completed: transcript.Completed.map(semester => `${semester.name}:[${semester.courses.map(c => `"${c}"`).join(', ')}]`),
        IP: transcript.IP
      };
      
      // Save to local storage first
      setLocalTranscript(formattedTranscript);
      
      // Get user email
      const email = getLocalEmail();
      
      // Save to Supabase if email exists
      if (email) {
        // First, check if a profile with this email already exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        
        let error;
        
        // Format the data properly for Supabase JSONB column
        const transcriptData = {
          Completed: transcript.Completed.map(semester => ({ name: semester.name, courses: semester.courses })),
          IP: transcript.IP
        };
        
        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ 
              credit: transcriptData,
              updated_at: new Date().toISOString()
            })
            .eq("email", email);
          
          error = updateError;
        } else {
          // Insert new profile with minimal data
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              email: email,
              credit: transcriptData,
              curriculum: "CSCCYB", // Default curriculum
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          error = insertError;
        }
        
        if (error) {
          console.error(error);
          setMessage({ 
            text: `Transcript saved locally, but there was an error saving to the cloud: ${error.message}`, 
            type: "error" 
          });
        } else {
          setMessage({ 
            text: "✅ Transcript saved successfully to both your device and the cloud! Your data is now accessible from any device using your email.", 
            type: "success" 
          });
        }
      } else {
        setMessage({ 
          text: "✅ Transcript saved to your device! To save to the cloud and access from any device, please add your email in the profile page.", 
          type: "success" 
        });
      }
    } catch (error: any) {
      console.error(error);
      setMessage({ 
        text: `Error saving transcript: ${error.message}`, 
        type: "error" 
      });
    } finally {
      setIsSaving(false);
    }
    
    // Keep the message visible for longer
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-geist-mono)]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border-2 border-gray-200">
          <div className="flex flex-col items-center mb-8 text-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Transcript Manager</h1>
              <p className="text-gray-500">Track your completed and in-progress courses</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Completed Courses Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Completed Courses</h2>
              
              {/* Add Semester */}
              <div className="flex flex-wrap gap-4 mb-6">
                <input
                  type="text"
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value)}
                  placeholder="Add semester (e.g. Fall 2024)"
                  className="flex-1 p-2 border rounded text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addSemester}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Add Semester
                </button>
              </div>
              
              {/* Semesters List */}
              {transcript.Completed.length === 0 ? (
                <p className="text-gray-500 italic">No semesters added yet</p>
              ) : (
                <div className="space-y-6">
                  {transcript.Completed.map((semester, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-lg">{semester.name}</h3>
                        <button
                          onClick={() => removeSemester(semester.name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {/* Add Course to this Semester */}
                      {currentSemester === semester.name ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                          <input
                            type="text"
                            value={newCourse}
                            onChange={(e) => setNewCourse(e.target.value)}
                            placeholder="Add course (e.g. CSC 1350)"
                            className="flex-1 p-2 border rounded text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={addCourseToSemester}
                              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setCurrentSemester("")}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCurrentSemester(semester.name)}
                          className="mb-4 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                        >
                          Add Course
                        </button>
                      )}
                      
                      {/* Courses List */}
                      {semester.courses.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No courses added for this semester</p>
                      ) : (
                        <ul className="space-y-2">
                          {semester.courses.map((course, courseIdx) => (
                            <li key={courseIdx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span>{course}</span>
                              <button
                                onClick={() => removeCourse(semester.name, course)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* In Progress Courses Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Courses In Progress</h2>
              
              {/* Add IP Course */}
              <div className="flex flex-wrap gap-4 mb-6">
                <input
                  type="text"
                  value={newIPCourse}
                  onChange={(e) => setNewIPCourse(e.target.value)}
                  placeholder="Add in-progress course (e.g. CSC 3380)"
                  className="flex-1 p-2 border rounded text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addIPCourse}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Add Course
                </button>
              </div>
              
              {/* IP Courses List */}
              {transcript.IP.length === 0 ? (
                <p className="text-gray-500 italic">No in-progress courses added yet</p>
              ) : (
                <ul className="space-y-2">
                  {transcript.IP.map((course, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <span>{course}</span>
                      <button
                        onClick={() => removeIPCourse(course)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Save Button */}
            <div className="flex flex-col items-center space-y-3 pt-6 border-t">
              {message.text && (
                <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
                  {message.text}
                </p>
              )}
              <button
                onClick={saveTranscript}
                disabled={isSaving}
                className="button text-sm px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Transcript"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
