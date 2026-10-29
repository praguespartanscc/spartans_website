import HomeView, { homeMeta } from '@/views/HomeView';

export const revalidate = 60;
export const metadata = homeMeta('cs');

export default function Page() {
  return <HomeView lang="cs" />;
}
