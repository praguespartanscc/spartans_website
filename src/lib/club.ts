// Fixed club facts shared by pages, structured data and the sitemap.

export const SITE_URL = 'https://praguespartanscc.com';
export const CLUB_NAME = 'Prague Spartans Cricket Club';
export const CLUB_EMAIL = 'praguespartanscc@gmail.com';
export const FOUNDED = 2019;
// The season the squads' divisions and COMPETITIONS describe. Update both together each spring.
export const SEASON = 2026;

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
  streetAddress: 'Bohdanečská 261, Vinoř',
  postalCode: '190 17',
  locality: 'Praha 9',
  city: 'Prague',
  country: 'CZ',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Vino%C5%99+Cricket+Ground+Bohdane%C4%8Dsk%C3%A1+261+Praha',
  wikipedia: 'https://en.wikipedia.org/wiki/Vino%C5%99_Cricket_Ground',
};

export type Venue = { name: string; address: string; mapsUrl: string };

export const VENUES = {
  olsanska: {
    name: 'Tenisové centrum Olšanská',
    address: 'Chelčického 2614/43, Žižkov, 130 00 Praha 3',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tenisov%C3%A9+centrum+Ol%C5%A1ansk%C3%A1+Chel%C4%8Dick%C3%A9ho+43+Praha',
  },
  trebesin: {
    name: 'VŠE sportovní hala Na Třebešíně',
    address: 'Na Třebešíně 3215/1, Strašnice, 130 00 Praha 10',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sportovn%C3%AD+hala+V%C5%A0E+Na+T%C5%99ebe%C5%A1%C3%ADn%C4%9B+3215',
  },
  radotin: {
    name: 'Sportovní hala Radotín',
    address: 'U Starého stadiónu 5, Radotín, 153 00 Praha 16',
    mapsUrl: 'https://maps.app.goo.gl/YR4fdn4nnNac9eRS9',
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
    en: ['Free nets sessions', 'Club cricket equipment: helmets, gloves, pads, elbow and thigh guards, bats and balls', 'Student discounts'],
    cs: ['Tréninky v sítích zdarma', 'Klubové kriketové vybavení: helmy, rukavice, chrániče nohou, loktů a stehen, pálky a míčky', 'Slevy pro studenty'],
  },
  minimumAge: null as number | null,
};

// Season results the club can point to.
export const HONOURS: { year: number; en: string; cs: string }[] = [
  { year: 2026, en: 'ECS Czechia Challenger Division winners', cs: 'Vítězové ECS Czechia Challenger Division' },
  { year: 2026, en: 'ČMKS T10 League winners (Vanguards, final on 3 October 2026)', cs: 'Vítězové ČMKS T10 League (Vanguards, finále 3. října 2026)' },
  { year: 2026, en: 'Division 2 winners (Mobilizers)', cs: 'Vítězové 2. divize (Mobilizers)' },
  { year: 2026, en: 'Division 1: 2nd after the league stage and semi-finalists (Vanguards)', cs: '1. divize: 2. místo po základní části a postup do semifinále (Vanguards)' },
];

export type Squad = {
  name: string;
  slug: string;
  logo: string;
  tagline: string;
  taglineCs: string;
  division: number; // Czech Cricket Union league division
  teamUrl?: string; // official team page on czechcricket.cz (results and stats)
};

// 2026 team pages on the union's site (czechcricket.cz runs on CricHeroes, so the IDs are CricHeroes team IDs).
// Check them at the start of each season: the union sometimes registers squads as new teams.
export const SQUADS: Squad[] = [
  {
    name: 'Vanguards',
    slug: 'vanguards',
    logo: '/brand/vanguards.png',
    tagline: 'Leading from the front in the Czech league.',
    taglineCs: 'Vlajková loď klubu v české lize.',
    division: 1,
    teamUrl: 'https://www.czechcricket.cz/team/12736847/PSCC-Vanguards',
  },
  {
    name: 'Mobilizers',
    slug: 'mobilizers',
    logo: '/brand/mobilizers.png',
    tagline: 'Quick on their feet, hungry for runs.',
    taglineCs: 'Rychlí v běhu, hladoví po runech.',
    division: 2,
    teamUrl: 'https://www.czechcricket.cz/team/12736850/PSCC-Mobilizers',
  },
  {
    name: 'Strikers',
    slug: 'strikers',
    logo: '/brand/strikers.png',
    tagline: 'Built to hit hard and finish strong.',
    taglineCs: 'Tvrdé údery a silný závěr.',
    division: 3,
    teamUrl: 'https://www.czechcricket.cz/team/12736840/PSCC-Strikers',
  },
];

// The union's competitions our squads play, with their official tables and results on czechcricket.cz.
// Tournament IDs change every season.
export const COMPETITIONS: { key: string; year: number; name: { en: string; cs: string }; squads: string[]; url: string }[] = [
  {
    key: 'division1',
    year: 2026,
    name: { en: 'Czech Premier League, Division 1', cs: 'Czech Premier League, 1.\u00a0divize' },
    squads: ['vanguards'],
    url: 'https://www.czechcricket.cz/tournament/1899543/Czech-Premier-League-2026-T20-Division-One',
  },
  {
    key: 'division2',
    year: 2026,
    name: { en: 'Czech Premier League, Division 2', cs: 'Czech Premier League, 2.\u00a0divize' },
    squads: ['mobilizers'],
    url: 'https://www.czechcricket.cz/tournament/1899563/Czech-Premier-League-2026-T20-Division-Two',
  },
  {
    key: 'division3',
    year: 2026,
    name: { en: 'Czech Premier League, Division 3', cs: 'Czech Premier League, 3.\u00a0divize' },
    squads: ['strikers'],
    url: 'https://www.czechcricket.cz/tournament/1899570/Czech-Premier-League-2026-T20-Division-Three',
  },
  {
    key: 't10',
    year: 2026,
    name: { en: 'ČMKS T10 League', cs: 'ČMKS T10 League' },
    squads: ['vanguards'],
    url: 'https://www.czechcricket.cz/tournament/2198281/Czech-Cricket-T10-League',
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
  fielding: { en: 'Fielding practice', cs: 'Trénink hry v poli' },
};

export const ROLE_LABEL: Record<string, { en: string; cs: string }> = {
  captain: { en: 'Captain', cs: 'Kapitán' },
  'vice-captain': { en: 'Vice-captain', cs: 'Zástupce kapitána' },
  player: { en: 'Player', cs: 'Hráč' },
};
