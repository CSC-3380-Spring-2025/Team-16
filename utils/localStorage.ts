// Utility functions for handling local storage
export const getLocalProfile = () => {
  if (typeof window === 'undefined') return null;
  const profile = localStorage.getItem('userProfile');
  return profile ? JSON.parse(profile) : null;
};

export const setLocalProfile = (profile: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userProfile', JSON.stringify(profile));
};

export const getLocalTranscript = () => {
  if (typeof window === 'undefined') return null;
  
  // Get the raw transcript string
  const transcriptStr = localStorage.getItem('userTranscript');
  
  // If no transcript exists, return default empty structure
  if (!transcriptStr) {
    return { 
      Completed: [], 
      IP: [],
      _rawData: {}
    };
  }
  
  try {
    // Parse the transcript data
    return JSON.parse(transcriptStr);
  } catch (e) {
    console.error('Error parsing transcript data:', e);
    return { 
      Completed: [], 
      IP: [],
      _rawData: {}
    };
  }
};

export const setLocalTranscript = (transcript: any) => {
  if (typeof window === 'undefined') return;
  
  try {
    // Store the transcript data as a JSON string
    // We still need to use JSON.stringify for local storage, but we'll handle the
    // Supabase formatting separately in the transcript and upload pages
    localStorage.setItem('userTranscript', JSON.stringify(transcript));
  } catch (e) {
    console.error('Error saving transcript data:', e);
  }
};

// Get local email
export const getLocalEmail = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userEmail') || '';
};

// Set local email
export const setLocalEmail = (email: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userEmail', email);
};

// Get local curriculum
export const getLocalCurriculum = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userCurriculum') || '';
};

// Set local curriculum
export const setLocalCurriculum = (curriculum: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userCurriculum', curriculum);
};

// Get local credit hours
export const getLocalCredit = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userCredit') || '';
};

// Set local credit hours
export const setLocalCredit = (credit: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userCredit', credit);
};

// Generate a pseudo-unique ID for the user
export const getOrCreateUserId = () => {
  if (typeof window === 'undefined') return null;
  let userId = localStorage.getItem('localUserId');
  if (!userId) {
    userId = 'local_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('localUserId', userId);
  }
  return userId;
};
