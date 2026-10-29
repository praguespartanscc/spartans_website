import NewsView, { newsMeta } from '@/views/NewsView';

export const revalidate = 60;
export const metadata = newsMeta('en');

type Props = { searchParams: Promise<{ category?: string }> };

export default async function Page({ searchParams }: Props) {
  return <NewsView lang="en" category={(await searchParams).category} />;
}
