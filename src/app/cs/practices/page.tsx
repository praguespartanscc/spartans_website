import PracticesView, { practicesMeta } from '@/views/PracticesView';

export const revalidate = 60;
export const metadata = practicesMeta('cs');

export default function Page() {
  return <PracticesView lang="cs" />;
}
