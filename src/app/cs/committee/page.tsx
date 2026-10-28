import CommitteeView, { committeeMeta } from '@/views/CommitteeView';

export const revalidate = 60;
export const metadata = committeeMeta('cs');

export default function Page() {
  return <CommitteeView lang="cs" />;
}
