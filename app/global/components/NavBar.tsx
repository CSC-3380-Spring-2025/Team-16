"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getLocalProfile } from "../../../utils/localStorage";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabaseClient";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const blueColor = "#0d93c4";
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  // No reset-password page check

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
    const checkAuthState = async () => {
      try {
        // Check current auth state directly from Supabase
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user;
        
        if (currentUser?.email) {
          console.log('NavBar: User is authenticated:', currentUser.email);
          setUserEmail(currentUser.email);
        }
      } catch (error) {
        console.error('Error checking auth state in NavBar:', error);
      }
    };
    
    // Get user's name from local storage
    const profile = getLocalProfile();
    if (profile?.name) {
      setUserName(profile.name);
    }
    
    // Get user's email if authenticated from context
    if (user?.email) {
      setUserEmail(user.email);
      console.log('NavBar: User from context:', user.email);
    } else if (profile?.email) {
      setUserEmail(profile.email);
    }
    
    // Double-check auth state directly with Supabase
    checkAuthState();
  }, [user]);
  
  // Update when auth state changes
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('User has active session in NavBar');
      }
    };
    
    checkAuth();
  }, []);
  
  // Update username when it changes in local storage
  useEffect(() => {
    const handleStorageChange = () => {
      const profile = getLocalProfile();
      if (profile?.name) {
        setUserName(profile.name);
      }
      if (profile?.email) {
        setUserEmail(profile.email);
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
      <nav className="w-full fixed top-0 left-0 z-[9999] bg-white shadow-md h-16 flex justify-between items-center font-[family-name:var(--font-geist-mono)] pointer-events-auto">
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
          <div className="hidden md:flex h-full z-[10000] relative">
            <Link 
              href="/dashboard" 
              className={`nav-link h-full px-6 flex items-center hover:bg-blue-50 transition-colors relative group ${pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-700'}`}
            >
              Dashboard
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/dashboard' ? 1 : 0 }}></div>
            </Link>
            
            <Link 
              href="/myschedule" 
              className={`nav-link h-full px-6 flex items-center hover:bg-blue-50 transition-colors relative group ${pathname === '/myschedule' ? 'text-blue-600' : 'text-gray-700'}`}
            >
              Schedule
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/myschedule' ? 1 : 0 }}></div>
            </Link>
            
            <Link 
              href="/user" 
              className={`nav-link h-full px-6 flex items-center hover:bg-blue-50 transition-colors relative group ${pathname === '/user' ? 'text-blue-600' : 'text-gray-700'}`}
            >
              Profile
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/user' ? 1 : 0 }}></div>
            </Link>
            
            <Link 
              href="/upload" 
              className={`nav-link h-full px-6 flex items-center hover:bg-blue-50 transition-colors relative group ${pathname === '/upload' ? 'text-blue-600' : 'text-gray-700'}`}
            >
              Upload
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/upload' ? 1 : 0 }}></div>
            </Link>
          </div>
          
          {/* Mobile menu overlay - only visible when menu is open */}
          {isOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
              onClick={() => setIsOpen(false)}
              style={{ pointerEvents: 'auto' }}
            ></div>
          )}
          
          {/* User Info and Sign In Button */}
          <div className="hidden md:flex items-center h-full z-[10000] relative">
            {(user || userEmail) ? (
              <div className="relative">
                <div
                  className="px-4 py-2 h-full text-gray-700 hover:bg-blue-50 transition-colors flex items-center cursor-pointer"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                    <Image
                      src="/default-profile.svg"
                      alt="Profile"
                      width={32}
                      height={32}
                    />
                  </div>
                  <span>{user?.email || userEmail || "User"}</span>
                </div>
                
                {/* Profile dropdown menu */}
                {showProfileMenu && (
                  <div ref={profileMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-[10001]">
                    <div className="py-1">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowProfileMenu(false);
                          router.push('/user');
                        }}
                      >
                        View Profile
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={async () => {
                          try {
                            console.log('Sign out button clicked');
                            setShowProfileMenu(false);
                            
                            // Clear local state first
                            setUserEmail('');
                            setUserName('');
                            
                            // Use the signOut function from AuthContext
                            await signOut();
                            console.log('Sign out completed');
                            
                            // Force a page refresh to clear any stale state
                            window.location.href = '/';
                            
                            // Force redirect to home page
                            setTimeout(() => {
                              window.location.href = '/';
                            }, 300);
                          } catch (error) {
                            console.error('Error signing out:', error);
                            // Force redirect to login page even if there's an error
                            window.location.href = '/login';
                          }
                        }}
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
                className="px-4 py-2 h-full text-gray-700 hover:bg-blue-50 transition-colors relative group flex items-center"
              >
                Sign In
                <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/login' ? 1 : 0 }}></div>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-4 h-full focus:outline-none hover:bg-blue-50 transition-colors relative group"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "✖" : "☰"}
            <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`absolute top-16 left-0 w-full bg-white shadow-md flex flex-col md:hidden z-50 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
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
            href="/upload" 
            className="nav-link px-6 py-5 hover:bg-blue-50 relative group border-b border-gray-200" 
            onClick={() => setIsOpen(false)}
          >
            Upload
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
          </Link>
          {user ? (
            <>
              <div className="nav-link px-6 py-5 hover:bg-blue-50 relative group border-b border-gray-200 flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-2">
                  {(user?.email || userEmail || "U").charAt(0).toUpperCase()}
                </div>
                <span>{user?.email || userEmail || "User"}</span>
              </div>
              <Link 
                href="/user" 
                className="nav-link px-6 py-5 hover:bg-blue-50 relative group border-b border-gray-200" 
                onClick={() => setIsOpen(false)}
              >
                View Profile
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="px-6 py-5 text-left text-red-600 hover:bg-red-50 relative group border-b border-gray-200"
              >
                Sign Out
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-6 py-5 text-blue-600 hover:bg-blue-50 relative group border-b border-gray-200"
              onClick={() => setIsOpen(false)}
            >
              Sign In
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
            </Link>
          )}
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
