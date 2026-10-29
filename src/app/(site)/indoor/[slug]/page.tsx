import type { Metadata } from 'next';
import IndoorFollowView, { indoorFollowMeta } from '@/views/IndoorFollowView';

// Live score: always rendered fresh.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return indoorFollowMeta('en', (await params).slug);
}

export default async function Page({ params }: Props) {
  return <IndoorFollowView lang="en" slug={(await params).slug} />;
}
