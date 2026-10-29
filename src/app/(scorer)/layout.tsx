import HtmlLang from '@/components/HtmlLang';

// The indoor scorer is a full-screen app: no site menu or footer, English only.
export default function ScorerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HtmlLang lang="en" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded focus:bg-gold focus:px-4 focus:py-3 focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>
      <main id="main" className="flex-grow">
        {children}
      </main>
    </>
  );
}
