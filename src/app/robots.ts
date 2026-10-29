import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/club';

// One group for every crawler: search engines and AI search/answer bots are all welcome.
// Sign-in pages are not listed here on purpose: they carry noindex instead, which crawlers
// can only see if they may fetch the page. Named per-bot groups would make that bot ignore
// these rules, so there are none.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/auth/', '/admin', '/dashboard', '/score'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
