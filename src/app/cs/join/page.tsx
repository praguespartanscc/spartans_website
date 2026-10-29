import JoinView, { joinMeta } from '@/views/JoinView';

export const revalidate = 3600;
export const metadata = joinMeta('cs');

export default function Page() {
  return <JoinView lang="cs" />;
}
