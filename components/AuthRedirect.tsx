"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { getLocalProfile } from '../utils/localStorage';

// Component to handle authentication redirects
export default function AuthRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Only check a limited number of times to prevent infinite loops
    if (checkCount > 3) return;
    
    // Check if user has local profile data (can use app without signing in)
    const hasLocalProfile = !!getLocalProfile();
    
    // If user has a local profile, they can use the app without signing in
    if (hasLocalProfile) {
      console.log('User has local profile data, allowing access without sign-in');
      return;
    }
    
    // Only redirect after we've checked authentication status and only once
    if (!isLoading && !user && !hasLocalProfile && !hasRedirected) {
      setHasRedirected(true); // Prevent multiple redirects
      console.log('AuthRedirect: No authentication or local data, redirecting to login page');
      
      // Use window.location for a hard redirect instead of router.push
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Don't include the from parameter if we're already on the login page
        if (currentPath !== '/login') {
          window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
        }
      }
    } else if (isLoading) {
      // Increment check count if still loading
      setCheckCount(prev => prev + 1);
    }
  }, [isLoading, user, router, hasRedirected, checkCount]);
  
  // This component doesn't render anything
  return null;
}
