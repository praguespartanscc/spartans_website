import { createClient } from '@supabase/supabase-js';

// Check for environment variables and provide meaningful error messages
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single supabase client for the entire application
// Default to empty strings but prevent client initialization in client components if env vars are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Only initialize if both values are provided
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add a helper function to check if Supabase is configured
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey; 