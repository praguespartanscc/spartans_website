// Names typed in match setup, remembered on this phone so the same player is spelled the
// same way every week ("Thilak" one Saturday and "Tilak" the next cannot be added up later).

const KEY = 'indoor:names';
const MAX = 300;

const tidy = (name: string) => name.trim().replace(/\s+/g, ' ');
// Letters and digits only, lower case: "Arun  Konda" and "arun konda" are the same person.
export const nameKey = (name: string) => name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function loadNames(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

// Newest first, one spelling per person (the first spelling seen stays).
export function mergeNames(known: string[], added: string[]): string[] {
  const seen = new Map<string, string>();
  for (const n of known) if (nameKey(n) && !seen.has(nameKey(n))) seen.set(nameKey(n), tidy(n));
  const fresh: string[] = [];
  for (const n of added) {
    const k = nameKey(n);
    if (k && !seen.has(k)) {
      seen.set(k, tidy(n));
      fresh.push(tidy(n));
    }
  }
  const old = known.map(tidy).filter((n, i, all) => all.findIndex((x) => nameKey(x) === nameKey(n)) === i);
  return [...fresh, ...old].slice(0, MAX);
}

export function rememberNames(names: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(mergeNames(loadNames(), names)));
  } catch {
    // storage blocked: nothing to remember
  }
}

function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}

// A known name the typed one probably means, or null. An exact match (ignoring case and
// spaces) returns that spelling when it differs. Otherwise: one letter out ("Tilak" for
// "Thilak"), or a short form of a longer known name ("Kasi" for "Kasi Viswanathan").
export function nearName(typed: string, known: string[]): string | null {
  const t = tidy(typed);
  const k = nameKey(t);
  if (k.length < 3) return null;
  const exact = known.find((n) => nameKey(n) === k);
  if (exact) return tidy(exact) === t ? null : tidy(exact);
  let best: string | null = null;
  let bestScore = 9;
  for (const n of known) {
    const full = nameKey(n);
    const first = nameKey(tidy(n).split(' ')[0]);
    let score = 9;
    if (k.length >= 4 && (distance(k, full) === 1 || distance(k, first) === 1)) score = 1;
    else if (full.length > k.length && (first === k || full.startsWith(k))) score = 2;
    if (score < bestScore) {
      best = tidy(n);
      bestScore = score;
    }
  }
  return best;
}
