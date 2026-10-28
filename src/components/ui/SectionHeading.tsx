import type { ReactNode } from 'react';
import Reveal from './Reveal';

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  id?: string;
};

export default function SectionHeading({ eyebrow, title, intro, action, id }: SectionHeadingProps) {
  return (
    <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 md:mb-12">
      <div className="max-w-2xl">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 id={id} className="h-section">
          {title}
        </h2>
        {intro && <p className="mt-4 text-[17px] leading-relaxed text-muted">{intro}</p>}
      </div>
      {action}
    </Reveal>
  );
}
