import type { Metadata } from 'next';
import NewsPostView, { newsPostMeta } from '@/views/NewsPostView';

export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return newsPostMeta('en', (await params).slug);
}

export default async function Page({ params }: Props) {
  return <NewsPostView lang="en" slug={(await params).slug} />;
}
