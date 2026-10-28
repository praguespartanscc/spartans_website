// next/image can only resize images from hosts listed in next.config.ts;
// anything else is shown as-is instead of breaking the page.
const OPTIMISED_HOSTS = ['lh3.googleusercontent.com', 'drive.google.com', 'i.ytimg.com'];

export function isOptimisable(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    const host = new URL(src).hostname;
    return host.endsWith('.supabase.co') || OPTIMISED_HOSTS.includes(host);
  } catch {
    return false;
  }
}
