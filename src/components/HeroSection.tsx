import Link from 'next/link';
import TeamImagesCarousel from './TeamImagesCarousel';

const HeroSection = () => {
  return (
    <section className="relative h-[600px] overflow-hidden">
      {/* Background Carousel */}
      <div className="absolute inset-0 z-0">
        <TeamImagesCarousel />
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 h-full relative z-20 flex flex-col justify-center items-center text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Prague Spartans Cricket Club</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl">Join us in bringing the spirit of cricket to the heart of Prague</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/join" 
            className="bg-[#f3c066] hover:bg-[#e2af50] text-[#1a3049] font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105"
          >
            Join Our Club
          </Link>
          <Link 
            href="/fixtures" 
            className="bg-transparent border-2 border-white hover:border-[#f3c066] hover:text-[#f3c066] font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105"
          >
            Upcoming Matches
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 