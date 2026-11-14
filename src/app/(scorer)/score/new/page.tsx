import type { Metadata } from 'next';
import { NewMatch } from '@/components/indoor/ScorerPage';

export const metadata: Metadata = {
  title: 'New indoor match',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NewMatch />;
}
