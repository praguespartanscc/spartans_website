import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HtmlLang from '@/components/HtmlLang';

// Czech pages under /cs. The response also sends "Content-Language: cs" (next.config.ts).
export default function CzechLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="cs" className="flex flex-grow flex-col">
      <HtmlLang lang="cs" />
      <Header />
      <main id="main" className="flex-grow">
        {children}
      </main>
      <Footer lang="cs" />
    </div>
  );
}
