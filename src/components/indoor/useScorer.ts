'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { EventData, IndoorEvent, MatchState } from '@/lib/indoor/engine';
import { replay, sortEvents } from '@/lib/indoor/engine';
import { summaryOf } from '@/lib/indoor/format';
import type { LocalMatch } from '@/lib/indoor/store';
import { loadLocal, mergeEvents, newId, removeLocal, saveLocal } from '@/lib/indoor/store';
import { fetchMatch, push, type PushResult } from '@/lib/indoor/sync';

// rejected: the database would not take an event (it stays on the phone, the rest uploads).
export type SyncState = 'idle' | 'saving' | 'synced' | 'offline' | 'refused' | 'rejected';

// Where the next event goes: at the end, in place of an old one, or just before one.
export type Placement = { mode: 'append' } | { mode: 'replace'; id: string } | { mode: 'before'; id: string };

function withSummary(lm: LocalMatch, state: MatchState): LocalMatch {
  const status = state.status === 'complete' ? 'complete' : lm.match.status === 'abandoned' ? 'abandoned' : 'live';
  return { ...lm, match: { ...lm.match, summary: summaryOf(state), status }, matchPending: true };
}

export function useScorer(id: string) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [lm, setLm] = useState<LocalMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [sync, setSync] = useState<SyncState>('idle');
  const [gone, setGone] = useState(false); // an admin deleted the match
  const ref = useRef<LocalMatch | null>(null);
  const pushing = useRef(false);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);

  const store = useCallback((next: LocalMatch) => {
    ref.current = next;
    saveLocal(next);
    setLm(next);
  }, []);

  // The match was deleted on the server: drop this phone's copy so it never comes back.
  const forget = useCallback(() => {
    removeLocal(id);
    ref.current = null;
    setLm(null);
    setGone(true);
  }, [id]);

  // Server copy merged with the phone copy (anything not uploaded yet wins).
  const pull = useCallback(async (): Promise<boolean> => {
    const remote = await fetchMatch(supabase, id);
    const current = ref.current;
    if (!remote) {
      if (current?.uploaded) forget();
      return false;
    }
    store({
      match: current?.matchPending ? { ...remote.match, ...current.match } : remote.match,
      events: mergeEvents(current, remote.events),
      pending: current?.pending ?? [],
      matchPending: current?.matchPending ?? false,
      uploaded: true,
      rejected: current?.rejected ?? [],
    });
    return true;
  }, [id, supabase, store, forget]);

  // Phone copy first (instant, works offline), then the server copy.
  useEffect(() => {
    let cancelled = false;
    const local = loadLocal(id);
    if (local) {
      ref.current = local;
      setLm(local);
      setLoading(false);
    }
    pull()
      .then((found) => {
        if (!cancelled && !found && !ref.current) setMissing(true);
      })
      .catch(() => {
        if (!cancelled && !ref.current) setMissing(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, pull]);

  // retryRejected: also resend events the database refused earlier (on open and now and then).
  const flush = useCallback(async (retryRejected = false) => {
    const current = ref.current;
    if (!current || pushing.current) return;
    if (current.pending.length === 0 && !current.matchPending) {
      setSync('synced');
      return;
    }
    pushing.current = true;
    setSync('saving');
    // Remember what was sent, so an event changed again while uploading stays pending.
    const sent = new Map(current.events.filter((e) => current.pending.includes(e.id)).map((e) => [e.id, JSON.stringify(e)]));
    const sentMatch = JSON.stringify(current.match);
    const res: PushResult = await push(supabase, current, { retryRejected }).catch((e: unknown) => ({ pending: current.pending, matchPending: current.matchPending, error: String(e) }));
    pushing.current = false;
    if (res.code === 'gone') return forget();
    const latest = ref.current;
    if (!latest) return;
    const stillPending = latest.pending.filter((eid) => {
      if (!res.pending.includes(eid) && sent.has(eid)) {
        const now = latest.events.find((e) => e.id === eid);
        return JSON.stringify(now) !== sent.get(eid);
      }
      return true;
    });
    const matchPending = latest.matchPending && (res.matchPending || JSON.stringify(latest.match) !== sentMatch);
    const uploaded = latest.uploaded === true || res.uploaded === true || !res.matchPending;
    const rejected = (res.rejected ?? latest.rejected ?? []).filter((eid) => stillPending.includes(eid));
    // Saving re-runs the upload effect, so only save when something moved. Otherwise a phone
    // with no signal (or a rejected event) would retry several times a second.
    const moved =
      stillPending.length !== latest.pending.length || matchPending !== latest.matchPending || uploaded !== (latest.uploaded === true) || rejected.length !== (latest.rejected?.length ?? 0);
    if (moved) store({ ...latest, pending: stillPending, matchPending, uploaded, rejected });
    const again = (ms: number, withRejected: boolean) => {
      if (retry.current) clearTimeout(retry.current);
      retry.current = setTimeout(() => void flush(withRejected), ms);
    };
    const waitingToSend = stillPending.some((eid) => !rejected.includes(eid));
    if (res.code === 'refused') {
      setSync('refused'); // retrying cannot help: this account may not score the match
    } else if (res.error && res.code !== 'rejected') {
      setSync('offline');
      again(8000, false);
    } else if (waitingToSend || (matchPending && !res.matchPending)) {
      void flush(); // more was scored while this upload was in the air
    } else if (rejected.length) {
      // The database will not store these. A fix on the server clears it, so try now and then.
      setSync('rejected');
      again(30000, true);
    } else if (matchPending) {
      setSync('offline');
      again(8000, false);
    } else {
      setSync('synced');
    }
  }, [supabase, store, forget]);

  // On opening a match, give rejected events another go straight away.
  const opened = useRef(false);
  useEffect(() => {
    if (!lm) return;
    // The first upload that really runs retries rejected events (the server copy arriving
    // re-runs this effect, so the flag is only set when the timer fires).
    const t = setTimeout(() => {
      const first = !opened.current;
      opened.current = true;
      void flush(first);
    }, 250);
    return () => clearTimeout(t);
  }, [lm, flush]);

  // Balls that have waited two minutes to upload deserve more than a small dot.
  const waiting = (lm?.pending.length ?? 0) > 0 || lm?.matchPending === true;
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (!waiting) return setStale(false);
    const t = setTimeout(() => setStale(true), 120000);
    return () => clearTimeout(t);
  }, [waiting]);

  useEffect(() => {
    const online = () => void flush();
    window.addEventListener('online', online);
    return () => {
      window.removeEventListener('online', online);
      if (retry.current) clearTimeout(retry.current);
    };
  }, [flush]);

  const state = useMemo(() => (lm ? replay(lm.match.setup, lm.events) : null), [lm]);

  const change = useCallback(
    (events: IndoorEvent[], touched: string[]) => {
      const current = ref.current;
      if (!current) return;
      const next: LocalMatch = { ...current, events, pending: [...new Set([...current.pending, ...touched])] };
      store(withSummary(next, replay(next.match.setup, next.events)));
    },
    [store],
  );

  const add = useCallback(
    (data: EventData | EventData[], place: Placement = { mode: 'append' }): string[] => {
      const current = ref.current;
      if (!current) return [];
      const list = Array.isArray(data) ? data : [data];
      const live = sortEvents(current.events);
      let events = [...current.events];
      const touched: string[] = [];
      if (place.mode === 'replace') {
        const old = events.find((e) => e.id === place.id);
        if (!old) return [];
        events = events.map((e) => (e.id === place.id ? ({ ...e, ...list[0] } as IndoorEvent) : e));
        touched.push(place.id);
      } else {
        let lo: number;
        let hi: number;
        if (place.mode === 'before') {
          const i = live.findIndex((e) => e.id === place.id);
          if (i < 0) return [];
          hi = live[i].seq;
          lo = i > 0 ? live[i - 1].seq : hi - 1;
        } else {
          lo = current.events.reduce((m, e) => Math.max(m, e.seq), 0);
          hi = lo + list.length + 1;
        }
        list.forEach((d, k) => {
          const seq = lo + ((hi - lo) * (k + 1)) / (list.length + 1);
          const ev = { id: newId(), seq: place.mode === 'append' ? lo + k + 1 : seq, ...d } as IndoorEvent;
          events.push(ev);
          touched.push(ev.id);
        });
      }
      change(events, touched);
      return touched;
    },
    [change],
  );

  const setDeleted = useCallback(
    (ids: string[], deleted: boolean) => {
      const current = ref.current;
      if (!current || ids.length === 0) return;
      const set = new Set(ids);
      change(
        current.events.map((e) => (set.has(e.id) ? { ...e, deleted } : e)),
        ids,
      );
    },
    [change],
  );
  const remove = useCallback((eventId: string) => setDeleted([eventId], true), [setDeleted]);
  const restore = useCallback((eventId: string) => setDeleted([eventId], false), [setDeleted]);
  const restoreMany = useCallback((ids: string[]) => setDeleted(ids, false), [setDeleted]);

  // Takes back the latest thing recorded, whatever it was.
  const undo = useCallback((): IndoorEvent | null => {
    const current = ref.current;
    if (!current) return null;
    const live = sortEvents(current.events);
    const last = live[live.length - 1];
    if (!last) return null;
    remove(last.id);
    return last;
  }, [remove]);

  // Back to the first ball with the same teams and rules. Every event is kept (marked
  // deleted), so the restart itself can be undone. Returns the ids it cleared.
  const restart = useCallback((): string[] => {
    const current = ref.current;
    if (!current) return [];
    const ids = current.events.filter((e) => !e.deleted).map((e) => e.id);
    setDeleted(ids, true);
    return ids;
  }, [setDeleted]);

  // Admins only (the database refuses anyone else). Removes the phone copy too.
  const deleteMatch = useCallback(async (): Promise<string | null> => {
    const current = ref.current;
    if (current?.uploaded || !current) {
      const { data, error } = await supabase.from('indoor_matches').delete().eq('id', id).select('id');
      if (error) return error.message;
      if (!data?.length) return 'Only an admin can delete a match.';
    }
    removeLocal(id);
    ref.current = null;
    setLm(null);
    return null;
  }, [id, supabase]);

  const setStatus = useCallback(
    (status: 'live' | 'complete' | 'abandoned') => {
      const current = ref.current;
      if (!current) return;
      store({ ...current, match: { ...current.match, status }, matchPending: true });
    },
    [store],
  );

  // Gives scoring to another member. Returns an error message, or null when done.
  const handOver = useCallback(
    async (userId: string): Promise<string | null> => {
      await flush();
      const current = ref.current;
      if (!current) return 'The match is not loaded.';
      if (current.matchPending) return 'The match has not uploaded yet. Try again when the phone has a connection.';
      const { data, error } = await supabase.from('indoor_matches').update({ scorer_id: userId }).eq('id', id).select('id');
      if (error) return error.message;
      if (!data?.length) return 'Only the scorer, the member who started the match or an admin can hand it over.';
      const latest = ref.current!;
      store({ ...latest, match: { ...latest.match, scorer_id: userId } });
      return null;
    },
    [flush, id, store, supabase],
  );

  return { lm, state, loading, missing, gone, sync, stale, add, remove, undo, restore, restoreMany, restart, deleteMatch, setStatus, flush, pull, handOver };
}
