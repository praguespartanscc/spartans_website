import GroundView, { groundMeta } from '@/views/GroundView';

export const revalidate = 3600;
export const metadata = groundMeta('en');

export default function Page() {
  return <GroundView lang="en" />;
}
