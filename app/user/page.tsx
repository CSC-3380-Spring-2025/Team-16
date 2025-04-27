"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
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

// Supabase links
const supabaseUrl = "https://yutarvvbovvomsbtegrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGFydnZib3Z2b21zYnRlZ3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzcwOTEsImV4cCI6MjA2MDU1MzA5MX0.07f-gbofDPAbeu2UGOAH4DSn2x1YF_5Z4qsKRhKPeMs";
const supabase = createClient(supabaseUrl, supabaseKey);

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

  // Get user info when page loads
  useEffect(() => {
    const savedProfile = getLocalProfile();
    const email = getLocalEmail();
    
    if (savedProfile) {
      setProfile({
        ...savedProfile,
        email: email || savedProfile.email || "",
      });
    } else if (email) {
      setProfile(prev => ({ ...prev, email }));
    }
  }, []);

  // Handles profile save
  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const userId = getOrCreateUserId();
      const timestamp = new Date().toISOString();
      const transcript = getLocalTranscript();
      
      // Save email separately
      setLocalEmail(profile.email);
      
      const profileData = {
        ...profile,
        updated_at: timestamp,
      };

      // Save locally
      setLocalProfile(profileData);

      // Also save to Supabase for persistence if email is provided
      if (profile.email) {
        // Format transcript data for Supabase
        const transcriptData = getLocalTranscript();
        const formattedTranscript = JSON.stringify(transcriptData);
        
        // First check if a profile with this email already exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", profile.email)
          .maybeSingle();
        
        let error;
        
        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              name: profile.name,
              major: profile.major,
              minor: profile.minor,
              year: profile.year,
              curriculum: "CSCCYB", // Default curriculum for now
              credit: formattedTranscript, // Store transcript data in credit field as JSON string
              updated_at: timestamp
            })
            .eq("email", profile.email);
          
          error = updateError;
        } else {
          // Insert new profile
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              email: profile.email,
              name: profile.name,
              major: profile.major,
              minor: profile.minor,
              year: profile.year,
              curriculum: "CSCCYB", // Default curriculum for now
              credit: formattedTranscript, // Store transcript data in credit field as JSON string
              created_at: timestamp,
              updated_at: timestamp
            });
          
          error = insertError;
        }

        if (error) throw error;
        setMessage({ text: "Profile saved to both device and cloud!", type: "success" });
      } else {
        setMessage({ text: "Profile saved to device! Add email to save to cloud.", type: "success" });
      }
      
      setIsEditing(false);
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
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
              <p className="text-gray-500">Your Profile</p>
            </div>
          </div>

          <div className="space-y-6 max-w-xl mx-auto">
            {/* Email input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="mt-1 block w-full p-2 border rounded text-sm sm:text-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your.email@example.com"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.email || "Not set"}</p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">Adding an email allows your profile to be saved to the cloud</p>
              )}
            </div>

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
                <button
                  onClick={() => setIsEditing(true)}
                  className="button text-sm px-6 py-2 hover:brightness-95 active:scale-[0.98] transition-all"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}