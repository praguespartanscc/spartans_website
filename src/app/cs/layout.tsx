import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BackToTop } from '@/components/ScrollExtras';
import HtmlLang from '@/components/HtmlLang';

// Czech pages under /cs. The response also sends "Content-Language: cs" (next.config.ts).
export default function CzechLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="cs" className="flex flex-grow flex-col">
      <HtmlLang lang="cs" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded focus:bg-gold focus:px-4 focus:py-3 focus:font-semibold focus:text-ink"
      >
        Přeskočit na obsah
      </a>
      <Header />
      <main id="main" className="flex-grow">
        {children}
      </main>
      <Footer lang="cs" />
      <BackToTop lang="cs" />
    </div>
  );
}
