import SponsorsView, { sponsorsMeta } from '@/views/SponsorsView';

export const revalidate = 60;
export const metadata = sponsorsMeta('en');

export default function Page() {
  return <SponsorsView lang="en" />;
}
