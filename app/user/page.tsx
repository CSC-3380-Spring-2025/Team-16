"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { 
  getLocalProfile, 
  setLocalProfile, 
  getOrCreateUserId,
  getLocalEmail,
  setLocalEmail,
  getLocalCurriculum,
  setLocalCurriculum,
  getLocalCredit,
  setLocalCredit,
  getLocalTranscript,
  setLocalTranscript
} from "../../utils/localStorage";
import { formatTranscriptForSupabase, parseTranscriptFromSupabase } from "../../utils/transcriptFormatter";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function UserProfile() {
  // Variables
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    major: "",
    minor: "",
    year: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const { user, saveUserProfile } = useAuth();
  const router = useRouter();

  // Get user info when page loads
  useEffect(() => {
    const loadProfile = async () => {
      // If user is authenticated, try to get profile from Supabase first
      if (user) {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileData && !error) {
            // Parse transcript data from credit field if it exists
            let transcriptData = {};
            if (profileData.credit) {
              try {
                // Use the parser function to handle the transcript data
                transcriptData = parseTranscriptFromSupabase(profileData.credit);
                setLocalTranscript(transcriptData);
              } catch (e) {
                console.error('Error parsing transcript data:', e);
              }
            }
            
            // Set profile from Supabase data
            setProfile({
              name: profileData.name || "",
              email: user.email || "",
              major: profileData.major || "",
              minor: profileData.minor || "",
              year: profileData.year || "",
            });
            
            // Also update local storage
            setLocalProfile({
              name: profileData.name || "",
              major: profileData.major || "",
              minor: profileData.minor || "",
              year: profileData.year || "",
            });
            setLocalEmail(user.email || "");
            return;
          }
        } catch (error) {
          console.error('Error fetching profile from Supabase:', error);
        }
      }
      
      // Fallback to local storage if no Supabase data or not authenticated
      const savedProfile = getLocalProfile();
      const email = user?.email || getLocalEmail();
      
      if (savedProfile) {
        setProfile({
          ...savedProfile,
          email: email || savedProfile.email || "",
        });
      } else if (email) {
        setProfile(prev => ({ ...prev, email }));
      }
    };
    
    loadProfile();
  }, [user]);

  // Handles profile save
  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const timestamp = new Date().toISOString();
      const transcript = getLocalTranscript();
      
      // Save email separately if not authenticated
      if (!user) {
        setLocalEmail(profile.email);
      }
      
      const profileData = {
        ...profile,
        updated_at: timestamp,
        transcript: transcript || {}, // Include transcript data
      };

      // Save locally regardless of authentication status
      setLocalProfile({
        name: profile.name,
        major: profile.major,
        minor: profile.minor,
        year: profile.year,
      });

      // If user is authenticated, save to Supabase using AuthContext
      if (user) {
        // Format the data for Supabase
        const supabaseProfileData = {
          id: user.id,
          name: profile.name,
          major: profile.major,
          minor: profile.minor,
          year: profile.year,
          email: profile.email,
          updated_at: timestamp,
          // Store transcript data properly formatted for Supabase
          credit: formatTranscriptForSupabase(transcript || { Completed: [], IP: [] })
        };
        
        // Save to Supabase
        await saveUserProfile(supabaseProfileData);
        setMessage({ text: "Profile saved to both device and cloud!", type: "success" });
      } else if (profile.email) {
        // Not authenticated but has email - suggest signing in
        setMessage({ 
          text: "Profile saved locally. Sign in with this email to sync to the cloud.", 
          type: "success" 
        });
      } else {
        setMessage({ text: "Profile saved to device! Add email to save to cloud.", type: "success" });
      }
      
      setIsEditing(false);
    } catch (error: any) {
      setMessage({ text: error.message || 'An error occurred while saving', type: "error" });
    } finally {
      setIsSaving(false);
    }

    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  // Main profile display
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-geist-mono)]">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border-2 border-gray-200">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 flex items-center justify-center bg-white">
              <Image
                src="/default-profile.svg"
                alt="Profile"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
              <p className="text-gray-500">{profile.email || "Add your email to sync data"}</p>
            </div>
          </div>

          <div className="space-y-6 max-w-xl mx-auto">
            {/* Email section completely removed */}

            {/* Name input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-1 block w-full p-2 border rounded text-sm sm:text-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.name || "Not set"}</p>
              )}
            </div>

            {/* Major input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Major</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  className="mt-1 block w-full p-2 border rounded text-sm sm:text-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.major || "Not set"}</p>
              )}
            </div>

            {/* Minor input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Minor</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.minor}
                  onChange={(e) => setProfile({ ...profile, minor: e.target.value })}
                  className="mt-1 block w-full p-2 border rounded text-sm sm:text-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.minor || "Not set"}</p>
              )}
            </div>

            {/* Year input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              {isEditing ? (
                <select
                  value={profile.year}
                  onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                  className="mt-1 block w-full p-2 border rounded text-sm sm:text-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="mt-1 text-gray-900">{profile.year || "Not set"}</p>
              )}
            </div>



            {/* Save or edit profile */}
            <div className="flex flex-col items-center space-y-3 pt-6 border-t">
              {message.text && (
                <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
                  {message.text}
                </p>
              )}
              {isEditing ? (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="button text-sm px-6 py-2 bg-gray-100 hover:brightness-95 active:scale-[0.98] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3 w-full items-center">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all"
                  >
                    Edit Profile
                  </button>
                  
                  {user && (
                    <button
                      onClick={() => useAuth().signOut()}
                      className="button text-sm px-6 py-2 bg-red-50 text-red-600 hover:brightness-95 active:scale-[0.98] transition-all mt-4"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}