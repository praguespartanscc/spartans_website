import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mergeNames, nearName } from '../names.ts';

const known = ['Thilak', 'Vamshi', 'Arun Konda', 'Kasi Viswanathan', 'Sandeep Kumar Valliveti', 'Varun'];

test('spellings seen in real matches are caught', () => {
  assert.equal(nearName('Tilak', known), 'Thilak');
  assert.equal(nearName('Vamsi', known), 'Vamshi');
  assert.equal(nearName('arun konda', known), 'Arun Konda');
  assert.equal(nearName('Kasi', known), 'Kasi Viswanathan');
});

test('a name that is already known exactly, or is new, raises nothing', () => {
  assert.equal(nearName('Thilak', known), null);
  assert.equal(nearName('Farooq', known), null);
  assert.equal(nearName('Al', known), null);
  // Once "Arun" has been kept, it is known and no longer mistaken for Varun.
  assert.equal(nearName('Arun', [...known, 'Arun']), null);
});

test('remembered names keep one spelling per person, newest first', () => {
  const next = mergeNames(['Thilak', 'Vamshi'], ['thilak', 'Farooq', ' Anil  Kumar ']);
  assert.deepEqual(next, ['Farooq', 'Anil Kumar', 'Thilak', 'Vamshi']);
});

import { seriesLines } from '../format.ts';

test('a day with several matches between the same teams shows the series', () => {
  const m = (id: string, a: string, b: string, ta: number, tb: number, status = 'complete', day = '2026-11-07') => ({
    id, played_on: day, team_a: a, team_b: b, status,
    summary: { result: null, innings: [{ team: a, total: ta, wickets: 0, overs: '7.0' }, { team: b, total: tb, wickets: 0, overs: '7.0' }] },
  });
  const lines = seriesLines([m('1', 'KASI', 'Vicky', 65, 55), m('2', 'Kasi', 'Vicky', 14, 71), m('3', 'Vicky', 'KASI', 58, 44), m('4', 'KASI', 'Vicky', 39, 31), m('5', 'KASI', 'Vicky', 10, 5, 'live'), m('6', 'Spartans', 'PBCC', 125, 60, 'complete', '2026-10-30')]);
  assert.equal(lines['1'], 'KASI 2, Vicky 2');
  assert.equal(lines['5'], 'KASI 2, Vicky 2');
  assert.equal(lines['6'], undefined);
});
