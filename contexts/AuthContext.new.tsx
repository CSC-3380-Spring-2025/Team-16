"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { getLocalProfile, setLocalProfile, getLocalEmail, setLocalEmail } from '../utils/localStorage';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error?: any; success?: boolean }>;
  saveUserProfile: (profileData: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session:', session);
        
        // Only set user and session if we have a valid session with a user
        if (session && session.user && session.user.aud === 'authenticated') {
          console.log('Valid authenticated user found:', session.user.email);
          setSession(session);
          setUser(session.user);
          
          // Set local email for local storage sync
          if (session.user.email) {
            setLocalEmail(session.user.email);
          }
          
          // Try to sync user profile if authenticated
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileData) {
              console.log('Found profile data in Supabase:', profileData);
              setLocalProfile(profileData);
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
          }
        } else {
          console.log('No valid authenticated session found');
          setSession(null);
          setUser(null);
        }
        
        // Set loading to false after checking authentication
        setIsLoading(false);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setIsLoading(false);
      }
    };
    
    getInitialSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setSession(null);
          setUser(null);
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userProfile');
        } else if (newSession && newSession.user && newSession.user.aud === 'authenticated') {
          console.log('Valid authenticated user in state change:', newSession.user.email);
          setSession(newSession);
          setUser(newSession.user);
          
          // Update local storage on auth changes
          if (newSession.user.email) {
            setLocalEmail(newSession.user.email);
          }
        }
      }
    );
    
    // Cleanup function to remove the subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Save user profile to Supabase and local storage
  const saveUserProfile = async (profileData: any) => {
    try {
      console.log('Saving user profile:', profileData);
      
      // If user is authenticated, save to Supabase
      if (user) {
        console.log('User is authenticated, saving to Supabase');
        
        // Ensure the profile has the user's ID
        profileData.id = user.id;
        profileData.updated_at = new Date().toISOString();
        
        // Update the profile in Supabase
        const { error } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' });
          
        if (error) {
          console.error('Error updating profile in Supabase:', error);
          throw error;
        }
        
        console.log('Profile updated in Supabase successfully');
      } else {
        console.log('User is not authenticated, saving to local storage only');
      }
      
      // Always save to local storage
      try {
        setLocalProfile(profileData);
        console.log('Updated local storage with profile data');
      } catch (error) {
        console.error('Error updating local storage:', error);
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      // Validate inputs
      if (!email || !password) {
        return { error: new Error('Email and password are required') };
      }

      console.log('Signing in with email and password:', email);
      
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Special handling for auth errors
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Incorrect email or password. Please try again.') };
        }
        console.error('Error signing in:', error);
        return { error };
      }
      
      if (!data.user) {
        console.error('Sign in successful but no user data returned');
        return { error: new Error('Authentication successful but user data is missing') };
      }
      
      console.log('Signed in successfully:', data.user);
      
      // Update user and session state
      setUser(data.user);
      setSession(data.session);
      
      // Save email to local storage
      setLocalEmail(email);
      
      return { error: null };
    } catch (error: any) {
      console.error('Error during sign in:', error);
      return { error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      // Validate inputs
      if (!email || !password) {
        return { error: new Error('Email and password are required') };
      }

      console.log('Signing up with email and password:', email);
      
      // Sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('Error signing up:', error);
        return { error };
      }
      
      if (!data.user) {
        console.error('Sign up successful but no user data returned');
        return { error: new Error('Account creation successful but user data is missing') };
      }
      
      console.log('Signed up successfully:', data.user);
      
      // Save email to local storage
      setLocalEmail(email);
      
      return { error: null };
    } catch (error: any) {
      console.error('Error during sign up:', error);
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log('Signing out...');
      
      // Clear user and session state first to prevent UI issues
      setUser(null);
      setSession(null);
      
      // Clear local storage
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userProfile');
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        return { error };
      }
      
      console.log('Signed out successfully');
      
      // Force a refresh of the auth state
      setIsLoading(false);
      
      return { success: true };
    } catch (error) {
      console.error('Error in signOut function:', error);
      return { error: error as Error };
    }
  };

  // Reset password for existing users
  const resetPassword = async (email: string) => {
    try {
      console.log('Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('Error sending password reset email:', error);
        return { error };
      }
      
      console.log('Password reset email sent successfully');
      return { error: null };
    } catch (error: any) {
      console.error('Error during password reset:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    resetPassword,
    signOut,
    saveUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
