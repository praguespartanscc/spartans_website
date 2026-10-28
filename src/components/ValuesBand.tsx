import Reveal from '@/components/ui/Reveal';

// The club's five core values, from the brand manual.
const VALUES = [
  { name: 'Courage', text: 'Bold action and fearless competition' },
  { name: 'Discipline', text: 'Training rigour and tactical excellence' },
  { name: 'Unity', text: 'Strength through teamwork and pride' },
  { name: 'Respect', text: 'For opponents, officials and the game' },
  { name: 'Excellence', text: 'Always improving, never settling' },
];

export default function ValuesBand() {
  return (
    <section aria-label="Our values" className="border-b border-cream/12">
      {/* 1px gaps over a tinted backdrop draw the dividing rules */}
      <div className="container-x">
      <ul className="grid grid-cols-2 gap-px bg-cream/12 lg:grid-cols-5">
        {VALUES.map((value, i) => (
          <Reveal
            as="li"
            key={value.name}
            delay={i * 80}
            className={`bg-ink py-7 pr-5 lg:py-9 ${i % 2 ? 'pl-5' : ''} lg:pl-6 lg:first:pl-0 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}
          >
            <p className="font-display text-[14px] font-bold tracking-[0.16em] text-gold">0{i + 1}</p>
            <p className="h-sub mt-2 text-[26px] sm:text-[30px]">{value.name}</p>
            <p className="mt-2 text-[14px] leading-snug text-faint">{value.text}</p>
          </Reveal>
        ))}
      </ul>
      </div>
    </section>
  );
}
