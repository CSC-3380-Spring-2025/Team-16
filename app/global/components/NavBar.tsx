"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getLocalProfile } from "../../../utils/localStorage";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const blueColor = "#0d93c4";
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Get user's name from local storage
    const profile = getLocalProfile();
    if (profile?.name) {
      setUserName(profile.name);
    }
  }, []);
  
  // Update username when it changes in local storage
  useEffect(() => {
    const handleStorageChange = () => {
      const profile = getLocalProfile();
      if (profile?.name) {
        setUserName(profile.name);
      }
    };
    
    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Check periodically for changes
    const interval = setInterval(handleStorageChange, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <nav className="w-full fixed top-0 left-0 z-50 bg-white shadow-md h-16 flex justify-between items-center font-[family-name:var(--font-geist-mono)]">
        {/* Logo Section */}
        <Link href="/" className="flex items-center space-x-3 h-full px-4 hover:opacity-80 transition-opacity">
          <Image 
            src="/logo.svg" 
            alt="Logo" 
            width={50} 
            height={50} 
            className="object-contain rotate-90 cursor-pointer"
          />
          <span className="text-xl text-gray-800 font-[family-name:var(--font-geist-mono)]">ScheduleLSU</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="flex items-center h-full">
          <div className="hidden md:flex h-full">
            <Link 
              href="/dashboard" 
              className={`nav-link h-full px-6 flex items-center hover:bg-blue-50 transition-colors relative group ${pathname === '/dashboard' ? 'active' : ''}`}
            >
              Dashboard
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/dashboard' ? 1 : 0 }}></div>
            </Link>
            <Link 
              href="/myschedule" 
              className={`nav-link h-full px-6 flex items-center hover:bg-blue-50 transition-colors relative group ${pathname === '/myschedule' ? 'active' : ''}`}
            >
              Schedule
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/myschedule' ? 1 : 0 }}></div>
            </Link>
            <Link 
              href="/user" 
              className={`nav-link h-full px-6 flex items-center hover:bg-blue-50 transition-colors relative group ${pathname === '/user' ? 'active' : ''}`}
            >
              Profile
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/user' ? 1 : 0 }}></div>
            </Link>
            <Link 
              href="/upload" 
              className={`nav-link h-full px-6 flex items-center hover:bg-blue-50 transition-colors relative group ${pathname === '/upload' ? 'active' : ''}`}
            >
              Upload
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/upload' ? 1 : 0 }}></div>
            </Link>
          </div>

          {/* Profile Menu */}
          <div className="hidden md:flex h-full items-center">
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="h-16 px-4 flex items-center hover:bg-blue-50 transition-colors space-x-2"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white">
                  <Image
                    src="/default-profile.svg"
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <span>Welcome, {userName || 'User'}!</span>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                  <Link
                    href="/user"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    View Profile
                  </Link>
                </div>
              )}
            </div>
          </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-4 h-full focus:outline-none hover:bg-blue-50 transition-colors relative group"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
          <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
        </button>

        {/* Mobile Menu */}
        <div className={`absolute top-16 left-0 w-full bg-white shadow-md flex flex-col md:hidden z-50 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <div className="px-6 py-4 text-black bg-blue-50 font-medium flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white">
              <Image
                src="/default-profile.svg"
                alt="Profile"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="flex-1 truncate">Welcome, {userName || 'Guest'}!</span>
          </div>
          <div className="border-t border-gray-200"></div> 
          <Link 
            href="/dashboard" 
            className="nav-link px-6 py-5 hover:bg-blue-50 relative group border-b border-gray-200" 
            onClick={() => setIsOpen(false)}
          >
            Dashboard
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
          </Link>
          <Link 
            href="/myschedule" 
            className="nav-link px-6 py-5 hover:bg-blue-50 relative group border-b border-gray-200" 
            onClick={() => setIsOpen(false)}
          >
            Schedule
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
          </Link>
          <Link 
            href="/user" 
            className="nav-link px-6 py-5 hover:bg-blue-50 relative group border-b border-gray-200" 
            onClick={() => setIsOpen(false)}
          >
            Profile
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
          </Link>
          <Link 
            href="/upload" 
            className="nav-link px-6 py-5 hover:bg-blue-50 relative group border-b border-gray-200" 
            onClick={() => setIsOpen(false)}
          >
            Upload
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
          </Link>
        </div>
      </div>
    </nav>

    {/* Spacer */}
    <div className="h-16"></div>

    <style jsx global>{`
      .group:hover div[style*="background-color: #0d93c4"] {
        opacity: 1 !important;
        transition: opacity 200ms ease;
      }
      .active div[style*="background-color: #0d93c4"] {
        opacity: 1 !important;
      }
    `}</style>
    </>
  );
};

export default NavBar;
