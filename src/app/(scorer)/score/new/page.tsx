import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { NewMatch } from '@/components/indoor/ScorerPage';

export const metadata: Metadata = {
  title: 'New indoor match',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', borderRadius: 0 } }} />
      <NewMatch />
    </>
  );
}
