import 'server-only';
import { cache } from 'react';
import { getSettings } from '@/lib/data';
import { slugify } from '@/lib/format';

// Photo gallery from a public Google Drive folder ("Anyone with the link can view").
// Each sub-folder of the main folder is a section (Gallery, Events, Awards, …), and folders
// inside those are albums. A folder named "Thumbnail" holds cover images: a picture named
// like a section or album (e.g. "Events.jpg") becomes its cover. Drive is read at most
// every 10 minutes; photos themselves are served by Google's image CDN.

const API = 'https://www.googleapis.com/drive/v3/files';
const FOLDER = 'application/vnd.google-apps.folder';
const REFRESH_SECONDS = 600;
const MAX_DEPTH = 4;

export type Photo = { id: string; name: string; width: number | null; height: number | null; added: string };

export type Album = {
  id: string;
  name: string;
  slug: string;
  path: string[]; // slugs from the gallery root, e.g. ['events', 'awards-night-2026']
  cover: Photo | null;
  photos: Photo[];
  albums: Album[];
  total: number; // photos in this album and all albums inside it
  added: string;
};

export type Gallery = { configured: boolean; sections: Album[] };

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  imageMediaMetadata?: { width?: number; height?: number; rotation?: number };
};


// Accepts a folder link or a bare folder id.
export function folderIdFrom(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  return /folders\/([\w-]{10,})/.exec(v)?.[1] ?? (/^[\w-]{10,}$/.test(v) ? v : null);
}

async function listFolder(folderId: string, key: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, createdTime, imageMediaMetadata(width, height, rotation))',
      orderBy: 'name_natural',
      pageSize: '1000',
      key,
    });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await fetch(`${API}?${params}`, { next: { revalidate: REFRESH_SECONDS, tags: ['gallery'] } });
    if (!res.ok) throw new Error(`Drive ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
    files.push(...(json.files ?? []));
    pageToken = json.nextPageToken ?? '';
  } while (pageToken);
  return files;
}

function toPhoto(f: DriveFile): Photo {
  const m = f.imageMediaMetadata;
  const turned = m?.rotation === 1 || m?.rotation === 3;
  return {
    id: f.id,
    name: f.name.replace(/\.[a-z0-9]+$/i, ''),
    width: (turned ? m?.height : m?.width) ?? null,
    height: (turned ? m?.width : m?.height) ?? null,
    added: f.createdTime,
  };
}

const isThumbnailFolder = (name: string) => /^thumbnails?$/i.test(name.trim());

async function readAlbum(f: DriveFile, parentPath: string[], key: string, covers: Map<string, Photo>, depth: number): Promise<Album> {
  const slug = slugify(f.name) || f.id;
  const path = [...parentPath, slug];
  const children = depth < MAX_DEPTH ? await listFolder(f.id, key) : [];
  const photos = children.filter((c) => c.mimeType.startsWith('image/')).map(toPhoto);
  const albums = await Promise.all(
    children.filter((c) => c.mimeType === FOLDER && !isThumbnailFolder(c.name)).map((c) => readAlbum(c, path, key, covers, depth + 1)),
  );
  // Newest albums first.
  albums.sort((a, b) => b.added.localeCompare(a.added));
  const total = photos.length + albums.reduce((n, a) => n + a.total, 0);
  return {
    id: f.id,
    name: f.name.trim(),
    slug,
    path,
    cover: covers.get(slug) ?? photos[0] ?? albums.find((a) => a.cover)?.cover ?? null,
    photos,
    albums,
    total,
    added: f.createdTime,
  };
}

export const getGallery = cache(async (): Promise<Gallery> => {
  const settings = await getSettings();
  const rootId = folderIdFrom(settings.gallery_folder) ?? folderIdFrom(process.env.GALLERY_FOLDER_ID);
  const key = (process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY || '').trim();
  if (!rootId || !key) return { configured: false, sections: [] };

  try {
    const top = await listFolder(rootId, key);
    const covers = new Map<string, Photo>();
    for (const t of top.filter((f) => f.mimeType === FOLDER && isThumbnailFolder(f.name))) {
      for (const img of (await listFolder(t.id, key)).filter((f) => f.mimeType.startsWith('image/'))) {
        covers.set(slugify(img.name.replace(/\.[a-z0-9]+$/i, '')), toPhoto(img));
      }
    }
    const sections = await Promise.all(
      top.filter((f) => f.mimeType === FOLDER && !isThumbnailFolder(f.name)).map((f) => readAlbum(f, [], key, covers, 1)),
    );
    // Photos placed straight in the main folder show as a "More photos" section.
    const loose = top.filter((f) => f.mimeType.startsWith('image/')).map(toPhoto);
    if (loose.length) {
      sections.push({ id: rootId, name: 'More photos', slug: 'more-photos', path: ['more-photos'], cover: loose[0], photos: loose, albums: [], total: loose.length, added: '' });
    }
    return { configured: true, sections: sections.filter((s) => s.total > 0) };
  } catch (err) {
    console.error('Gallery: could not read Google Drive:', err instanceof Error ? err.message : err);
    return { configured: true, sections: [] };
  }
});

export async function findAlbum(path: string[]): Promise<{ album: Album; trail: Album[] } | null> {
  const { sections } = await getGallery();
  let list = sections;
  const trail: Album[] = [];
  for (const slug of path) {
    const next = list.find((a) => a.slug === slug);
    if (!next) return null;
    trail.push(next);
    list = next.albums;
  }
  return trail.length ? { album: trail[trail.length - 1], trail } : null;
}

export function allAlbums(sections: Album[]): Album[] {
  return sections.flatMap((s) => [s, ...allAlbums(s.albums)]);
}

// Most recently added photos across the whole gallery (for the home page).
export async function latestPhotos(n: number): Promise<{ photo: Photo; album: Album }[]> {
  const { sections } = await getGallery();
  return allAlbums(sections)
    .flatMap((album) => album.photos.map((photo) => ({ photo, album })))
    .sort((a, b) => b.photo.added.localeCompare(a.photo.added))
    .slice(0, n);
}
