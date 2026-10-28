'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Sponsor } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import Reveal from '@/components/ui/Reveal';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { ArrowRight } from '@/components/ui/Icons';

const SponsorsSection = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSponsors() {
      try {
        const { data, error } = await supabase.from('sponsors').select('*').order('created_at', { ascending: false });
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
    <section className="border-t border-cream/10 bg-ink-2 py-20 sm:py-24" aria-labelledby="sponsors-heading">
      <div className="container-x">
        <Reveal className="mb-10 text-center">
          <p className="eyebrow mb-3">Partners</p>
          <h2 id="sponsors-heading" className="font-display text-[clamp(30px,4vw,40px)] font-semibold uppercase">
            Our sponsors
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">The partners who keep the Spartans playing.</p>
        </Reveal>

        {isLoading ? (
          <SkeletonGrid items={4} height={140} label="Loading sponsors" />
        ) : sponsors.length === 0 ? (
          <Reveal className="text-center">
            <a href="mailto:praguespartanscc@gmail.com?subject=Sponsoring%20Prague%20Spartans" className="link-arrow">
              Become a club sponsor <ArrowRight size={18} />
            </a>
          </Reveal>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {sponsors.map((sponsor, i) => (
              <Reveal key={sponsor.id} delay={i * 60} className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]">
                <a
                  href={sponsor.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-hover group flex h-full flex-col items-center gap-4 p-6 text-center"
                >
                  <span className="flex h-24 w-full items-center justify-center rounded-md bg-cream p-3">
                    <Image
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      width={160}
                      height={72}
                      className="h-full w-auto object-contain transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
                    />
                  </span>
                  <span className="font-semibold">{sponsor.name}</span>
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SponsorsSection;
