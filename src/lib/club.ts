// Fixed club facts shared by pages, structured data and the sitemap.

export const SITE_URL = 'https://praguespartanscc.com';
export const CLUB_NAME = 'Prague Spartans Cricket Club';
export const CLUB_EMAIL = 'praguespartanscc@gmail.com';
export const FOUNDED = 2019;

export const ALT_NAMES = ['Prague Spartans CC', 'Prague Spartans', 'PSCC'];

// Stable identifiers for structured data, so every page refers to the same club.
export const ORG_ID = `${SITE_URL}/#club`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const GROUND_ID = `${SITE_URL}/ground#place`;
export const squadId = (slug: string) => `${SITE_URL}/squads/${slug}#team`;

export const SOCIAL = {
  instagram: 'https://www.instagram.com/praguespartanscc_/',
  facebook: 'https://www.facebook.com/praguespartans',
  youtube: 'https://www.youtube.com/@spartanscricketclub6793',
  playCricket: 'https://praguespartans.play-cricket.com',
};

// Profiles that are the club itself (squad CricHeroes pages belong on each squad, not here).
export const SAME_AS = [SOCIAL.instagram, SOCIAL.facebook, SOCIAL.youtube, SOCIAL.playCricket];

export const GOVERNING_BODY = {
  name: 'Czech Cricket Union',
  localName: 'Českomoravský kriketový svaz (ČMKS)',
  url: 'https://czechcricket.cz/',
};

export const GROUND = {
  name: 'Vinoř Cricket Ground',
  pitch: 'Scott Page Field',
  localName: 'Kriketové hřiště Vinoř',
  streetAddress: 'Bohdanečská 261',
  postalCode: '190 17',
  locality: 'Praha 9 – Vinoř',
  city: 'Prague',
  country: 'CZ',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Vino%C5%99+Cricket+Ground+Bohdane%C4%8Dsk%C3%A1+261+Praha',
  wikipedia: 'https://en.wikipedia.org/wiki/Vino%C5%99_Cricket_Ground',
};

export type Venue = { name: string; address: string; mapsUrl: string };

export const VENUES = {
  olsanska: {
    name: 'Tenisové centrum Olšanská',
    address: 'Chelčického 2614/43, 130 00 Praha 3 – Žižkov',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tenisov%C3%A9+centrum+Ol%C5%A1ansk%C3%A1+Chel%C4%8Dick%C3%A9ho+43+Praha',
  },
  trebesin: {
    name: 'VŠE sportovní hala Na Třebešíně',
    address: 'Na Třebešíně 3215/1, 130 00 Praha 10 – Strašnice',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sportovn%C3%AD+hala+V%C5%A0E+Na+T%C5%99ebe%C5%A1%C3%ADn%C4%9B+3215',
  },
  radotin: {
    name: 'Sportovní hala Radotín',
    address: 'Praha 16 – Radotín',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sportovn%C3%AD+hala+Radot%C3%ADn',
  },
} satisfies Record<string, Venue>;

// Weekly training (season: outdoor months; winter: indoor sessions).
export const TRAINING = {
  weekly: { day: { en: 'Thursday', cs: 'čtvrtek' }, time: '17:00–19:00', venue: VENUES.olsanska },
  winter: [VENUES.trebesin, VENUES.radotin, VENUES.olsanska],
};

// What membership includes. The club does not publish a fee.
export const MEMBERSHIP = {
  includes: {
    en: ['Free nets sessions', 'Club kit', 'Student discounts'],
    cs: ['Tréninky v sítích zdarma', 'Klubový dres', 'Slevy pro studenty'],
  },
  minimumAge: null as number | null,
};

// Season results the club can point to.
export const HONOURS: { year: number; en: string; cs: string }[] = [
  { year: 2026, en: 'ECS Czechia – Challenger Division winners', cs: 'ECS Czechia – vítězové Challenger Division' },
  { year: 2026, en: 'ČMKS T10 winners', cs: 'Vítězové ČMKS T10' },
  { year: 2026, en: 'Division 2 winners (Mobilizers)', cs: 'Vítězové 2. divize (Mobilizers)' },
  { year: 2026, en: 'Division 1: 2nd after the league stage and semi-finalists (Vanguards)', cs: '1. divize: 2. místo po základní části a semifinále (Vanguards)' },
];

export type Squad = {
  name: string;
  slug: string;
  logo: string;
  tagline: string;
  taglineCs: string;
  division: number; // Czech Cricket Union league division
  cricheroes?: string;
};

// CricHeroes team links found publicly; the club should confirm them (and add Strikers).
export const SQUADS: Squad[] = [
  {
    name: 'Vanguards',
    slug: 'vanguards',
    logo: '/brand/vanguards.png',
    tagline: 'Leading from the front in the Czech league.',
    taglineCs: 'V čele klubu v české lize.',
    division: 1,
    cricheroes: 'https://cricheroes.com/team-profile/4182668/spartans-cc-vanguards/matches',
  },
  {
    name: 'Mobilizers',
    slug: 'mobilizers',
    logo: '/brand/mobilizers.png',
    tagline: 'Quick on their feet, hungry for runs.',
    taglineCs: 'Rychlí v běhu, hladoví po runech.',
    division: 2,
    cricheroes: 'https://cricheroes.com/team-profile/1230716/prague-spartans-cc-mobilizers/matches',
  },
  {
    name: 'Strikers',
    slug: 'strikers',
    logo: '/brand/strikers.png',
    tagline: 'Built to hit hard and finish strong.',
    taglineCs: 'Silný úder a silný závěr.',
    division: 3,
  },
];

export function squadBySlug(slug: string) {
  return SQUADS.find((s) => s.slug === slug) ?? null;
}

export function squadByName(name?: string | null) {
  return SQUADS.find((s) => s.name.toLowerCase() === (name ?? '').toLowerCase()) ?? null;
}

// Order players are grouped in on squad pages, like an IPL squad list.
export const PLAYER_GROUPS = [
  { key: 'batsman', label: 'Batters' },
  { key: 'allrounder', label: 'All-rounders' },
  { key: 'wicketkeeper', label: 'Wicketkeepers' },
  { key: 'bowler', label: 'Bowlers' },
] as const;

export const PLAYER_TYPE_LABEL: Record<string, string> = {
  batsman: 'Batter',
  bowler: 'Bowler',
  allrounder: 'All-rounder',
  wicketkeeper: 'Wicketkeeper',
};

export const POSITION_ORDER = ['President', 'Chairman', 'Secretary', 'Treasurer', 'Manager'];

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  President: "Serves as the figurehead and leads the club's official functions.",
  Chairman: "Chairs committee meetings and oversees the club's direction.",
  Secretary: 'Manages correspondence, keeps records and handles administrative duties.',
  Treasurer: "Manages the club's finances, budget and financial reporting.",
  Manager: 'Oversees team selection, training and cricket operations.',
};

// Czech cricket terms used across the Czech pages.
export const PLAYER_TYPE_LABEL_CS: Record<string, string> = {
  batsman: 'Pálkař',
  bowler: 'Nadhazovač',
  allrounder: 'Všestranný hráč',
  wicketkeeper: 'Brankář',
};

export const PLAYER_GROUPS_CS: Record<string, string> = {
  batsman: 'Pálkaři',
  allrounder: 'Všestranní hráči',
  wicketkeeper: 'Brankáři',
  bowler: 'Nadhazovači',
};

export const MATCH_TYPE_LABEL: Record<string, { en: string; cs: string }> = {
  league: { en: 'League', cs: 'Liga' },
  friendly: { en: 'Friendly', cs: 'Přátelský zápas' },
  tournament: { en: 'Tournament', cs: 'Turnaj' },
};

export const PRACTICE_TYPE_LABEL: Record<string, { en: string; cs: string }> = {
  regular: { en: 'Regular practice', cs: 'Běžný trénink' },
  batting: { en: 'Batting practice', cs: 'Trénink pálkování' },
  bowling: { en: 'Bowling practice', cs: 'Trénink nadhazování' },
  fielding: { en: 'Fielding practice', cs: 'Trénink v poli' },
};

export const ROLE_LABEL: Record<string, { en: string; cs: string }> = {
  captain: { en: 'Captain', cs: 'Kapitán' },
  'vice-captain': { en: 'Vice-captain', cs: 'Zástupce kapitána' },
  player: { en: 'Player', cs: 'Hráč' },
};
