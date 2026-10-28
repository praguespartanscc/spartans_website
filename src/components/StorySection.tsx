import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight } from '@/components/ui/Icons';

export default function StorySection() {
  return (
    <section className="border-t border-cream/12 py-20 sm:py-28" aria-labelledby="story-heading">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow mb-3">Our mission</p>
          <h2 id="story-heading" className="h-section">
            Compete
            <br />
            fearlessly
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-cream">
            To compete fearlessly while growing cricket in Prague and inspiring the local community through discipline,
            respect, and teamwork.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            Founded in 2019, the club began as a small group of friends brought together by the love of cricket, and has grown
            into a vibrant and diverse community.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            Whether you&apos;re a seasoned cricketer or picking up the bat for the first time, there&apos;s a place for you in
            the Spartan family, on and off the field.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/about" className="btn btn-outline">
              About the club
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
            <Link href="/committee" className="btn btn-outline">
              Meet the committee
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-4">
          <Reveal delay={100} as="figure" className="col-span-2 m-0">
            <div className="zoom-frame relative aspect-[16/9] overflow-hidden">
              <Image
                src="/home_carouse2.jpeg"
                alt="A row of silver Prague Spartans award trophies"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-[14px] text-faint">Season 2024 player awards</figcaption>
          </Reveal>
          <Reveal delay={180} as="figure" className="col-span-2 m-0 sm:col-span-2">
            <div className="zoom-frame relative aspect-[16/9] overflow-hidden">
              <Image
                src="/story1.jpeg"
                alt="Club members gathered outside a restaurant in Prague with their awards"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover object-[center_60%]"
              />
            </div>
            <figcaption className="mt-2 text-[14px] text-faint">Awards night with the squad</figcaption>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
