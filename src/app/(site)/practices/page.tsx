import PracticesView, { practicesMeta } from '@/views/PracticesView';

export const revalidate = 60;
export const metadata = practicesMeta('en');

export default function Page() {
  return <PracticesView lang="en" />;
}
