import type { Metadata } from 'next';
import { getPlayers } from '@/lib/data';
import PlayerView, { playerMeta } from '@/views/PlayerView';

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getPlayers()).map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return playerMeta('en', (await params).slug);
}

export default async function Page({ params }: Props) {
  return <PlayerView lang="en" slug={(await params).slug} />;
}
