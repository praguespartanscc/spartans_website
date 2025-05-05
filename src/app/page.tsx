import HeroSection from "@/components/HeroSection";
import SponsorsSection from "@/components/SponsorsSection";
import EventsSection from "@/components/EventsSection";
import PracticeSection from "@/components/PracticeSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1a3049] mb-6">Welcome to Prague Spartans Cricket Club</h2>
              <p className="text-gray-700 mb-4">
                Founded in 2019, the Prague Spartans Cricket Club was born from a simple idea: to bring people together through the love of cricket. What began as a small group of friends sharing a passion for the sport has grown into a vibrant and diverse community.
              </p>
              <p className="text-gray-700 mb-6">
                At our core, we are a social club—welcoming players of all backgrounds and skill levels. Whether you&apos;re a seasoned cricketer or picking up the bat for the first time, the Prague Spartans offer a supportive and inclusive environment to enjoy the game.
              </p>
              <div className="flex space-x-4">
                <span className="inline-flex items-center bg-[#1a3049] text-white px-4 py-2 rounded-full text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Competitive Teams
                </span>
                <span className="inline-flex items-center bg-[#1a3049] text-white px-4 py-2 rounded-full text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Professional Coaching
                </span>
              </div>
            </div>
            <div className="bg-[#f3c066] rounded-lg p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-[#1a3049] mb-4">Join Our Club</h3>
              <p className="text-[#1a3049] mb-6">
                Our mission is to promote camaraderie, sportsmanship, and a deep appreciation for cricket while having fun both on and off the field. Join us, and be part of a team where friendship and the spirit of the game come first.
              </p>
              <ul className="space-y-2 mb-6 text-[#1a3049]">
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Regular training sessions
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  League and tournament play
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Social events throughout the year
                </li>
              </ul>
              <a 
                href="/about" 
                className="block w-full bg-[#1a3049] text-white text-center py-3 px-4 rounded-full font-bold hover:bg-[#2a4059] transition-colors"
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
