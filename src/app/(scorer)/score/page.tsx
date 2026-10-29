import type { Metadata } from 'next';
import { ScoreHome } from '@/components/indoor/ScorerPage';

export const metadata: Metadata = {
  title: 'Indoor scorer',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ScoreHome />;
}
