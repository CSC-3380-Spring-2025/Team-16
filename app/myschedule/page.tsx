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

  // 🎨 Class variables
  const tabClass = (active: boolean) =>
    `px-6 py-2 rounded-full font-semibold ${
      active ? "bg-blue-600 text-white" : "bg-white border text-blue-600"
    }`;

  const yearButtonClass = (year: string) =>
    `px-4 py-2 rounded-full text-sm font-semibold ${
      selectedYear === year
        ? "bg-blue-600 text-white"
        : "bg-white border border-blue-400 text-blue-600"
    }`;

  const courseCardClass = (selected: boolean) =>
    `p-4 border rounded-lg shadow-sm transition cursor-pointer ${
      selected ? "bg-blue-100 border-blue-500" : "bg-white"
    }`;

  const courseClickClass =
    "cursor-pointer hover:bg-blue-50 transition rounded p-2 border border-blue-200";

  const closeButtonClass =
    "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700";

  return (
    <div className="min-h-screen bg-gray-100 text-black p-6">
      <div className="flex justify-center gap-4 mb-8">
        <button
          className={tabClass(view === "schedule")}
          onClick={() => setView("schedule")}
        >
          My Schedule
        </button>
        <button
          className={tabClass(view === "recommended")}
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
                className={yearButtonClass(year)}
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
                      className={courseClickClass}
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
                className={courseCardClass(selectedCourses.includes(course.course))}
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
              className={closeButtonClass}
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
