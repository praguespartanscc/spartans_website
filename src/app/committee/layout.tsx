import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Committee',
  description: 'Meet the committee that runs Prague Spartans Cricket Club.',
  alternates: { canonical: '/committee' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
