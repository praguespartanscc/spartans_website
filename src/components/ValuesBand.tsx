import Reveal from '@/components/ui/Reveal';
import { tr, type Lang } from '@/lib/i18n';

// The club's five core values, from the brand manual.
const VALUES = [
  {
    name: { en: 'Courage', cs: 'Odvaha' },
    text: { en: 'Bold action and fearless competition', cs: 'Odvážná hra a nebojácný přístup k soupeři' },
  },
  {
    name: { en: 'Discipline', cs: 'Disciplína' },
    text: { en: 'Training rigour and tactical excellence', cs: 'Poctivý trénink a promyšlená taktika' },
  },
  {
    name: { en: 'Unity', cs: 'Jednota' },
    text: { en: 'Strength through teamwork and pride', cs: 'Síla v týmové spolupráci a hrdosti' },
  },
  {
    name: { en: 'Respect', cs: 'Respekt' },
    text: { en: 'For opponents, officials and the game', cs: 'K soupeřům, rozhodčím i ke hře samotné' },
  },
  {
    name: { en: 'Excellence', cs: 'Výkon' },
    text: { en: 'Always improving, never settling', cs: 'Stále se zlepšovat, nikdy nepolevit' },
  },
];

export default function ValuesBand({ lang = 'en' }: { lang?: Lang }) {
  return (
    <section aria-label={tr(lang, { en: 'Our values', cs: 'Naše hodnoty' })} className="border-b border-cream/12">
      {/* 1px gaps over a tinted backdrop draw the dividing rules */}
      <div className="container-x">
      <ul className="grid grid-cols-2 gap-px bg-cream/12 lg:grid-cols-5">
        {VALUES.map((value, i) => (
          <Reveal
            as="li"
            key={value.name.en}
            delay={i * 80}
            className={`bg-ink py-7 pr-5 lg:py-9 ${i % 2 ? 'pl-5' : ''} lg:pl-6 lg:first:pl-0 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}
          >
            <p className="font-display text-[14px] font-bold tracking-[0.16em] text-gold">0{i + 1}</p>
            <p className="h-sub mt-2 text-[26px] sm:text-[30px]">{value.name[lang]}</p>
            <p className="mt-2 text-[14px] leading-snug text-faint">{value.text[lang]}</p>
          </Reveal>
        ))}
      </ul>
      </div>
    </section>
  );
}
