const WORDS = ['Courage', 'Discipline', 'Unity', 'Respect', 'Excellence', 'Prague since 2019'];

function Run() {
  return (
    <>
      {WORDS.map((word) => (
        <span key={word} className="flex items-center">
          <span className="px-6 sm:px-10">{word}</span>
          <span className="text-gold">✕</span>
        </span>
      ))}
    </>
  );
}

// Decorative marquee of club words; duplicated once so the loop is seamless.
export default function Ticker() {
  return (
    <div
      aria-hidden="true"
      className="ticker overflow-hidden border-y border-cream/10 bg-ink py-4 font-display text-lg font-bold uppercase tracking-[0.14em] text-dim sm:py-5 sm:text-2xl"
    >
      <div className="ticker-track">
        <Run />
        <Run />
      </div>
    </div>
  );
}
