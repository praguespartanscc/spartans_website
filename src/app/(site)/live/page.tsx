import LiveView, { liveMeta } from '@/views/LiveView';

export const revalidate = 60;
export const metadata = liveMeta('en');

export default function Page() {
  return <LiveView lang="en" />;
}
