"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { getLocalProfile, setLocalProfile, getLocalEmail, setLocalEmail } from '../../../utils/localStorage';

function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Flag to track if component is mounted
    let isMounted = true;
    
    const handleAuthCallback = async () => {
      console.log('Auth callback page loaded');
      
      try {
        // Only proceed if component is still mounted
        if (!isMounted) return;
        
        // Get the code from the URL
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const error_description = url.searchParams.get('error_description');
        
        // Check for error in URL parameters
        if (error_description) {
          console.error('Error in URL parameters:', error_description);
          setError(`Authentication error: ${error_description}`);
          setTimeout(() => {
            if (isMounted) router.push('/login?error=auth_error');
          }, 3000);
          return;
        }
        
        // Check for code in URL parameters
        if (!code) {
          console.error('No code found in URL');
          setError('No authentication code found. Please try signing in again.');
          setTimeout(() => {
            if (isMounted) router.push('/login?error=no_code');
          }, 3000);
          return;
        }
        
        setStatus('Verifying your authentication...');
        console.log('Found code in URL, attempting to exchange for session');
        
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Error exchanging code for session:', error);
          setError(`Authentication failed: ${error.message}`);
          setTimeout(() => {
            if (isMounted) router.push('/login?error=auth_error');
          }, 3000);
          return;
        }
        
        setStatus('Authentication successful! Setting up your account...');
        console.log('Successfully exchanged code for session');
        
        // Get user data
        if (data?.user) {
          setStatus('User authenticated, setting up profile...');
          console.log('User authenticated:', data.user.email);
          
          // Update local storage with user email
          setLocalEmail(data.user.email || '');
          
          try {
            // Check if user has a profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();
            
            // Get local profile data
            const localProfile = getLocalProfile();
            
            if (profileError && !profile) {
              setStatus('Creating new user profile...');
              // If no profile exists but we have local data, create a profile with local data
              if (localProfile) {
                try {
                  console.log('Creating new profile from local data:', localProfile);
                  const { data: insertData, error: insertError } = await supabase.from('profiles').insert({
                    id: data.user.id,
                    name: localProfile.name || '',
                    email: data.user.email,
                    major: localProfile.major || '',
                    minor: localProfile.minor || '',
                    year: localProfile.year || '',
                    curriculum: localProfile.curriculum || '',
                    credit: JSON.stringify(localProfile.transcript || {}),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }).select();
                  
                  if (insertError) {
                    console.error('Error creating profile:', insertError);
                    setError(`Error creating profile: ${insertError.message}`);
                  } else {
                    console.log('Successfully created new profile from local data:', insertData);
                  }
                } catch (error: any) {
                  console.error('Exception creating profile:', error);
                  setError(`Exception creating profile: ${error.message || 'Unknown error'}`);
                }
              } else {
                // Create a basic profile
                try {
                  console.log('Creating new basic profile for user:', data.user.email);
                  const { data: insertData, error: insertError } = await supabase.from('profiles').insert({
                    id: data.user.id,
                    email: data.user.email,
                    name: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }).select();
                  
                  if (insertError) {
                    console.error('Error creating basic profile:', insertError);
                    setError(`Error creating basic profile: ${insertError.message}`);
                  } else {
                    console.log('Successfully created new basic profile:', insertData);
                  }
                } catch (error: any) {
                  console.error('Exception creating basic profile:', error);
                  setError(`Exception creating basic profile: ${error.message || 'Unknown error'}`);
                }
              }
            } else if (profile) {
              setStatus('Found existing profile, syncing data...');
              // If profile exists, update local storage with profile data
              try {
                console.log('Found existing profile, updating local storage:', profile);
                const profileData = {
                  name: profile.name || '',
                  email: profile.email || data.user.email || '',
                  major: profile.major || '',
                  minor: profile.minor || '',
                  year: profile.year || '',
                  curriculum: profile.curriculum || '',
                  transcript: profile.credit ? JSON.parse(profile.credit) : {}
                };
                
                setLocalProfile(profileData);
                console.log('Successfully updated local storage with Supabase profile data');
              } catch (error: any) {
                console.error('Error updating local storage:', error);
                setError(`Error updating local storage: ${error.message || 'Unknown error'}`);
              }
            }
          } catch (error: any) {
            console.error('Error handling user profile:', error);
            setError(`Error handling user profile: ${error.message || 'Unknown error'}`);
          }
        } else {
          setError('No user data received after authentication. Please try again.');
        }
        
        // Redirect to dashboard after a short delay to allow profile creation to complete
        setStatus('Success! Redirecting to dashboard...');
        setTimeout(() => {
          if (isMounted) {
            try {
              // Clear any URL parameters to prevent issues with future navigation
              window.history.replaceState({}, document.title, '/auth/callback');
              router.push('/dashboard');
            } catch (navError) {
              console.error('Navigation error:', navError);
              // Fallback to direct navigation
              window.location.href = '/dashboard';
            }
          }
        }, 1500);
      } catch (error: any) {
        console.error('Error in auth callback:', error);
        setError(`An unexpected error occurred: ${error.message || 'Unknown error'}. Please try signing in again.`);
        setTimeout(() => {
          if (isMounted) router.push('/login?error=auth_callback_error');
        }, 3000);
      }
    };

    handleAuthCallback();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [router]);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center max-w-md p-8 rounded-lg shadow-lg bg-white">
        {error ? (
          <>
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
            <p className="mb-4 text-red-600">{error}</p>
            <p className="text-sm text-gray-500">Redirecting you back to login...</p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <h1 className="text-2xl font-bold mb-4">{status}</h1>
            <p className="text-gray-600">Please wait while we complete the sign-in process.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallbackPage;
