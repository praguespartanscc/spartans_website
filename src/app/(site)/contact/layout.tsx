import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the Club',
  description: 'Apply to play cricket with Prague Spartans Cricket Club. All backgrounds and skill levels welcome.',
  alternates: { canonical: '/contact' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
