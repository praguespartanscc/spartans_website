import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Validate essential environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a Supabase client with the service role key if available
const supabaseAdmin = supabaseUrl && serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

export async function POST(request: Request) {
  try {
    // Check if essential environment variables are available
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error - Missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Create regular client for auth checking
    if (!anonKey) {
      console.error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return NextResponse.json(
        { error: 'Server configuration error - Missing Supabase anon key' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, anonKey);
    
    // Verify the user is authenticated and an admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Not logged in' },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    const user = session.user;
    const isAdmin = user.user_metadata?.isAdmin === true;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const sponsorData = await request.json();
    
    // Validate required fields
    if (!sponsorData.name || !sponsorData.logo_url) {
      return NextResponse.json(
        { error: 'Bad Request - Name and logo URL are required' },
        { status: 400 }
      );
    }
    
    // Insert the sponsor using the admin client (bypasses RLS)
    if (!supabaseAdmin) {
      console.error('supabaseAdmin client is not initialized');
      return NextResponse.json(
        { error: 'Server configuration error - Database client initialization failed' },
        { status: 500 }
      );
    }
    
    const { data, error } = await supabaseAdmin
      .from('sponsors')
      .insert([
        {
          name: sponsorData.name,
          website_url: sponsorData.website_url || '',
          logo_url: sponsorData.logo_url,
          description: sponsorData.description || ''
        }
      ])
      .select();
    
    if (error) {
      console.error('Error inserting sponsor:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, sponsor: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in sponsors API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 