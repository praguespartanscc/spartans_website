import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HtmlLang from '@/components/HtmlLang';

// English pages (the default language).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HtmlLang lang="en" />
      <Header />
      <main id="main" className="flex-grow">
        {children}
      </main>
      <Footer lang="en" />
    </>
  );
}
