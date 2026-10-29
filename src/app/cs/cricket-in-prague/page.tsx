import CricketInPragueView, { cricketInPragueMeta } from '@/views/CricketInPragueView';

export const revalidate = 3600;
export const metadata = cricketInPragueMeta('cs');

export default function Page() {
  return <CricketInPragueView lang="cs" />;
}
