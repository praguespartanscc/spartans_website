// English is the default language at the normal URLs; Czech lives under /cs with the
// same paths (/fixtures -> /cs/fixtures). Admin, dashboard and sign-in stay English.

export type Lang = 'en' | 'cs';

export const LANGS: Lang[] = ['en', 'cs'];

// For dates and numbers.
export const LOCALE: Record<Lang, string> = { en: 'en-GB', cs: 'cs-CZ' };
// For Open Graph.
export const OG_LOCALE: Record<Lang, string> = { en: 'en_GB', cs: 'cs_CZ' };

export const LANG_NAME: Record<Lang, string> = { en: 'English', cs: 'Čeština' };

// Pick the text for the current language: tr(lang, { en: 'Fixtures', cs: 'Zápasy' }).
export function tr<T>(lang: Lang, text: { en: T; cs: T }): T {
  return text[lang];
}

// The URL of an English path in the given language.
export function localePath(lang: Lang, path: string): string {
  if (lang === 'en' || /^(https?:|mailto:|tel:|#)/.test(path)) return path;
  return path === '/' ? '/cs' : `/cs${path}`;
}

// "/cs/fixtures/3" -> { lang: 'cs', path: '/fixtures/3' }
export function splitLangPath(pathname: string): { lang: Lang; path: string } {
  if (pathname === '/cs' || pathname.startsWith('/cs/')) {
    return { lang: 'cs', path: pathname.slice(3) || '/' };
  }
  return { lang: 'en', path: pathname };
}

// Pages that exist in both languages. Everything else (admin, dashboard, sign-in) is English only.
const BILINGUAL = [
  /^\/$/,
  /^\/(about|join|ground|cricket-in-prague|practices|fixtures|players|committee|sponsors|gallery|live|privacy|safeguarding)(\/.*)?$/,
  /^\/squads\/[^/]+$/,
];

export function hasCzech(path: string): boolean {
  return BILINGUAL.some((re) => re.test(path));
}

// hreflang alternates for metadata: { en, cs, x-default }.
export function languageAlternates(path: string) {
  return { en: path, cs: localePath('cs', path), 'x-default': path };
}
