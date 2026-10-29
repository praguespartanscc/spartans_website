import {
  ALT_NAMES,
  CLUB_EMAIL,
  CLUB_NAME,
  FOUNDED,
  GOVERNING_BODY,
  GROUND,
  GROUND_ID,
  ORG_ID,
  SAME_AS,
  SITE_URL,
  SQUADS,
  WEBSITE_ID,
  squadId,
} from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';

// schema.org structured data. Every node points at the same club (@id ORG_ID), so search
// engines and AI assistants see one consistent entity: name, ground, squads and profiles.

export const clubRef = { '@id': ORG_ID };

export function clubDescription(lang: Lang) {
  return tr(lang, {
    en: `${CLUB_NAME} is an amateur cricket club in Prague, Czech Republic (Czechia), founded in ${FOUNDED}. Its three squads – Vanguards, Mobilizers and Strikers – play in Divisions 1, 2 and 3 of the Czech Cricket Union leagues, plus ČMKS T10 and ECS Czechia. Home ground: ${GROUND.name}, Prague 9 – Vinoř.`,
    cs: `${CLUB_NAME} je amatérský kriketový klub v Praze, založený v roce ${FOUNDED}. Jeho tři týmy – Vanguards, Mobilizers a Strikers – hrají 1., 2. a 3. divizi soutěží Českomoravského kriketového svazu a klub hraje také ČMKS T10 a ECS Czechia. Domácí hřiště: ${GROUND.localName}, Praha 9 – Vinoř.`,
  });
}

export function groundNode() {
  return {
    '@type': ['Place', 'SportsActivityLocation'],
    '@id': GROUND_ID,
    name: GROUND.name,
    alternateName: [GROUND.pitch, GROUND.localName],
    address: {
      '@type': 'PostalAddress',
      streetAddress: GROUND.streetAddress,
      postalCode: GROUND.postalCode,
      addressLocality: GROUND.locality,
      addressRegion: 'Praha',
      addressCountry: GROUND.country,
    },
    hasMap: GROUND.mapsUrl,
    sameAs: [GROUND.wikipedia],
  };
}

export function squadNode(slug: string) {
  const s = SQUADS.find((x) => x.slug === slug)!;
  return {
    '@type': 'SportsTeam',
    '@id': squadId(s.slug),
    name: `Prague Spartans ${s.name}`,
    alternateName: `Prague Spartans CC ${s.name}`,
    sport: 'Cricket',
    url: `${SITE_URL}/squads/${s.slug}`,
    logo: `${SITE_URL}${s.logo}`,
    parentOrganization: clubRef,
    location: { '@id': GROUND_ID },
    memberOf: { '@type': 'SportsOrganization', name: GOVERNING_BODY.name, url: GOVERNING_BODY.url },
    ...(s.cricheroes ? { sameAs: [s.cricheroes] } : {}),
  };
}

export function clubNode(lang: Lang) {
  return {
    '@type': 'SportsOrganization',
    '@id': ORG_ID,
    name: CLUB_NAME,
    alternateName: ALT_NAMES,
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#logo`,
      url: `${SITE_URL}/brand/spartans-logo-square.png`,
      contentUrl: `${SITE_URL}/brand/spartans-logo-square.png`,
      width: 512,
      height: 512,
      caption: `${CLUB_NAME} crest`,
    },
    image: `${SITE_URL}/og/prague-spartans-cricket-club.jpg`,
    description: clubDescription(lang),
    sport: 'Cricket',
    foundingDate: String(FOUNDED),
    email: CLUB_EMAIL,
    address: { '@type': 'PostalAddress', addressLocality: 'Prague', addressCountry: 'CZ' },
    location: { '@id': GROUND_ID },
    areaServed: { '@type': 'City', name: 'Prague' },
    memberOf: { '@type': 'SportsOrganization', name: GOVERNING_BODY.name, alternateName: GOVERNING_BODY.localName, url: GOVERNING_BODY.url },
    subOrganization: SQUADS.map((s) => ({ '@id': squadId(s.slug) })),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'new members',
      email: CLUB_EMAIL,
      url: `${SITE_URL}/join`,
      availableLanguage: ['English', 'Czech'],
    },
    sameAs: SAME_AS,
  };
}

// Full graph for the home page (English and Czech).
export function homeGraph(lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: `${SITE_URL}/`,
        name: CLUB_NAME,
        alternateName: ALT_NAMES,
        inLanguage: ['en', 'cs'],
        publisher: clubRef,
      },
      clubNode(lang),
      groundNode(),
      ...SQUADS.map((s) => squadNode(s.slug)),
    ],
  };
}

// BreadcrumbList from [label, englishPath] pairs, e.g. [['Squads', '/players'], ['Vanguards', '/squads/vanguards']].
export function breadcrumbs(lang: Lang, items: [string, string][]) {
  const all: [string, string][] = [[tr(lang, { en: 'Home', cs: 'Úvod' }), '/'], ...items];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE_URL}${localePath(lang, path) === '/' ? '' : localePath(lang, path)}`,
    })),
  };
}
