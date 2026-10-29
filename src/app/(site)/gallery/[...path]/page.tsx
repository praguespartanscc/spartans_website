import type { Metadata } from 'next';
import { allAlbums, getGallery } from '@/lib/drive';
import AlbumView, { albumMeta } from '@/views/AlbumView';

export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ path: string[] }> };

// Pre-build every album; albums added later are built on their first visit.
export async function generateStaticParams() {
  const { sections } = await getGallery();
  return allAlbums(sections).map((a) => ({ path: a.path }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return albumMeta('en', (await params).path);
}

export default async function Page({ params }: Props) {
  return <AlbumView lang="en" path={(await params).path} />;
}
