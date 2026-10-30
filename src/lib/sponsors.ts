import type { Sponsor } from '@/types/supabase';
import type { Lang } from '@/lib/i18n';

// The sponsor's blurb in the page language (Czech falls back to the English text).
export function sponsorText(s: Sponsor, lang: Lang): string | null {
  return (lang === 'cs' && s.description_cs) || s.description || null;
}
