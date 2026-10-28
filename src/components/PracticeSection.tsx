'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUpcomingPractices } from '@/services/practiceService';
import type { Practice } from '@/types/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dateParts, formatTime, titleCase } from '@/lib/format';
import Reveal from '@/components/ui/Reveal';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ArrowRight, Clock, MapPin } from '@/components/ui/Icons';

export function PracticeRow({ practice }: { practice: Practice }) {
  const d = dateParts(practice.date);
  return (
    <div className="card card-hover flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
      <div className="w-14 shrink-0 text-center font-display uppercase leading-none">
        <div className="text-[30px] font-semibold">{d.day}</div>
        <div className="mt-1 text-[11px] tracking-[0.16em] text-faint">{d.month}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {practice.title || `${titleCase(practice.type) || 'Regular'} practice`}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={15} className="text-faint" />
            {d.weekday} {formatTime(practice.time)}
          </span>
          {practice.venue && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-faint" />
              {practice.venue}
            </span>
          )}
        </div>
        {(practice.description || practice.notes) && (
          <p className="mt-2 text-[14px] text-faint">{practice.description || practice.notes}</p>
        )}
      </div>
    </div>
  );
}

const PracticeSection = () => {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPractices() {
      try {
        if (!isSupabaseConfigured) {
          setPractices([]);
          return;
        }
        const data = await getUpcomingPractices();
        setPractices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load practices:', err);
        setError('We could not load practice times right now.');
      } finally {
        setIsLoading(false);
      }
    }
    loadPractices();
  }, []);

  return (
    <section className="py-20 sm:py-28" aria-labelledby="practice-heading">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <p className="eyebrow mb-3">Train with us</p>
            <h2 id="practice-heading" className="h-section">
              Practice sessions
            </h2>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted">
              Regular nets for every level, plus focused batting, bowling and fielding work. Just turn up, or drop us a line first.
            </p>
          </Reveal>

          <div className="mt-8 flex flex-col gap-3">
            {isLoading ? (
              <SkeletonList rows={3} height={84} label="Loading practice sessions" />
            ) : error ? (
              <p className="alert-error">{error}</p>
            ) : practices.length === 0 ? (
              <div className="card border-dashed p-6 text-muted">
                No sessions on the calendar right now.{' '}
                <Link href="/contact" className="font-semibold text-gold hover:text-gold-hi">
                  Get in touch
                </Link>{' '}
                and we&apos;ll tell you when the next one is.
              </div>
            ) : (
              practices.map((practice, i) => (
                <Reveal key={practice.id} delay={i * 70}>
                  <PracticeRow practice={practice} />
                </Reveal>
              ))
            )}
          </div>

          <Reveal delay={150} className="mt-8">
            <Link href="/practices" className="link-arrow">
              Full practice calendar <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={120} className="zoom-frame relative aspect-[4/5] overflow-hidden rounded-lg sm:aspect-[4/3] lg:aspect-[4/5]">
          <Image
            src="/home_carousel.jpeg"
            alt="Spartans players holding a trophy after an indoor tournament"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>
      </div>
    </section>
  );
};

export default PracticeSection;
