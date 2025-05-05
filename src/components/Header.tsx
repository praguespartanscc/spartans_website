'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/players', label: 'Team' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          if (error.name !== 'AuthSessionMissingError') {
            console.error('Error getting user:', error);
          }
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
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
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Close drawer on route change or ESC
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  return (
    <header className="bg-[#1a3049] text-white shadow-md z-100 sticky top-0">
      <div className="container mx-auto px-4 py-4 flex flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Link href="/" className="flex items-center">
            <Image 
              src="/prague_spartans_home_logo.jpeg" 
              alt="Prague Spartans Cricket Club" 
              width={50} 
              height={50}
              className="rounded-full"
            />
          </Link>
        </div>
        {/* Hamburger for mobile */}
        <button
          className="md:hidden ml-auto flex items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#f3c066]"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Desktop nav */}
        <nav className="hidden md:flex flex-wrap items-center justify-center gap-x-6">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="hover:text-[#f3c066] transition-colors font-medium">
              {link.label}
            </Link>
          ))}
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
      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
           className="fixed inset-0 z-[200] bg-opacity-40 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          />
          {/* Drawer panel */}
          <aside
            className="fixed top-0 right-0 h-full w-72 max-w-[90vw] bg-[#1a3049] shadow-lg z-[201] flex flex-col p-6 animate-slide-in"
            style={{ minWidth: '240px' }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="self-end mb-6 p-2 rounded hover:bg-[#f3c066]/20 focus:outline-none focus:ring-2 focus:ring-[#f3c066]"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <nav className="flex flex-col gap-y-4">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-lg font-medium hover:text-[#f3c066] transition-colors"
                  onClick={() => setDrawerOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!loading && (
                <>
                  {user ? (
                    <div className="flex flex-col gap-y-2 mt-4">
                      {isAdmin && (
                        <Link 
                          href="/admin" 
                          className="hover:text-[#f3c066] transition-colors font-medium flex items-center"
                          onClick={() => setDrawerOpen(false)}
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
                        onClick={() => { setDrawerOpen(false); handleSignOut(); }}
                        className="cursor-pointer bg-transparent hover:bg-[#f3c066]/20 text-[#f3c066] font-medium py-1 px-3 border border-[#f3c066] rounded-full text-sm transition-colors mt-2"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link 
                      href="/login" 
                      className="bg-[#f3c066] hover:bg-[#e2af50] text-[#1a3049] font-medium py-1 px-4 rounded-full transition-colors mt-4"
                      onClick={() => setDrawerOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                </>
              )}
            </nav>
          </aside>
          <style jsx global>{`
            @keyframes slide-in {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .animate-slide-in {
              animation: slide-in 0.25s cubic-bezier(0.4,0,0.2,1);
            }
          `}</style>
        </>
      )}
    </header>
  );
};

export default Header; 