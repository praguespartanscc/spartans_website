import HomeView, { homeMeta } from '@/views/HomeView';

export const revalidate = 60;
export const metadata = homeMeta('en');

export default function Page() {
  return <HomeView lang="en" />;
}
