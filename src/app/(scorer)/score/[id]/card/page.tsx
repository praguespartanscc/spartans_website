import type { Metadata } from 'next';
import ScorerPage from '@/components/indoor/ScorerPage';

export const metadata: Metadata = {
  title: 'Indoor scorecard',
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  return <ScorerPage id={(await params).id} card />;
}
