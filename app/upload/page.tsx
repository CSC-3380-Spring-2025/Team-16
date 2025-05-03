'use client'
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from "@supabase/supabase-js";
import { getLocalEmail, setLocalTranscript } from "../../utils/localStorage";
import { formatTranscriptForSupabase, parseTranscriptFromSupabase } from "../../utils/transcriptFormatter";

interface Course {
  title: string;
  credits: string;
  dept: string;
  code: string;
  preReqs: string;
}

interface Entry extends Course {
  grade: string;
  semester: string;
}

interface TranscriptRow {
  DEPT: string;
  CRSE: string;
  TITLE: string;
  GR: string;
  CARR: string;
  EARN: string;
  SEMESTER: string;
  SOURCE: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<TranscriptRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');

  const [courseCatalog, setCourseCatalog] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [grade, setGrade] = useState('');
  const [semester, setSemester] = useState('');
  const [manualEntries, setManualEntries] = useState<Entry[]>([]);

  const semesterOptions = [];
  for (let year = 2025; year >= 2020; year--) {
    semesterOptions.push(`1ST SEM ${year}`, `2ND SEM ${year}`);
  }

  useEffect(() => {
    fetch('/api/upload?catalog=true')
      .then(res => res.json())
      .then((data) => {
        const cleaned = data
          .filter((row: any) => row['course ID'] && row['class code'] && !row['course ID'].includes('**'))
          .map((row: any) => ({
            title: row['course title'],
            credits: row['Credit hours'].toString(),
            dept: row['course ID'],
            code: row['class code'].toString(),
            preReqs: Array.isArray(row['preReqs']) ? row['preReqs'].join(' ') : (row['preReqs'] || '')
          }));
        setCourseCatalog(cleaned);
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFile(file);
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.data) {
        setJsonData(result.data);
        setError(null);
        
        // Save the transcript data to local storage and Supabase
        const transcriptData = formatTranscriptData(result.data);
        setLocalTranscript(transcriptData);
        
        // Get user email
        const email = getLocalEmail();
        
        // Save to Supabase if email exists
        if (email) {
          // First check if a profile with this email already exists
          const { data: existingProfile, error: fetchError } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", email)
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error fetching profile:", fetchError);
            alert('Transcript data parsed successfully, but there was an error saving your data: ' + fetchError.message);
          } else {
            // Format the transcript data with our custom formatter to get the exact format with double quotations
            const formattedTranscript = formatTranscriptForSupabase(transcriptData);

            if (existingProfile) {
              // Update existing profile
              const { error: updateError } = await supabase
                .from("profiles")
                .update({
                  credit: formattedTranscript,
                  updated_at: new Date().toISOString()
                })
                .eq("email", email);

              if (updateError) {
                console.error("Error updating profile:", updateError);
                alert('Transcript data parsed successfully, but there was an error saving your data: ' + updateError.message);
              } else {
                alert('Transcript uploaded and saved successfully!');
              }
            } else {
              // Insert new profile
              const { error: insertError } = await supabase
                .from("profiles")
                .insert({
                  email: email,
                  curriculum: "CSCCYB",
                  credit: formattedTranscript,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (insertError) {
                console.error("Error creating profile:", insertError);
                alert('Transcript data parsed successfully, but there was an error saving your data: ' + insertError.message);
              } else {
                alert('Transcript uploaded and saved successfully!');
              }
            }
          }
        } else {
          alert('Transcript uploaded and saved! Add email in profile to save to your email.');
        }
      } else {
        setError(result.error || 'No data to display.');
      }
    } catch (err) {
      setError('Error uploading the file.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courseCatalog.filter((course) =>
    (course.dept + ' ' + course.code).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitEntry = () => {
    if (selectedCourse && grade && semester) {
      setManualEntries([...manualEntries, { ...selectedCourse, grade, semester }]);
      setSelectedCourse(null);
      setSearchTerm('');
      setGrade('');
      setSemester('');
    }
  };

  const removeEntry = (indexToRemove: number) => {
    setManualEntries(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  // Supabase client
  const supabaseUrl = "https://yutarvvbovvomsbtegrk.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGFydnZib3Z2b21zYnRlZ3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzcwOTEsImV4cCI6MjA2MDU1MzA5MX0.07f-gbofDPAbeu2UGOAH4DSn2x1YF_5Z4qsKRhKPeMs";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Convert transcript data to the required format
  const formatTranscriptData = (entries: Entry[] | TranscriptRow[]) => {
    // Group entries by semester
    const semesters: Record<string, string[]> = {};
    
    if (activeTab === 'manual') {
      // Handle manual entries
      const manualData = entries as Entry[];
      manualData.forEach(entry => {
        const semesterName = entry.semester;
        const courseCode = `${entry.dept} ${entry.code}`;
        
        if (!semesters[semesterName]) {
          semesters[semesterName] = [];
        }
        
        semesters[semesterName].push(courseCode);
      });
    } else {
      // Handle uploaded transcript data
      const uploadData = entries as TranscriptRow[];
      uploadData.forEach(row => {
        const semesterName = row.SEMESTER;
        const courseCode = `${row.DEPT} ${row.CRSE}`;
        
        if (!semesters[semesterName]) {
          semesters[semesterName] = [];
        }
        
        semesters[semesterName].push(courseCode);
      });
    }
    
    // Convert to sequential semester numbering (Semester 1, Semester 2, etc.)
    const orderedSemesters = Object.keys(semesters).sort();
    const completedSemesters = orderedSemesters.map((semester, index) => {
      const semesterNumber = index + 1;
      // Format courses without extra escaping
      const courses = semesters[semester];
      return `Semester ${semesterNumber}:[${courses.join(', ')}]`;
    });
    
    return {
      Completed: completedSemesters,
      IP: []
    };
  };

  const handleExport = async () => {
    try {
      // Format the transcript data
      const transcriptData = formatTranscriptData(manualEntries);
      
      // Save to local storage
      setLocalTranscript(transcriptData);
      
      // Get user email
      const email = getLocalEmail();
      
      // Also save to API for local processing
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entries: manualEntries })
      });
      
      // Save to Supabase if email exists
      if (email) {
        // First check if a profile with this email already exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        
        let error;
        
        // For JSONB column type, we need to pass the object directly
        // No need for string manipulation or extra escaping
        
        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ 
              credit: formatTranscriptForSupabase(transcriptData), // Format properly for Supabase
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
              credit: formatTranscriptForSupabase(transcriptData), // Use our custom formatter for consistent format
              curriculum: "CSCCYB", // Default curriculum
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          error = insertError;
        }
        
        if (error) throw error;
        alert('Transcript saved successfully to both device and cloud!');
      } else {
        alert('Transcript saved to device! Add email in profile to save to cloud.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving transcript: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Image src="/logo.svg" alt="ScheduleLSU logo" width={70} height={70} style={{ transform: 'rotate(90deg)' }} priority />
          <p className="text-3xl font-semibold">ScheduleLSU</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b w-full justify-center gap-6">
          <button
            className={`pb-2 px-4 font-medium ${activeTab === 'upload' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Transcript
          </button>
          <button
            className={`pb-2 px-4 font-medium ${activeTab === 'manual' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('manual')}
          >
            Manual Entry
          </button>
        </div>

        {/* Upload Transcript */}
        {activeTab === 'upload' && (
          <div className="w-full text-center">
            <p>Upload Your PDF:</p>
            <input type="file" onChange={handleFileChange} className="mb-4 p-2 border border-gray-300 rounded-md" />
            <button onClick={handleFileUpload} className="p-2 bg-blue-500 text-white rounded-md" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload'}
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {jsonData && (
              <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50 w-full overflow-x-auto">
                <h2 className="text-xl font-semibold mb-4 text-center">Transcript Data</h2>
                <table className="table-auto w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Semester</th>
                      <th className="border px-2 py-1">Dept</th>
                      <th className="border px-2 py-1">Crse</th>
                      <th className="border px-2 py-1">Title</th>
                      <th className="border px-2 py-1">Grade</th>
                      <th className="border px-2 py-1">Carried</th>
                      <th className="border px-2 py-1">Earned</th>
                      <th className="border px-2 py-1">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jsonData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{row.SEMESTER}</td>
                        <td className="border px-2 py-1">{row.DEPT}</td>
                        <td className="border px-2 py-1">{row.CRSE}</td>
                        <td className="border px-2 py-1">{row.TITLE}</td>
                        <td className="border px-2 py-1">{row.GR}</td>
                        <td className="border px-2 py-1">{row.CARR}</td>
                        <td className="border px-2 py-1">{row.EARN}</td>
                        <td className="border px-2 py-1">{row.SOURCE}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-semibold mb-4">Manual Transcript Entry</h2>
            {!selectedCourse && (
              <>
                <input className="p-2 border rounded w-full max-w-lg mb-4" placeholder="Search for a class (e.g. ACCT)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {searchTerm && (
                  <div className="w-full max-w-lg text-left bg-white border rounded shadow-md p-4 mb-4 max-h-60 overflow-y-auto">
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((course, i) => (
                        <div key={i} className="p-2 cursor-pointer hover:bg-blue-100 rounded" onClick={() => setSelectedCourse(course)}>
                          {course.dept} {course.code} - {course.title} ({course.credits} credits)
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No matches found.</p>
                    )}
                  </div>
                )}
              </>
            )}
            {selectedCourse && (
              <div className="flex flex-col items-center gap-4 mb-6">
                <p className="text-lg font-medium">{selectedCourse.dept} {selectedCourse.code} - {selectedCourse.title} ({selectedCourse.credits} credits)</p>
                <input className="p-2 border rounded" placeholder="Grade (e.g. A)" value={grade} onChange={(e) => setGrade(e.target.value)} />
                <select className="p-2 border rounded" value={semester} onChange={(e) => setSemester(e.target.value)}>
                  <option value="">Select Semester</option>
                  {semesterOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button className="p-2 bg-green-500 text-white rounded" onClick={handleSubmitEntry} disabled={!grade || !semester}>Submit Course</button>
              </div>
            )}
            {manualEntries.length > 0 && (
              <div className="text-left max-w-2xl mx-auto">
                <h3 className="text-lg font-bold mb-2">Courses Added:</h3>
                <ul className="bg-gray-100 p-4 rounded-md">
                  {manualEntries.map((c, i) => (
                    <li key={i} className="mb-2 flex justify-between items-center">
                      <span>{c.dept} {c.code} - {c.title} ({c.credits} credits) | Grade: {c.grade} | Semester: {c.semester}</span>
                      <button onClick={() => removeEntry(i)} className="ml-4 px-2 py-1 text-sm bg-red-500 text-white rounded">Remove</button>
                    </li>
                  ))}
                </ul>
                <div className="text-center mt-4">
                  <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded shadow">Export to Data Folder</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
