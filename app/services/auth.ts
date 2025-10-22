import { useCallback, useEffect, useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { signInWithGoogleNative, signOutFromGoogle, configureGoogleSignIn } from './googleSignIn';

// Required for web-based auth flows
WebBrowser.maybeCompleteAuthSession();

export type AuthState = {
  status: 'guest' | 'authenticated' | 'loading';
  email?: string;
  userId?: string;
  lastError?: string | null;
};

export const useAuthService = () => {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // Configure Google Sign-In on mount
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setState({
          status: 'authenticated',
          email: session.user.email ?? undefined,
          userId: session.user.id,
          lastError: null,
        });
      } else {
        setState({ status: 'guest' });
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setState({
          status: 'authenticated',
          email: session.user.email ?? undefined,
          userId: session.user.id,
          lastError: null,
        });
      } else {
        setState({ status: 'guest' });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, status: 'loading', lastError: null }));
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign up error:', error);
        setState({ status: 'guest', lastError: error.message });
        return false;
      }

      if (data.user && data.session) {
        // User created and automatically logged in (email confirmation disabled)
        console.log('[Auth] User signed up and logged in, triggering initial sync...');
        // Session is automatically set by onAuthStateChange listener
        return true;
      }

      setState({ status: 'guest', lastError: 'Unable to create account. Please try again.' });
      return false;
    } catch (error) {
      console.error('[Auth] Sign up exception:', error);
      setState({
        status: 'guest',
        lastError: 'Internet connection required to create account. Your data remains safe locally.',
      });
      return false;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, status: 'loading', lastError: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Login error:', error);
        setState({ status: 'guest', lastError: error.message });
        return false;
      }

      if (data.user) {
        // User logged in successfully - trigger sync
        console.log('[Auth] User logged in, triggering sync...');
        return true;
      }

      setState({ status: 'guest', lastError: 'Invalid email or password' });
      return false;
    } catch (error) {
      console.error('[Auth] Login exception:', error);
      setState({
        status: 'guest',
        lastError: 'Internet connection required to log in. Your data remains safe locally.',
      });
      return false;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading', lastError: null }));
    
    // Use native Google Sign-In
    const result = await signInWithGoogleNative();
    
    if (result.success) {
      console.log('[Auth] Google sign-in successful, triggering sync...');
      // Session is set by signInWithGoogleNative, the onAuthStateChange listener will update the state
      return true;
    } else {
      console.error('[Auth] Google sign-in failed:', result.error);
      setState({ 
        status: 'guest', 
        lastError: result.error || 'Failed to sign in with Google' 
      });
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      // Sign out from Google
      await signOutFromGoogle();
      // Sign out from Supabase
      await supabase.auth.signOut();
      setState({ status: 'guest' });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // Still set to guest even if logout fails
      setState({ status: 'guest' });
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    try {
      if (!state.email) {
        return { success: false, error: 'No email address found' };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: state.email,
      });

      if (error) {
        console.error('[Auth] Resend verification error:', error);
        return { success: false, error: error.message };
      }

      console.log('[Auth] Verification email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Resend verification exception:', error);
      return { success: false, error: 'Failed to send verification email' };
    }
  }, [state.email]);

  const value = useMemo(
    () => ({ ...state, signup, login, signInWithGoogle, logout, resendVerificationEmail }),
    [state, signup, login, signInWithGoogle, logout, resendVerificationEmail],
  );

  return value;
};
