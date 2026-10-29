import { NextResponse } from 'next/server';
import { getSitePhotos } from '@/lib/drive';
import { photoUrl, sitePhoto } from '@/lib/photos';

// Photo n from the Drive "Thumbnails" folder, for client screens that cannot read Drive
// themselves (the sign in pages). Redirects to Google's image CDN at the asked width.
export async function GET(req: Request, { params }: { params: Promise<{ n: string }> }) {
  const n = Math.max(0, Number.parseInt((await params).n, 10) || 0);
  const w = Math.min(2400, Math.max(400, Number.parseInt(new URL(req.url).searchParams.get('w') ?? '', 10) || 1600));
  const photo = sitePhoto(await getSitePhotos(), n);
  if (!photo) return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=600' } });
  return NextResponse.redirect(photoUrl(photo.id, w), {
    status: 302,
    headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=600' },
  });
}
