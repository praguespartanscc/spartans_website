import HeroSection from "@/components/HeroSection";
import SponsorsSection from "@/components/SponsorsSection";
import EventsSection from "@/components/EventsSection";
import PracticeSection from "@/components/PracticeSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* About Section */}
      <section className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1a3049] mb-4 md:mb-6">Welcome to Prague Spartans Cricket Club</h2>
              <p className="text-gray-700 mb-3 md:mb-4 text-sm md:text-base">
                Founded in 2019, the Prague Spartans Cricket Club was born from a simple idea: to bring people together through the love of cricket. What began as a small group of friends sharing a passion for the sport has grown into a vibrant and diverse community.
              </p>
              <p className="text-gray-700 mb-4 md:mb-6 text-sm md:text-base">
                At our core, we are a social club—welcoming players of all backgrounds and skill levels. Whether you&apos;re a seasoned cricketer or picking up the bat for the first time, the Prague Spartans offer a supportive and inclusive environment to enjoy the game.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4">
                <span className="inline-flex items-center bg-[#1a3049] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Competitive Teams
                </span>
                <span className="inline-flex items-center bg-[#1a3049] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Professional Coaching
                </span>
              </div>
            </div>
            <div className="bg-[#f3c066] rounded-lg p-4 md:p-8 shadow-xl mt-6 md:mt-0">
              <h3 className="text-xl md:text-2xl font-bold text-[#1a3049] mb-3 md:mb-4">Join Our Club</h3>
              <p className="text-[#1a3049] mb-4 md:mb-6 text-sm md:text-base">
                Our mission is to promote camaraderie, sportsmanship, and a deep appreciation for cricket while having fun both on and off the field. Join us, and be part of a team where friendship and the spirit of the game come first.
              </p>
              <ul className="space-y-2 mb-4 md:mb-6 text-[#1a3049] text-sm md:text-base">
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Regular training sessions
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  League and tournament play
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Social events throughout the year
                </li>
              </ul>
              <a 
                href="/about" 
                className="block w-full bg-[#1a3049] text-white text-center py-2 md:py-3 px-4 rounded-full font-bold hover:bg-[#2a4059] transition-colors text-sm md:text-base"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>
      
      <EventsSection />
      <PracticeSection />
      <SponsorsSection />
    </div>
  );
}
