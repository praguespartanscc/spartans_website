import type { Metadata } from 'next';
import IndoorTournamentView, { indoorTournamentMeta } from '@/views/IndoorTournamentView';

// Live scores: always rendered fresh.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return indoorTournamentMeta('en', (await params).slug);
}

export default async function Page({ params }: Props) {
  return <IndoorTournamentView lang="en" slug={(await params).slug} />;
}
