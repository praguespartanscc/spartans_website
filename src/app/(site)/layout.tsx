import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BackToTop } from '@/components/ScrollExtras';
import HtmlLang from '@/components/HtmlLang';

// English pages (the default language).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HtmlLang lang="en" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded focus:bg-gold focus:px-4 focus:py-3 focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-grow">
        {children}
      </main>
      <Footer lang="en" />
      <BackToTop lang="en" />
    </>
  );
}
