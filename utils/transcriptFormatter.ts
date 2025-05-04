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
  
  try {
    // Remove outer quotes and parse the JSON
    const cleanedString = creditField.replace(/^"|"$/g, '');
    const parsedData = JSON.parse(cleanedString);
    
    return {
      Completed: parsedData.Completed || [],
      IP: parsedData.IP || []
    };
  } catch (error) {
    console.error('Error parsing transcript data:', error);
    return emptyResult;
  }
};

/**
 * Gets the courses from the last semester in the transcript
 * 
 * @param transcriptData The parsed transcript data
 * @returns Array of course codes from the last semester
 */
export const getLastSemesterCourses = (transcriptData: TranscriptData): string[] => {
  if (!transcriptData.Completed || transcriptData.Completed.length === 0) {
    return [];
  }
  
  // Get the last semester entry
  const lastSemester = transcriptData.Completed[transcriptData.Completed.length - 1];
  
  // Extract courses from the semester string
  const semesterMatch = lastSemester.match(/Sem(?:e)?ster \d+:\[(.*?)\]/);
  if (semesterMatch && semesterMatch[1]) {
    // Split the courses and clean them up
    return semesterMatch[1].split(',').map(course => {
      return course.replace(/"/g, '').trim();
    });
  }
  
  return [];
};

/**
 * Extracts course information (code and name) from raw transcript text
 * 
 * @param rawData The raw transcript data containing course information
 * @returns Object mapping course codes to course names
 */
export const extractCourseInfo = (rawData: any): Record<string, string> => {
  console.log('Starting to extract course info from raw data');
  
  if (!rawData || !rawData.rawText) {
    console.log('No raw text found in transcript data');
    return {};
  }
  
  console.log('Raw text length:', rawData.rawText.length);
  console.log('First 100 chars of raw text:', rawData.rawText.substring(0, 100));
  
  const courseMap: Record<string, string> = {};
  const lines = rawData.rawText.split('\n');
  console.log('Number of lines in transcript:', lines.length);
  
  // Look for lines with course information
  for (let i = 0; i < lines.length; i++) {
    // Log every 50th line for debugging
    if (i % 50 === 0) {
      console.log(`Sample line ${i}:`, lines[i]);
    }
    
    // Try different patterns to match course information
    // Pattern 1: Standard format with department, number, name, credits, and grade
    let codeMatch = lines[i].match(/([A-Z]{2,4})\s+(\d{4})\s+([^\d]+?)\s+(?:\d+\.\d+|\d+)\s+(?:[A-Z][+-]?|CR|IP)/);
    
    // Pattern 2: Alternative format that might appear in some transcripts
    if (!codeMatch) {
      codeMatch = lines[i].match(/([A-Z]{2,4})\s+(\d{4})\s+([^\d]+?)\s+/);
    }
    
    if (codeMatch) {
      const dept = codeMatch[1].trim();
      const num = codeMatch[2].trim();
      let name = codeMatch[3].trim();
      
      // Clean up the name - remove any trailing numbers or special characters
      name = name.replace(/\s+\d+$/, '').trim();
      
      // Create a standardized course code
      const code = `${dept} ${num}`;
      courseMap[code] = name;
      
      // Log each match we find
      console.log(`Found course: ${code} - ${name}`);
    }
  }
  
  // Log the extracted course map for debugging
  console.log('Extracted course map from transcript:', courseMap);
  
  return courseMap;
};
