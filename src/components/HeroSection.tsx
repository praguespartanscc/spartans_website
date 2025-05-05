import Link from 'next/link';
import TeamImagesCarousel from './TeamImagesCarousel';

const HeroSection = () => {
  return (
    <section className="relative h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden">
      {/* Background Carousel */}
      <div className="absolute inset-0 z-0">
        <TeamImagesCarousel />
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 h-full relative z-20 flex flex-col justify-center items-center text-center text-white">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6 px-2">
          Prague Spartans Cricket Club
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 max-w-2xl px-4">
          Join us in bringing the spirit of cricket to the heart of Prague
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link 
            href="/contact" 
            className="w-full sm:w-auto bg-[#f3c066] hover:bg-[#e2af50] text-[#1a3049] font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full shadow-lg transition-all transform hover:scale-105 text-sm sm:text-base"
          >
            Join Our Club
          </Link>
          <Link 
            href="/fixtures" 
            className="w-full sm:w-auto bg-transparent border-2 border-white hover:border-[#f3c066] hover:text-[#f3c066] font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full shadow-lg transition-all transform hover:scale-105 text-sm sm:text-base"
          >
            Upcoming Matches
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 