import GalleryView, { galleryMeta } from '@/views/GalleryView';

export const revalidate = 600;

export function generateMetadata() {
  return galleryMeta('cs');
}

export default function Page() {
  return <GalleryView lang="cs" />;
}
