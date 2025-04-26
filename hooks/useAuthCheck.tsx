"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { getLocalProfile } from '../utils/localStorage';

/**
 * Custom hook to check authentication status and redirect if needed
 * @param redirectTo Path to redirect to if not authenticated
 * @param requireAuth Whether authentication is required (default: false)
 * @returns Object containing authentication status
 */
export function useAuthCheck(redirectTo = '/login', requireAuth = false) {
  const { user, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined') return;
    
    // Skip the check if still loading auth state
    if (isLoading) return;

    // Check if authenticated via user object or localStorage flag - safely access localStorage
    const isAuthenticated = !!user || (typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true');
    
    // Check if user has local profile data (can use app without signing in)
    const hasLocalProfile = !!getLocalProfile();
    
    // Only redirect if authentication is required AND user is not authenticated
    if (requireAuth && !isAuthenticated && !hasLocalProfile) {
      console.log('Authentication required but not authenticated, redirecting to', redirectTo);
      
      // Use direct navigation to avoid Next.js router issues
      window.location.href = redirectTo;
    } else {
      console.log('User can access this page:', isAuthenticated ? 'Authenticated' : 'Using local data');
    }
    
    setIsChecking(false);
  }, [user, isLoading, redirectTo, router, requireAuth]);

  return {
    isAuthenticated: !!user || (typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true'),
    hasLocalProfile: typeof window !== 'undefined' ? !!getLocalProfile() : false,
    isChecking: isLoading || isChecking
  };
}
