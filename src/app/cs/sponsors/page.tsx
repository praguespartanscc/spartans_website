import SponsorsView, { sponsorsMeta } from '@/views/SponsorsView';

export const revalidate = 60;
export const metadata = sponsorsMeta('cs');

export default function Page() {
  return <SponsorsView lang="cs" />;
}
