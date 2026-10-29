import SafeguardingView, { safeguardingMeta } from '@/views/SafeguardingView';

export const revalidate = 60;
export const metadata = safeguardingMeta('en');

export default function Page() {
  return <SafeguardingView lang="en" />;
}
