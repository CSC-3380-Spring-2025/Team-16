"use client";

import { useState } from "react";
import Image from "next/image";

interface User {
  name: string;
  email: string;
  major: string;
  minor: string;
  year: string;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User>({
    name: "John Doe",
    email: "johndoe@lsu.edu",
    major: "Computer Science",
    minor: "Mathematics",
    year: "Junior",
  });

  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setProfilePic(fileReader.result as string);
      };
      fileReader.readAsDataURL(event.target.files[0]);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 p-6">
      <div className="w-full max-w-md p-6 shadow-md bg-white rounded-lg flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center mb-4 overflow-hidden">
          {profilePic ? (
            <img src={profilePic} alt="Profile" className="object-cover w-full h-full" />
          ) : (
            <span className="text-gray-600 text-3xl">👤</span>
          )}
        </div>
        {isEditing && (
          <input type="file" accept="image/*" onChange={handleImageChange} className="mb-4" />
        )}
        <h2 className="text-xl font-semibold mb-1 text-gray-900">{user.name}</h2>
        <p className="text-sm text-gray-500 mb-4">{user.email}</p>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Major:</strong> {user.major}</p>
          <p><strong>Minor:</strong> {user.minor}</p>
          <p><strong>Year:</strong> {user.year}</p>
        </div>
        <button
          className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Done" : "Edit Profile"}
        </button>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <div>
      <UserProfile />
    </div>
  );
}
