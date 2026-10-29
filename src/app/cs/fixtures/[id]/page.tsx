import type { Metadata } from 'next';
import { getMatches } from '@/lib/data';
import FixtureView, { fixtureMeta } from '@/views/FixtureView';

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getMatches()).map((m) => ({ id: String(m.id) }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return fixtureMeta('cs', (await params).id);
}

export default async function Page({ params }: Props) {
  return <FixtureView lang="cs" id={(await params).id} />;
}
