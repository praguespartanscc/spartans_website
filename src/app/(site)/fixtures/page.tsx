import FixturesView, { fixturesMeta } from '@/views/FixturesView';

export const revalidate = 60;
export const metadata = fixturesMeta('en');

export default function Page() {
  return <FixturesView lang="en" />;
}
