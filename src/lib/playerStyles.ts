import type { Lang } from './i18n';

// Batting and bowling styles, in the names cricket scorecards use (ESPNcricinfo style).
// One list for the member dashboard, the admin player form and the public player page.
// `value` is what we store, in English. `cs` is the label on the Czech pages.

export type StyleOption = { value: string; cs: string };
export type StyleGroup = { label: string; options: StyleOption[] };

export const BATTING_STYLES: StyleOption[] = [
  { value: 'Right-hand bat', cs: 'Pravoruký pálkař' },
  { value: 'Left-hand bat', cs: 'Levoruký pálkař' },
];

export const BOWLING_GROUPS: StyleGroup[] = [
  {
    label: 'Right-arm pace',
    options: [
      { value: 'Right-arm fast', cs: 'Rychlý nadhoz pravou rukou' },
      { value: 'Right-arm fast-medium', cs: 'Rychlý až středně rychlý nadhoz pravou rukou' },
      { value: 'Right-arm medium-fast', cs: 'Středně rychlý až rychlý nadhoz pravou rukou' },
      { value: 'Right-arm medium', cs: 'Středně rychlý nadhoz pravou rukou' },
    ],
  },
  {
    label: 'Right-arm spin',
    options: [
      { value: 'Right-arm off-spin', cs: 'Off-spin pravou rukou' },
      { value: 'Right-arm leg-spin', cs: 'Leg-spin pravou rukou' },
      { value: 'Right-arm leg-spin (googly)', cs: 'Leg-spin pravou rukou (googly)' },
    ],
  },
  {
    label: 'Left-arm pace',
    options: [
      { value: 'Left-arm fast', cs: 'Rychlý nadhoz levou rukou' },
      { value: 'Left-arm fast-medium', cs: 'Rychlý až středně rychlý nadhoz levou rukou' },
      { value: 'Left-arm medium-fast', cs: 'Středně rychlý až rychlý nadhoz levou rukou' },
      { value: 'Left-arm medium', cs: 'Středně rychlý nadhoz levou rukou' },
    ],
  },
  {
    label: 'Left-arm spin',
    options: [
      { value: 'Left-arm orthodox spin', cs: 'Ortodoxní spin levou rukou' },
      { value: 'Left-arm wrist-spin', cs: 'Zápěstní spin levou rukou' },
    ],
  },
];

export const DOES_NOT_BOWL: StyleOption = { value: 'Does not bowl', cs: 'Nenadhazuje' };

const ALL: StyleOption[] = [...BATTING_STYLES, ...BOWLING_GROUPS.flatMap((g) => g.options), DOES_NOT_BOWL];

// Letters only, lower case: "Right-Hand Bat" and "right hand bat" become "righthandbat".
const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

// Other ways people write the same style (scorecard codes, older names, free typing).
const ALIASES: Record<string, string[]> = {
  'Right-hand bat': ['righthandedbat', 'righthandbatter', 'righthandbatsman', 'righthanded', 'righthand', 'rhb'],
  'Left-hand bat': ['lefthandedbat', 'lefthandbatter', 'lefthandbatsman', 'lefthanded', 'lefthand', 'lhb'],
  'Right-arm fast': ['rf', 'raf', 'rightfast', 'rightarmpace', 'fast'],
  'Right-arm fast-medium': ['rfm', 'rafm', 'rightfastmedium', 'fastmedium'],
  'Right-arm medium-fast': ['rmf', 'ramf', 'rightmediumfast', 'mediumfast', 'rightarmmediumpace'],
  'Right-arm medium': ['rm', 'ram', 'rightmedium', 'medium', 'mediumpace'],
  'Right-arm off-spin': ['ob', 'rob', 'offbreak', 'offspin', 'offspinner', 'rightarmoffbreak', 'rightarmoffspinner', 'rightoffspin'],
  'Right-arm leg-spin': ['lb', 'legbreak', 'legspin', 'legspinner', 'rightarmlegbreak', 'rightarmlegspinner', 'rightlegspin'],
  'Right-arm leg-spin (googly)': ['lbg', 'legbreakgoogly', 'googly', 'rightarmlegbreakgoogly'],
  'Left-arm fast': ['lf', 'laf', 'leftfast', 'leftarmpace'],
  'Left-arm fast-medium': ['lfm', 'lafm', 'leftfastmedium'],
  'Left-arm medium-fast': ['lmf', 'lamf', 'leftmediumfast'],
  'Left-arm medium': ['lm', 'lam', 'leftmedium'],
  'Left-arm orthodox spin': ['sla', 'slowleftarm', 'slowleftarmorthodox', 'leftarmorthodox', 'leftarmspin', 'leftarmfingerspin', 'orthodox'],
  'Left-arm wrist-spin': ['slc', 'slw', 'leftarmwristspin', 'leftarmchinaman', 'slowleftarmchinaman', 'leftarmunorthodox', 'chinaman'],
  'Does not bowl': ['none', 'no', 'na', 'doesntbowl', 'dontbowl', 'nonbowler', 'notabowler', 'nobowling'],
};

const LOOKUP = new Map<string, StyleOption>();
for (const o of ALL) {
  LOOKUP.set(key(o.value), o);
  for (const a of ALIASES[o.value] ?? []) LOOKUP.set(a, o);
}

// The standard name for a stored or typed style, or the text unchanged when we do not know it.
export function normaliseStyle(text: string | null | undefined): string {
  const t = (text ?? '').trim();
  if (!t) return '';
  return LOOKUP.get(key(t))?.value ?? t;
}

// True when the text is one of the options in the lists above (after normalising).
export function isKnownStyle(text: string | null | undefined): boolean {
  return LOOKUP.has(key(text ?? ''));
}

// What the player page shows: the standard name in English, its Czech label on /cs.
export function styleLabel(text: string | null | undefined, lang: Lang): string | null {
  const t = (text ?? '').trim();
  if (!t) return null;
  const o = LOOKUP.get(key(t));
  if (!o) return t;
  return lang === 'cs' ? o.cs : o.value;
}
