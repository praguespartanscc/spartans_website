'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Sponsor } from '@/types/supabase';
import { supabase } from '@/lib/supabase';

const SponsorsSection = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSponsors() {
      try {
        const { data, error } = await supabase
          .from('sponsors')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching sponsors:', error);
          return;
        }
        
        setSponsors(data || []);
      } catch (error) {
        console.error('Failed to fetch sponsors:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSponsors();
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a3049] mb-2">Our Sponsors</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We are grateful for the support of our sponsors who help make Prague cricket possible.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No sponsors found at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch">
            {sponsors.map((sponsor) => (
              <a 
                key={sponsor.id} 
                href={sponsor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center p-6 h-full group hover:scale-105"
              >
                <div className="h-24 w-full relative mb-4 flex items-center justify-center">
                  <Image
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    width={120}
                    height={60}
                    style={{ objectFit: 'contain' }}
                    className="transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-[#1a3049] mb-2">{sponsor.name}</h3>
                  {sponsor.description && (
                    <p className="text-gray-600 text-sm">{sponsor.description}</p>
                  )}
                  <div className="mt-3 text-blue-600 text-xs font-medium group-hover:underline">
                    Visit website →
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SponsorsSection; 