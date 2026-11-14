// The toss, done in the app. One captain calls, the coin is flipped once, and the winner picks
// bat or bowl. Everything is kept on the match so anyone can see how it went.

import type { TeamIndex, Toss } from './engine.ts';

export type Face = 'heads' | 'tails';

// A fair coin from the browser's secure random numbers. Tests pass their own source.
function secureBit(): number {
  const b = new Uint8Array(1);
  globalThis.crypto.getRandomValues(b);
  return b[0] & 1;
}

export function flip(rand?: () => number): Face {
  const bit = rand ? (rand() < 0.5 ? 0 : 1) : secureBit();
  return bit === 0 ? 'heads' : 'tails';
}

// The caller wins when the coin lands on what they called.
export function tossWinner(caller: TeamIndex, call: Face, face: Face): TeamIndex {
  return call === face ? caller : caller === 0 ? 1 : 0;
}

export function battingFirstOf(toss: Pick<Toss, 'winner' | 'choice'>): TeamIndex {
  return toss.choice === 'bat' ? toss.winner : toss.winner === 0 ? 1 : 0;
}

// "Falcons won the toss and chose to bat."
export function tossText(toss: Toss, names: [string, string], lang: 'en' | 'cs' = 'en'): string {
  const name = names[toss.winner];
  if (lang === 'cs') return `Los vyhrál tým ${name} a zvolil ${toss.choice === 'bat' ? 'pálku' : 'nadhoz'}.`;
  return `${name} won the toss and chose to ${toss.choice}.`;
}

// "Falcons called heads. It landed tails." Empty for a toss entered by hand.
export function tossDetail(toss: Toss, names: [string, string], lang: 'en' | 'cs' = 'en'): string {
  if (toss.method !== 'coin' || toss.caller == null || !toss.call || !toss.face) return '';
  const face = (f: Face) => (lang === 'cs' ? (f === 'heads' ? 'hlava' : 'orel') : f);
  if (lang === 'cs') return `Tým ${names[toss.caller]} hlásil: ${face(toss.call)}. Padlo: ${face(toss.face)}.`;
  return `${names[toss.caller]} called ${face(toss.call)}. It landed ${face(toss.face)}.`;
}
