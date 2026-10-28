// Links for gallery photos stored in Google Drive (safe to use in the browser too).
// Google's image CDN resizes on the fly: "=w800" means 800px wide.
export const photoUrl = (id: string, width: number) => `https://lh3.googleusercontent.com/d/${id}=w${width}`;
export const photoSrcSet = (id: string, widths = [400, 800, 1200, 1600]) => widths.map((w) => `${photoUrl(id, w)} ${w}w`).join(', ');
export const driveFileUrl = (id: string) => `https://drive.google.com/file/d/${id}/view`;
