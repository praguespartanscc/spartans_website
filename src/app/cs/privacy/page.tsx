import PrivacyView, { privacyMeta } from '@/views/PrivacyView';

export const revalidate = 3600;
export const metadata = privacyMeta('cs');

export default function Page() {
  return <PrivacyView lang="cs" />;
}
