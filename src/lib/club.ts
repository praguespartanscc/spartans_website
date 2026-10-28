// Fixed club facts shared by pages, structured data and the sitemap.

export const SITE_URL = 'https://praguespartanscc.com';
export const CLUB_NAME = 'Prague Spartans Cricket Club';
export const CLUB_EMAIL = 'praguespartanscc@gmail.com';
export const FOUNDED = 2019;

export const SOCIAL = {
  instagram: 'https://www.instagram.com/praguespartanscc_/',
  facebook: 'https://www.facebook.com/praguespartans',
};

export type Squad = {
  name: string;
  slug: string;
  logo: string;
  tagline: string;
  cricheroes?: string;
};

// CricHeroes team links found publicly; the club should confirm them (and add Strikers).
export const SQUADS: Squad[] = [
  {
    name: 'Vanguards',
    slug: 'vanguards',
    logo: '/brand/vanguards.png',
    tagline: 'Leading from the front in the Czech league.',
    cricheroes: 'https://cricheroes.com/team-profile/4182668/spartans-cc-vanguards/matches',
  },
  {
    name: 'Mobilizers',
    slug: 'mobilizers',
    logo: '/brand/mobilizers.png',
    tagline: 'Quick on their feet, hungry for runs.',
    cricheroes: 'https://cricheroes.com/team-profile/1230716/prague-spartans-cc-mobilizers/matches',
  },
  {
    name: 'Strikers',
    slug: 'strikers',
    logo: '/brand/strikers.png',
    tagline: 'Built to hit hard and finish strong.',
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
