import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NotFoundContent from '@/components/NotFoundContent';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } };

// Unknown URLs render outside the (site) and cs layouts, so this page brings its own header and footer.
export default function NotFound() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded focus:bg-gold focus:px-4 focus:py-3 focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-grow outline-none">
        <NotFoundContent lang="en" />
      </main>
      <Footer lang="en" />
    </>
  );
}
