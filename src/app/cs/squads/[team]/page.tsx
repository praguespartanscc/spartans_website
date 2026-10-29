import type { Metadata } from 'next';
import { SQUADS } from '@/lib/club';
import SquadView, { squadMeta } from '@/views/SquadView';

export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return SQUADS.map((s) => ({ team: s.slug }));
}

type Props = { params: Promise<{ team: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return squadMeta('cs', (await params).team);
}

export default async function Page({ params }: Props) {
  return <SquadView lang="cs" slug={(await params).team} />;
}
