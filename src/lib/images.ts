// next/image can only resize images from hosts listed in next.config.ts;
// anything else is shown as-is instead of breaking the page.
const OPTIMISED_HOSTS = ['vdljjrlsyrxbchznmbgi.supabase.co', 'lh3.googleusercontent.com', 'drive.google.com'];

export function isOptimisable(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    return OPTIMISED_HOSTS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}
