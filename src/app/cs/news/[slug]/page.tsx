import type { Metadata } from 'next';
import NewsPostView, { newsPostMeta } from '@/views/NewsPostView';

export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return newsPostMeta('cs', (await params).slug);
}

export default async function Page({ params }: Props) {
  return <NewsPostView lang="cs" slug={(await params).slug} />;
}
