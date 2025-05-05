'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClientComponentClient();
        
        // Get the user
        const { data: { user }, error } = await supabase.auth.getUser();

        // If there's an error, just set user to null
        if (error) {
          if (error.name !== 'AuthSessionMissingError') {
            console.error('Error getting user:', error);
          }
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check if user is admin
        const isUserAdmin = user?.user_metadata?.isAdmin === true;
        
        setUser(user);
        setIsAdmin(isUserAdmin);
      } catch (error) {
        console.error('Error in Header auth check:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClientComponentClient();
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      
      // Force a complete page reload and navigation to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-[#1a3049] text-white shadow-md z-100 sticky top-0">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Link href="/" className="flex items-center">
            <Image 
              src="/prague_spartans_home_logo.jpeg" 
              alt="Prague Spartans Cricket Club" 
              width={50} 
              height={50}
              className="rounded-full"
            />
            <span className="ml-3 text-xl font-bold">PS Cricket Club</span>
          </Link>
        </div>
        
        <nav className="flex flex-wrap items-center justify-center gap-x-6">
          <Link href="/" className="hover:text-[#f3c066] transition-colors font-medium">
            Home
          </Link>
          <Link href="/players" className="hover:text-[#f3c066] transition-colors font-medium">
            Team
          </Link>
          <Link href="/fixtures" className="hover:text-[#f3c066] transition-colors font-medium">
            Fixtures
          </Link>
          <Link href="/about" className="hover:text-[#f3c066] transition-colors font-medium">
            About
          </Link>
          <Link href="/contact" className="hover:text-[#f3c066] transition-colors font-medium">
            Contact
          </Link>
          
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center ml-4">
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="hover:text-[#f3c066] transition-colors font-medium flex items-center"
                    >
                      {user?.user_metadata?.avatar_url && (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata.full_name || 'User'}
                          width={30}
                          height={30}
                          className="rounded-full mr-2"
                        />
                      )}
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="ml-4 cursor-pointer bg-transparent hover:bg-[#f3c066]/20 text-[#f3c066] font-medium py-1 px-3 border border-[#f3c066] rounded-full text-sm transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="ml-4 bg-[#f3c066] hover:bg-[#e2af50] text-[#1a3049] font-medium py-1 px-4 rounded-full transition-colors"
                >
                  Sign In
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 