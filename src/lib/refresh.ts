// Asks the server to publish admin changes to the public pages straight away. Failures are
// silent: the pages refresh on their own within a minute anyway.
export function refreshSite(): void {
  if (typeof window === 'undefined') return;
  void fetch('/api/revalidate', { method: 'POST' }).catch(() => {});
}
