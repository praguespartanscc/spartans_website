import { LOCALE, type Lang } from '@/lib/i18n';

// Parse "YYYY-MM-DD" as a local date so the day never shifts across time zones.
export function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(value);
}

export function dateParts(value: string, lang: Lang = 'en') {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) {
    return { day: '--', month: '', weekday: '', long: value, year: '' };
  }
  const locale = LOCALE[lang];
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleDateString(locale, { month: 'short' }),
    weekday: date.toLocaleDateString(locale, { weekday: 'short' }),
    year: String(date.getFullYear()),
    long: date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

// Database values like "division2" read as "Division 2" (Czech: "2. divize").
export function formatDivision(value?: string | null, lang: Lang = 'en'): string {
  if (!value) return '';
  const match = /division\s*(\d+)/i.exec(value);
  if (!match) return value;
  return lang === 'cs' ? `${match[1]}. divize` : `Division ${match[1]}`;
}

export function titleCase(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Trim seconds from "18:00:00".
export function formatTime(value?: string | null): string {
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : value;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

// "Aarav Shah" -> "aarav-shah" (accents dropped) for readable URLs.
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// YouTube video id from watch, youtu.be, /live/, /shorts/ or /embed/ links.
export function youTubeId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v');
      if (v) return v;
      const m = /^\/(?:live|embed|shorts)\/([\w-]{6,})/.exec(u.pathname);
      return m ? m[1] : null;
    }
  } catch {
    // not a URL
  }
  return null;
}
