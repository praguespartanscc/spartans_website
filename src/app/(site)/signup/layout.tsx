import type { Metadata } from 'next';

// Account pages stay out of search results (noindex), but crawlers may still fetch them.
export const metadata: Metadata = { title: 'Create an account', robots: { index: false, follow: true } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
