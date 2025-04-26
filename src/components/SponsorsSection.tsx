import Image from 'next/image';

const SponsorsSection = () => {
  // Mock sponsors data - replace with actual sponsors
  const sponsors = [
    { id: 1, name: 'Sponsor 1', logo: '/vercel.svg' },
    { id: 2, name: 'Sponsor 2', logo: '/vercel.svg' },
    { id: 3, name: 'Sponsor 3', logo: '/vercel.svg' },
    { id: 4, name: 'Sponsor 4', logo: '/vercel.svg' },
    { id: 5, name: 'Sponsor 5', logo: '/vercel.svg' },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a3049] mb-2">Our Sponsors</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We are grateful for the support of our sponsors who help make Prague cricket possible.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 w-full max-w-[200px] h-[120px] flex items-center justify-center">
              <Image
                src={sponsor.logo}
                alt={sponsor.name}
                width={120}
                height={60}
                style={{ objectFit: 'contain' }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SponsorsSection; 