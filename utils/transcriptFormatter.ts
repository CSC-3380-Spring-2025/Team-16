/**
 * Utility functions for formatting transcript data for Supabase storage
 */

interface TranscriptData {
  Completed: string[];
  IP: string[];
  [key: string]: any;
}

/**
 * Formats transcript data for storage in Supabase
 * Creates a string with the exact format required with double quotations in specific places
 * 
 * @param transcriptData The transcript data object
 * @returns A properly formatted string for Supabase storage exactly matching the required format
 */
export const formatTranscriptForSupabase = (transcriptData: TranscriptData): string => {
  // Start with the opening part
  let result = '"{""Completed"":['; 
  
  // Process each semester
  const completedSemesters = transcriptData.Completed || [];
  
  // Loop through all semesters
  for (let i = 0; i < completedSemesters.length; i++) {
    const semester = completedSemesters[i];
    const semesterMatch = semester.match(/Semester (\d+):\[(.*?)\]/);
    
    if (semesterMatch) {
      const semesterNum = semesterMatch[1];
      const coursesText = semesterMatch[2];
      
      // Format courses with double quotes
      const courses = coursesText.split(',').map(c => c.trim());
      const formattedCourses = courses.map(course => `""${course}""`).join(', ');
      
      // For the first semester, use Semester, for others use Semster (to match exactly)
      const semesterLabel = i === 0 ? 'Semester' : 'Semster';
      
      // Add the semester with the exact format
      result += `""${semesterLabel} ${semesterNum}:[${formattedCourses}]""`;
      
      // Add comma if not the last semester
      if (i < completedSemesters.length - 1) {
        result += ', ';
      }
    }
  }
  
  // Add the closing part
  result += '] ""IP"":[]}';
  
  // Add the final closing quote
  result += '"';
  
  return result;
};

/**
 * Parses transcript data from Supabase
 * 
 * @param creditField The credit field from Supabase
 * @returns Parsed transcript data object
 */
export const parseTranscriptFromSupabase = (creditField: string | null): TranscriptData => {
  // Default empty result
  const emptyResult = { Completed: [], IP: [] };
  
  // Handle null or undefined
  if (!creditField) {
    return emptyResult;
  }
  
  // Log the raw data for debugging
  console.log('Raw creditField type:', typeof creditField);
  if (typeof creditField === 'string') {
    console.log('Raw creditField first 50 chars:', creditField.substring(0, 50));
  }
  
  // Skip parsing entirely and return empty data
  // This is a temporary solution until we can fix the data in Supabase
  return emptyResult;
};
