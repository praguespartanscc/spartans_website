import NewsView, { newsMeta } from '@/views/NewsView';

export const revalidate = 60;
export const metadata = newsMeta('cs');

type Props = { searchParams: Promise<{ category?: string }> };

export default async function Page({ searchParams }: Props) {
  return <NewsView lang="cs" category={(await searchParams).category} />;
}
