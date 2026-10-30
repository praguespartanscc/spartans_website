import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BATTING_STYLES, BOWLING_GROUPS, DOES_NOT_BOWL, isKnownStyle, normaliseStyle, styleLabel } from '../../playerStyles.ts';

test('values already saved on the live site map onto the dropdown options', () => {
  assert.equal(normaliseStyle('Right-Hand Bat'), 'Right-hand bat');
  assert.equal(normaliseStyle('Right Arm medium'), 'Right-arm medium');
});

test('the old admin suggestions and scorecard codes map onto the new names', () => {
  assert.equal(normaliseStyle('Right-arm off-spin'), 'Right-arm off-spin');
  assert.equal(normaliseStyle('Left-arm orthodox'), 'Left-arm orthodox spin');
  assert.equal(normaliseStyle('SLA'), 'Left-arm orthodox spin');
  assert.equal(normaliseStyle('RFM'), 'Right-arm fast-medium');
  assert.equal(normaliseStyle('legbreak googly'), 'Right-arm leg-spin (googly)');
  assert.equal(normaliseStyle('chinaman'), 'Left-arm wrist-spin');
  assert.equal(normaliseStyle('offbreak'), 'Right-arm off-spin');
});

test('unknown text and empty values are left alone', () => {
  assert.equal(normaliseStyle('Underarm lobs'), 'Underarm lobs');
  assert.equal(isKnownStyle('Underarm lobs'), false);
  assert.equal(normaliseStyle(null), '');
  assert.equal(styleLabel('', 'en'), null);
});

test('every option has a Czech label and a unique stored value', () => {
  const all = [...BATTING_STYLES, ...BOWLING_GROUPS.flatMap((g) => g.options), DOES_NOT_BOWL];
  assert.equal(all.length, 16);
  assert.equal(new Set(all.map((o) => o.value)).size, all.length);
  for (const o of all) {
    assert.ok(o.cs.length > 0);
    assert.equal(normaliseStyle(o.value), o.value);
  }
  assert.equal(styleLabel('Right-Hand Bat', 'cs'), 'Pravoruký pálkař');
  assert.equal(styleLabel('Right Arm medium', 'en'), 'Right-arm medium');
});
