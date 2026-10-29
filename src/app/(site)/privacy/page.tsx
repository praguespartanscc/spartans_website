import PrivacyView, { privacyMeta } from '@/views/PrivacyView';

export const revalidate = 3600;
export const metadata = privacyMeta('en');

export default function Page() {
  return <PrivacyView lang="en" />;
}
