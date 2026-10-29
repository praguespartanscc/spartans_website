import GroundView, { groundMeta } from '@/views/GroundView';

export const revalidate = 3600;
export const metadata = groundMeta('cs');

export default function Page() {
  return <GroundView lang="cs" />;
}
