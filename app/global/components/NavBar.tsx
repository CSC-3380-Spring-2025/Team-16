"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  const blueColor = "#0d93c4";

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
          <span className="text-xl text-gray-800 font-sans">ScheduleLSU</span>
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

          {/* Sign In & Welcome */}
          <div className="hidden md:flex h-full items-center">
            <Link 
              href="/login" 
              className={`nav-link h-full px-6 flex items-center hover:bg-blue-50 transition-colors relative group ${pathname === '/login' ? 'active' : ''}`}
            >
              Sign In
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: blueColor, opacity: pathname === '/login' ? 1 : 0 }}></div>
            </Link>
            <div className="h-full px-6 flex items-center">
              <span className="text-black">Welcome, User!</span>
            </div>
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
          <div className="px-6 py-4 text-black bg-blue-50 font-medium">
            Welcome, User!
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
          <Link 
            href="/login" 
            className="nav-link px-6 py-5 hover:bg-blue-50 relative group" 
            onClick={() => setIsOpen(false)}
          >
            Sign In
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: blueColor, opacity: 0 }}></div>
          </Link>
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
