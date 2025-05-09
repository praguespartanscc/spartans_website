import { Metadata } from "next";
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Prague Spartans Cricket Club - our history, mission, and community. Founded in 2019, we welcome cricket players of all skill levels in Prague.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Prague Spartans Cricket Club',
    description: 'Learn about Prague Spartans Cricket Club - our history, mission, and community. Founded in 2019, we welcome cricket players of all skill levels in Prague.',
    url: 'https://praguespartanscc.com/about',
    images: [
      {
        url: '/story1.jpeg',
        width: 1200,
        height: 630,
        alt: 'Prague Spartans Cricket Club Team Photo',
      }
    ],
  }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#1a3049] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Prague Spartans Cricket Club</h1>
          <p className="text-xl max-w-3xl mx-auto opacity-90">
            A community united by the love of cricket
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-[#1a3049] mb-6">Our Story</h2>
              <p className="text-gray-700 mb-6">
                Founded in 2019, the Prague Spartans Cricket Club was born from a simple idea: to bring people together through 
                the love of cricket. What began as a small group of friends sharing a passion for the sport has grown into a 
                vibrant and diverse community.
              </p>
              <p className="text-gray-700">
                At our core, we are a social club—welcoming players of all backgrounds and skill levels. Whether you&apos;re a 
                seasoned cricketer or picking up the bat for the first time, the Prague Spartans offer a supportive and inclusive 
                environment to enjoy the game.
              </p>
            </div>
            <div className="relative h-80 md:h-96 overflow-hidden rounded-lg shadow-xl">
              <Image 
                src="/story1.jpeg" 
                alt="Prague Spartans Cricket Club team" 
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="order-2 lg:order-1 relative h-80 md:h-96 overflow-hidden rounded-lg shadow-xl">
              <Image 
               src="/story2.jpeg"
                alt="Cricket match action" 
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-[#1a3049] mb-6">Our Mission</h2>
              <p className="text-gray-700 mb-6">
                Our mission is to promote camaraderie, sportsmanship, and a deep appreciation for cricket while having fun 
                both on and off the field.
              </p>
              <p className="text-gray-700">
                We strive to create a community where players can develop their skills, forge lasting friendships, and 
                share their passion for cricket. Through regular practice sessions, matches, and social events, we aim to 
                foster a sense of belonging and team spirit.
              </p>
            </div>
          </div>

          <div className="bg-[#f3f4f6] rounded-lg p-8 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#1a3049] mb-4">What We Offer</h2>
              <p className="text-gray-700 max-w-3xl mx-auto">
                Join us and enjoy these benefits as a member of Prague Spartans Cricket Club
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="bg-[#f3c066] w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1a3049] mb-2">Inclusive Community</h3>
                <p className="text-gray-700">
                  Welcoming environment for players of all skill levels, backgrounds, and ages.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="bg-[#f3c066] w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1a3049] mb-2">Regular Training</h3>
                <p className="text-gray-700">
                  Weekly practice sessions focused on improving skills and enjoying the game.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="bg-[#f3c066] w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1a3049] mb-2">Social Events</h3>
                <p className="text-gray-700">
                  Regular gatherings, team dinners, and events to build friendships beyond the field.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#1a3049] mb-6">Join Us Today</h2>
            <p className="text-gray-700 mb-8 max-w-3xl mx-auto">
              Join us, and be part of a team where friendship and the spirit of the game come first. Whether you&apos;re looking to 
              play competitively or just enjoy the sport in a friendly environment, there&apos;s a place for you with the Prague Spartans.
            </p>
            <a 
              href="/contact" 
              className="inline-block bg-[#1a3049] text-white py-3 px-8 rounded-full font-bold hover:bg-[#2a4059] transition-colors"
            >
              Get In Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
} 