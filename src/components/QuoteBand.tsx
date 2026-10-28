import Image from 'next/image';
import Reveal from '@/components/ui/Reveal';

// Full-bleed brand line over a photo held back by an 80% black overlay (brand manual rule).
export default function QuoteBand() {
  return (
    <section aria-label="Club motto" className="relative isolate overflow-hidden">
      <Image
        src="/home_carousel.jpeg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[center_35%] grayscale"
      />
      <div className="absolute inset-0 -z-10 bg-ink/80" />
      <Reveal className="container-x flex min-h-[380px] flex-col items-center justify-center py-20 text-center sm:min-h-[520px]">
        <p className="eyebrow">Matchday</p>
        <p className="display mt-5 text-[clamp(40px,7.5vw,104px)]">
          Stand together.
          <br />
          <span className="text-gold">Strike harder.</span>
        </p>
      </Reveal>
    </section>
  );
}
