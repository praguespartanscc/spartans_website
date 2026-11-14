import { test } from 'node:test';
import assert from 'node:assert/strict';
import { battingFirstOf, flip, tossDetail, tossText, tossWinner } from '../toss.ts';

test('the coin follows the random source', () => {
  assert.equal(flip(() => 0.1), 'heads');
  assert.equal(flip(() => 0.9), 'tails');
});

test('the secure coin gives both faces', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i += 1) seen.add(flip());
  assert.deepEqual([...seen].sort(), ['heads', 'tails']);
});

test('the caller wins when the coin lands on the call', () => {
  assert.equal(tossWinner(0, 'heads', 'heads'), 0);
  assert.equal(tossWinner(0, 'heads', 'tails'), 1);
  assert.equal(tossWinner(1, 'tails', 'tails'), 1);
  assert.equal(tossWinner(1, 'tails', 'heads'), 0);
});

test('who bats first comes from the winner and the choice', () => {
  assert.equal(battingFirstOf({ winner: 0, choice: 'bat' }), 0);
  assert.equal(battingFirstOf({ winner: 0, choice: 'bowl' }), 1);
  assert.equal(battingFirstOf({ winner: 1, choice: 'bat' }), 1);
  assert.equal(battingFirstOf({ winner: 1, choice: 'bowl' }), 0);
});

test('the toss reads as a sentence in both languages', () => {
  const names: [string, string] = ['Falcons', 'Lions'];
  assert.equal(tossText({ winner: 1, choice: 'bowl', method: 'manual' }, names), 'Lions won the toss and chose to bowl.');
  assert.equal(tossText({ winner: 0, choice: 'bat', method: 'manual' }, names, 'cs'), 'Los vyhrál tým Falcons a zvolil pálku.');
  assert.equal(tossDetail({ winner: 1, choice: 'bat', method: 'coin', caller: 0, call: 'heads', face: 'tails' }, names), 'Falcons called heads. It landed tails.');
  assert.equal(tossDetail({ winner: 1, choice: 'bat', method: 'manual' }, names), '');
});
