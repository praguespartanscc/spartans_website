import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NotFoundContent from '@/components/NotFoundContent';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } };

// Unknown URLs render outside the (site) and cs layouts, so this page brings its own header and footer.
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="flex-grow">
        <NotFoundContent lang="en" />
      </main>
      <Footer lang="en" />
    </>
  );
}
