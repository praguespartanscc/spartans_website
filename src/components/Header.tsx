import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
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
            <span className="ml-3 text-xl font-bold">Prague Spartans CC</span>
          </Link>
        </div>
        
        <nav className="flex flex-wrap items-center justify-center gap-x-6">
          <Link href="/" className="hover:text-[#f3c066] transition-colors font-medium">
            Home
          </Link>
          <Link href="/teams" className="hover:text-[#f3c066] transition-colors font-medium">
            Teams
          </Link>
          <Link href="/players" className="hover:text-[#f3c066] transition-colors font-medium">
            Players
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
        </nav>
      </div>
    </header>
  );
};

export default Header; 