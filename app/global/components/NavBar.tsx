"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yutarvvbovvomsbtegrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGFydnZib3Z2b21zYnRlZ3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzcwOTEsImV4cCI6MjA2MDU1MzA5MX0.07f-gbofDPAbeu2UGOAH4DSn2x1YF_5Z4qsKRhKPeMs";

const supabase = createClient(supabaseUrl, supabaseKey);

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
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
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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

          {/* Sign In/Profile Menu */}
          <div className="hidden md:flex h-full items-center">
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="h-16 px-4 flex items-center hover:bg-blue-50 transition-colors relative group absolute right-0 top-0"
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
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
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
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-2 py-2">
                      <Link
                        href="/user"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className={`nav-link h-full px-6 flex items-center hover:bg-blue-50 transition-colors relative group ${pathname === '/login' ? 'active' : ''}`}
              >
                Sign In
                <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/login' ? 1 : 0 }}></div>
              </Link>
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
            {user ? (
              <>
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
                <span className="flex-1 truncate">{user.email}</span>
              </>
            ) : (
              <span>Welcome, Guest!</span>
            )}
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
          {user ? (
            <button
              onClick={() => {
                handleSignOut();
                setIsOpen(false);
              }}
              className="nav-link px-6 py-5 hover:bg-blue-50 relative group text-left w-full"
            >
              Sign Out
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
            </button>
          ) : (
            <Link 
              href="/login" 
              className="nav-link px-6 py-5 hover:bg-blue-50 relative group" 
              onClick={() => setIsOpen(false)}
            >
              Sign In
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
            </Link>
          )}
        </div>
      </nav>

      {/* Spacer */}
      <div className="pt-16"></div>

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
