import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight } from '@/components/ui/Icons';

type JoinCtaProps = {
  title?: string;
  text?: string;
};

// Gold "join us" band that closes most pages.
export default function JoinCta({
  title = 'Join the Spartan family',
  text = 'All backgrounds, every skill level. Regular training, league and tournament cricket, and social events through the year.',
}: JoinCtaProps) {
  return (
    <section className="bg-gold text-ink">
      <Reveal className="container-x flex flex-wrap items-end justify-between gap-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="h-sub text-[20px] tracking-[0.1em]">Every level welcome</p>
          <h2 className="display mt-3 text-[clamp(40px,7vw,92px)]">{title}</h2>
          <p className="mt-4 text-lg leading-relaxed">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/contact" className="btn btn-dark btn-lg">
            Apply to join
            <ArrowRight size={18} className="btn-arrow" />
          </Link>
          <a href="mailto:praguespartanscc@gmail.com" className="btn btn-ghost-dark btn-lg">
            Email us
          </a>
        </div>
      </Reveal>
    </section>
  );
}
