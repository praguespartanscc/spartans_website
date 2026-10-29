import LiveView, { liveMeta } from '@/views/LiveView';

export const revalidate = 60;
export const metadata = liveMeta('cs');

export default function Page() {
  return <LiveView lang="cs" />;
}
