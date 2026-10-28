import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight } from '@/components/ui/Icons';

type JoinCtaProps = {
  title?: string;
  text?: string;
};

// Gold "join us" band that closes most pages.
export default function JoinCta({
  title = 'Pick up a bat with us',
  text = 'All backgrounds, every skill level. Regular training, league and tournament cricket, and social events through the year.',
}: JoinCtaProps) {
  return (
    <section className="bg-gold text-ink">
      <Reveal className="container-x flex flex-wrap items-center justify-between gap-8 py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="display text-[clamp(40px,6vw,68px)] font-bold">{title}</h2>
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
