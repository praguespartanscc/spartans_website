// Links for gallery photos stored in Google Drive (safe to use in the browser too).
// Google's image CDN resizes on the fly: "=w800" means 800px wide.
export const photoUrl = (id: string, width: number) => `https://lh3.googleusercontent.com/d/${id}=w${width}`;
export const photoSrcSet = (id: string, widths = [400, 800, 1200, 1600]) => widths.map((w) => `${photoUrl(id, w)} ${w}w`).join(', ');
export const driveFileUrl = (id: string) => `https://drive.google.com/file/d/${id}/view`;

type Pickable = { id: string; name: string };

// Picks photo n from the site photos, wrapping round when the folder has fewer.
export function sitePhoto<T extends Pickable>(list: T[], n: number): T | null {
  return list.length ? list[n % list.length] : null;
}

// URL for a site photo, or undefined when there are none (callers then show plain black).
export function sitePhotoUrl(list: Pickable[], n: number, width = 1920): string | undefined {
  const p = sitePhoto(list, n);
  return p ? photoUrl(p.id, width) : undefined;
}

// A file name worth reading out ("Trophy night"), not a camera name ("IMG_1234").
export function photoCaption(name: string): string | null {
  const clean = name.replace(/^\d+[\s._-]*/, '').replace(/[_-]+/g, ' ').trim();
  if (!/[a-z]{3}/i.test(clean) || /^(img|dsc|dscn|pxl|photo|image|whatsapp image)\b/i.test(clean)) return null;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// Which site photo each spot uses, so neighbouring sections and pages differ.
export const PHOTO_SLOT = {
  quote: 1,
  story: 2,
  story2: 3,
  practice: 4,
  players: 0,
  join: 1,
  about: 2,
  aboutStory: 3,
  aboutStory2: 4,
  fixtures: 3,
  practices: 4,
  ground: 5,
  auth: 0,
  notFound: 5,
} as const;

// Several slots at once, without showing the same photo twice when the folder is small.
export function sitePhotosFor<T extends Pickable>(list: T[], slots: number[]): T[] {
  const out: T[] = [];
  for (const n of slots) {
    const p = sitePhoto(list, n);
    if (p && !out.some((x) => x.id === p.id)) out.push(p);
  }
  return out;
}
