"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="w-full fixed top-0 left-0 z-50 bg-white shadow-md h-16 p-4 flex justify-between items-center font-mono">
        {/* Logo Section (Clicking the logo bring you to the homepage) */}
        <Link href="/" className="flex items-center space-x-3">
          <Image 
            src="/logo.svg" 
            alt="Logo" 
            width={50} 
            height={50} 
            className="object-contain rotate-90 cursor-pointer"
          />
          <span className="text-xl text-gray-800">ScheduleLSU</span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"} {/* Unicode icons for open/close */}
        </button>

        {/* Navigation Links */}
        <div className="md:flex space-x-6 hidden">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/myschedule" className="nav-link">Schedule</Link>
          <Link href="/user" className="nav-link">Profile</Link>
          <Link href="/upload" className="nav-link">Upload</Link>
          <Link href="/login" className="nav-link">Sign In</Link>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="absolute top-16 left-0 w-full bg-white shadow-md p-4 flex flex-col space-y-4 md:hidden z-50">
            <Link href="/dashboard" className="nav-link" onClick={() => setIsOpen(false)}>Dashboard</Link>
            <Link href="/myschedule" className="nav-link" onClick={() => setIsOpen(false)}>Schedule</Link>
            <Link href="/user" className="nav-link" onClick={() => setIsOpen(false)}>Profile</Link>
            <Link href="/upload" className="nav-link" onClick={() => setIsOpen(false)}>Upload</Link>
            <Link href="/login" className="nav-link" onClick={() => setIsOpen(false)}>Sign In</Link>
          </div>
        )}
      </nav>

      {/* Push Content Down */}
      <div className="pt-16">
      </div>
    </>
  );
};

export default NavBar;
