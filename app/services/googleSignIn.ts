import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@env';

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  console.log('[GoogleSignIn] Configuring Google Sign-In...');
  console.log('[GoogleSignIn] Web Client ID:', GOOGLE_WEB_CLIENT_ID?.substring(0, 30) + '...');
  
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID, // Web client ID (required for offline access)
    iosClientId: GOOGLE_IOS_CLIENT_ID, // iOS client ID (optional)
    offlineAccess: true, // Request offline access to get refresh token
    forceCodeForRefreshToken: true, // Force to get refresh token
  });
  
  console.log('[GoogleSignIn] Configuration complete');
};

// Sign in with Google using native UI
export const signInWithGoogleNative = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if device supports Google Play Services (Android)
    await GoogleSignin.hasPlayServices();

    // Sign out first to force account selection
    try {
      await GoogleSignin.signOut();
    } catch (signOutError) {
      // Ignore sign out errors (user may not be signed in)
      console.log('[GoogleSignIn] Sign out skipped:', signOutError);
    }

    // Show native Google Sign-In picker
    const userInfo = await GoogleSignin.signIn();
    
    console.log('[GoogleSignIn] User signed in:', userInfo.data?.user.email);

    // Get the ID token
    const { data } = userInfo;
    if (!data?.idToken) {
      return { success: false, error: 'No ID token received from Google' };
    }

    // Sign in to Supabase using the Google ID token
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: data.idToken,
    });

    if (supabaseError) {
      console.error('[GoogleSignIn] Supabase error:', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    if (!supabaseData.user) {
      return { success: false, error: 'Failed to create Supabase session' };
    }

    console.log('[GoogleSignIn] Supabase session created for:', supabaseData.user.email);
    return { success: true };
  } catch (error) {
    console.error('[GoogleSignIn] Error:', error);

    const errorCode = (error as { code?: string }).code;
    const errorMessage = (error as { message?: string }).message;

    if (errorCode === 'SIGN_IN_CANCELLED') {
      return { success: false, error: 'Sign-in cancelled' };
    }

    if (errorCode === 'IN_PROGRESS') {
      return { success: false, error: 'Sign-in already in progress' };
    }

    if (errorCode === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return { success: false, error: 'Google Play Services not available' };
    }

    return { success: false, error: errorMessage || 'Failed to sign in with Google' };
  }
};

// Sign out from Google
export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    console.log('[GoogleSignIn] Signed out successfully');
  } catch (error) {
    console.error('[GoogleSignIn] Sign out error:', error);
  }
};
