import type { Lang } from '@/lib/i18n';

const WORDS: Record<Lang, string[]> = {
  en: ['Courage', 'Discipline', 'Unity', 'Respect', 'Excellence', 'Prague since 2019'],
  cs: ['Odvaha', 'Disciplína', 'Jednota', 'Respekt', 'Výkon', 'V Praze od roku 2019'],
};

function Run({ lang }: { lang: Lang }) {
  return (
    <>
      {WORDS[lang].map((word) => (
        <span key={word} className="flex items-center">
          <span className="px-6 sm:px-10">{word}</span>
          <span className="text-gold">✕</span>
        </span>
      ))}
    </>
  );
}

// Decorative marquee of club words; duplicated once so the loop is seamless.
export default function Ticker({ lang = 'en' }: { lang?: Lang }) {
  return (
    <div
      aria-hidden="true"
      className="ticker overflow-hidden border-y border-cream/10 bg-ink py-4 font-display text-lg font-bold uppercase tracking-[0.14em] text-dim sm:py-5 sm:text-2xl"
    >
      <div className="ticker-track">
        <Run lang={lang} />
        <Run lang={lang} />
      </div>
    </div>
  );
}
