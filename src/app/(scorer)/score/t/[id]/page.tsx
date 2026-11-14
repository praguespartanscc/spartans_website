import type { Metadata } from 'next';
import { TournamentPage } from '@/components/indoor/ScorerPage';

export const metadata: Metadata = {
  title: 'Tournament',
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  return <TournamentPage id={(await params).id} />;
}
