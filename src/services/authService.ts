import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Helper function to get the Supabase client
function getSupabaseClient() {
  return createClientComponentClient();
}

// Sign in with Google
export async function signInWithGoogle() {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.error('Cannot sign in with Google: Supabase is not configured');
    throw new Error('Supabase is not configured. Check your environment variables.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
  
  return data;
}

// Sign out
export async function signOut() {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.error('Cannot sign out: Supabase is not configured');
    throw new Error('Supabase is not configured. Check your environment variables.');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
  
  return true;
}

// Get current user
export async function getCurrentUser() {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.error('Cannot get current user: Supabase is not configured');
    return null;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      if (error.name === 'AuthSessionMissingError') {
        // This is expected after logout, not a true error
        return null;
      }
      console.error('Error getting current user:', error);
      return null;
    }
    
    return data?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Get session
export async function getSession() {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.error('Cannot get session: Supabase is not configured');
    return null;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      if (error.name === 'AuthSessionMissingError') {
        // This is expected after logout, not a true error
        return null;
      }
      console.error('Error getting session:', error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    return { user: data.user, error };
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

export async function resetPassword(email: string) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

export async function updateUserRole(userId: string, isAdmin: boolean) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { isAdmin } }
    );
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user role:', error);
    // If admin API fails, try the user update API
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { isAdmin }
      });
      
      if (error) throw error;
      return data;
    } catch (fallbackError) {
      console.error('Fallback error updating user role:', fallbackError);
      throw fallbackError;
    }
  }
}

export async function isUserAdmin(user: User) {
  if (!user) return false;
  return !!user.user_metadata?.isAdmin;
} 