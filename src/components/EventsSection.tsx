import Image from 'next/image';
import Link from 'next/link';

const EventsSection = () => {
  // Mock upcoming cricket matches - replace with actual match data
  const upcomingMatches = [
    {
      id: 1,
      homeTeam: 'Prague Spartans',
      awayTeam: 'Prague Eagles',
      date: 'May 15, 2025',
      time: '14:00',
      venue: 'Prague Cricket Ground',
      matchType: 'T20 Match - Czech Cricket League',
      image: '/WhatsApp Image 2025-04-24 at 14.31.05.jpeg'
    },
    {
      id: 2,
      homeTeam: 'Prague Spartans',
      awayTeam: 'Vienna CC',
      date: 'May 28, 2025',
      time: '13:30',
      venue: 'Prague Cricket Ground',
      matchType: 'T20 Match - Central European League',
      image: '/WhatsApp Image 2025-04-24 at 14.31.05.jpeg'
    },
    {
      id: 3,
      homeTeam: 'Dresden CC',
      awayTeam: 'Prague Spartans',
      date: 'June 5, 2025',
      time: '13:00',
      venue: 'Dresden Cricket Field',
      matchType: 'International Friendly Match',
      image: '/WhatsApp Image 2025-04-24 at 14.31.05.jpeg'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a3049] mb-2">Upcoming Matches</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Support the Prague Spartans at our upcoming cricket matches
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {upcomingMatches.map((match) => (
            <div 
              key={match.id} 
              className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={match.image}
                  alt={`${match.homeTeam} vs ${match.awayTeam}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a3049]/80 to-transparent flex items-end p-4">
                  <div className="text-white font-bold text-xl">
                    {match.homeTeam} vs {match.awayTeam}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center text-gray-600 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{match.date} at {match.time}</span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">{match.venue}</span>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">{match.matchType}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link 
            href="/fixtures"
            className="bg-[#1a3049] hover:bg-[#2a4059] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
          >
            View All Fixtures
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventsSection; 