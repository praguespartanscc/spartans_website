import CommitteeView, { committeeMeta } from '@/views/CommitteeView';

export const revalidate = 60;
export const metadata = committeeMeta('en');

export default function Page() {
  return <CommitteeView lang="en" />;
}
