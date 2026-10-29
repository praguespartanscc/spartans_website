import type { IndoorEvent, MatchSetup, MatchState } from '../engine.ts';
import { replay } from '../engine.ts';
import type { IndoorRules, RulesPatch } from '../rules.ts';
import { applyRulesPatch, cloneRules } from '../rules.ts';
import { LEAGUE_RULES } from '../presets.ts';
import type { BallInput, ExtraKind, WicketInput } from '../scoring.ts';

export function rules(patch: RulesPatch = {}, base: IndoorRules = LEAGUE_RULES): IndoorRules {
  return applyRulesPatch(cloneRules(base), patch);
}

// Two sides of n players: a1..an bat for A, b1..bn for B. A bats first.
export function setup(r: IndoorRules, n = 6, m = n): MatchSetup {
  const side = (p: string, k: number) => Array.from({ length: k }, (_, i) => ({ id: `${p}${i + 1}`, name: `${p.toUpperCase()}${i + 1}` }));
  return { teams: [{ name: 'Team A', players: side('a', n) }, { name: 'Team B', players: side('b', m) }], battingFirst: 0, rules: r };
}

// Builds an event list with rising seq numbers.
export class Log {
  events: IndoorEvent[] = [];
  private n = 0;
  private push(e: Omit<IndoorEvent, 'id' | 'seq'>): this {
    this.n += 1;
    this.events.push({ id: `e${this.n}`, seq: this.n, ...e } as IndoorEvent);
    return this;
  }
  bowl(bowlerId: string) {
    return this.push({ type: 'overStart', data: { bowlerId } } as IndoorEvent);
  }
  ball(b: Partial<BallInput> = {}) {
    return this.push({ type: 'ball', data: { zone: null, runs: 0, extra: null, wicket: null, ...b } } as IndoorEvent);
  }
  run(runs: number, zone: string | null = null) {
    return this.ball({ runs, zone });
  }
  extra(extra: ExtraKind, runs = 0, zone: string | null = null) {
    return this.ball({ extra, runs, zone });
  }
  out(kind: WicketInput['kind'] = 'bowled', extras: Partial<BallInput> = {}, who: WicketInput['who'] = 'striker') {
    return this.ball({ ...extras, wicket: { kind, who, zone: extras.zone ?? null } });
  }
  dots(k: number) {
    for (let i = 0; i < k; i++) this.ball();
    return this;
  }
  // A full over of dots from this bowler.
  over(bowlerId: string, balls = 6) {
    return this.bowl(bowlerId).dots(balls);
  }
  event(e: Omit<IndoorEvent, 'id' | 'seq'>) {
    return this.push(e);
  }
  play(s: MatchSetup): MatchState {
    return replay(s, this.events);
  }
}

export const inn0 = (s: MatchState) => s.innings[0];
export const inn1 = (s: MatchState) => s.innings[1];
