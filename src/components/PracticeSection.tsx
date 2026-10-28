import Image from 'next/image';
import Link from 'next/link';
import type { Practice } from '@/types/supabase';
import Reveal from '@/components/ui/Reveal';
import PracticeRow from '@/components/PracticeRow';
import { ArrowRight } from '@/components/ui/Icons';

const PracticeSection = ({ practices }: { practices: Practice[] }) => {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="practice-heading">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <p className="eyebrow mb-3">Train with us</p>
            <h2 id="practice-heading" className="h-section">
              Where champions
              <br />
              are built
            </h2>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted">
              Regular nets for every level, plus focused batting, bowling and fielding work. Just turn up, or drop us a line first.
            </p>
          </Reveal>

          <div className="mt-8 flex flex-col gap-3">
            {practices.length === 0 ? (
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

        <Reveal delay={120} className="zoom-frame relative aspect-[4/5] overflow-hidden sm:aspect-[4/3] lg:aspect-[4/5]">
          <Image
            src="/story2.jpeg"
            alt="Spartans players in whites with a trophy after an indoor tournament"
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
