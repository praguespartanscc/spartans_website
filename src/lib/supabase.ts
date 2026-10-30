// Public Supabase settings for the browser. The browser client itself comes from
// createClientComponentClient() (one shared instance per tab), so nothing is created here:
// a second client at import time made every page log "Multiple GoTrueClient instances".
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;
