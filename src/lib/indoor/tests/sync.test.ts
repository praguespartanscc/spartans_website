import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { IndoorEvent } from '../engine.ts';
import type { LocalMatch } from '../store.ts';
import { push } from '../sync.ts';
import { rules, setup } from './helpers.ts';

type Call = { table: string; op: 'upsert' | 'update'; ids: string[] };
type Fail = { code?: string; message: string } | null;

// A stand-in for the Supabase client that records what was sent and can refuse things.
function fakeClient(failEvent: (types: string[]) => Fail = () => null, failMatch: () => Fail = () => null, matchExists = true) {
  const calls: Call[] = [];
  const result = (error: Fail, data: unknown[] = [{ id: 'm1' }]) => {
    const r = { data: error ? null : data, error };
    return Object.assign(Promise.resolve(r), { select: () => Promise.resolve(r) });
  };
  const client = {
    from(table: string) {
      return {
        upsert(rows: unknown) {
          const list = (Array.isArray(rows) ? rows : [rows]) as { id: string; type?: string }[];
          calls.push({ table, op: 'upsert', ids: list.map((r) => r.id) });
          return result(table === 'indoor_events' ? failEvent(list.map((r) => r.type ?? '')) : failMatch());
        },
        update() {
          calls.push({ table, op: 'update', ids: ['m1'] });
          return { eq: () => result(failMatch(), matchExists ? [{ id: 'm1' }] : []) };
        },
      };
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

const ev = (n: number, type = 'ball'): IndoorEvent => ({ id: `e${n}`, seq: n, type, data: {} }) as unknown as IndoorEvent;

function local(events: IndoorEvent[], over: Partial<LocalMatch> = {}): LocalMatch {
  return {
    match: { id: 'm1', team_a: 'A', team_b: 'B', setup: setup(rules()), summary: null, status: 'live', share_slug: 'abcdefgh2345', played_on: '2026-11-07' },
    events,
    pending: events.map((e) => e.id),
    matchPending: true,
    uploaded: true,
    ...over,
  };
}

test('balls go up oldest first and the result only after them', async () => {
  const { client, calls } = fakeClient();
  const res = await push(client, local([ev(3), ev(1), ev(2)]));
  assert.deepEqual(calls, [
    { table: 'indoor_events', op: 'upsert', ids: ['e1', 'e2', 'e3'] },
    { table: 'indoor_matches', op: 'update', ids: ['m1'] },
  ]);
  assert.deepEqual([res.pending, res.matchPending, res.error], [[], false, null]);
});

test('a new match gets its row first, then the balls, and no second row write', async () => {
  const { client, calls } = fakeClient();
  const res = await push(client, local([ev(1)], { uploaded: false }));
  assert.deepEqual(calls.map((c) => `${c.table}:${c.op}`), ['indoor_matches:upsert', 'indoor_events:upsert']);
  assert.equal(res.uploaded, true);
  assert.equal(res.matchPending, false);
});

test('with no signal nothing is marked as sent and the result waits', async () => {
  const { client, calls } = fakeClient(() => ({ message: 'TypeError: Failed to fetch' }));
  const res = await push(client, local([ev(1), ev(2)]));
  assert.deepEqual(res.pending, ['e1', 'e2']);
  assert.equal(res.matchPending, true);
  assert.equal(res.code, undefined);
  assert.equal(calls.some((c) => c.table === 'indoor_matches'), false);
});

test('an event the database rejects is set aside and everything else still uploads', async () => {
  const reject = (types: string[]) => (types.includes('replaceBatter') ? { code: '23514', message: 'violates check constraint' } : null);
  const { client, calls } = fakeClient(reject);
  const res = await push(client, local([ev(1), ev(2, 'replaceBatter'), ev(3), ev(4)]));
  assert.deepEqual(res.pending, ['e2']);
  assert.deepEqual(res.rejected, ['e2']);
  assert.equal(res.code, 'rejected');
  // The result still goes up: one bad event must not leave the match "live" for ever.
  assert.equal(res.matchPending, false);
  assert.equal(calls[calls.length - 1].table, 'indoor_matches');
});

test('a rejected event is not resent with every ball, only when asked', async () => {
  const reject = (types: string[]) => (types.includes('replaceBatter') ? { code: '23514', message: 'violates check constraint' } : null);
  const lm = local([ev(1, 'replaceBatter'), ev(2)], { rejected: ['e1'], matchPending: false });
  const quiet = fakeClient(reject);
  const res = await push(quiet.client, lm);
  assert.deepEqual(quiet.calls, [{ table: 'indoor_events', op: 'upsert', ids: ['e2'] }]);
  assert.deepEqual(res.pending, ['e1']);
  assert.equal(res.code, 'rejected');

  // Once the database accepts it (after a fix), a retry clears it.
  const fixed = fakeClient();
  const after = await push(fixed.client, { ...lm, pending: ['e1'] }, { retryRejected: true });
  assert.deepEqual(after.pending, []);
  assert.equal(after.code, undefined);
});

test('a match deleted on the server is reported as gone, not uploaded again', async () => {
  const { client } = fakeClient(() => null, () => null, false);
  const res = await push(client, local([ev(1)]));
  assert.equal(res.code, 'gone');
});

test('an account that may not score is refused', async () => {
  const { client } = fakeClient(() => ({ code: '42501', message: 'new row violates row-level security policy' }));
  const res = await push(client, local([ev(1)]));
  assert.equal(res.code, 'refused');
  assert.deepEqual(res.pending, ['e1']);
});
