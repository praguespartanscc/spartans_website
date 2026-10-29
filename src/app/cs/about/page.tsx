import AboutView, { aboutMeta } from '@/views/AboutView';

export const revalidate = 3600;
export const metadata = aboutMeta('cs');

export default function Page() {
  return <AboutView lang="cs" />;
}
