'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { EventData, IndoorEvent, MatchState } from '@/lib/indoor/engine';
import { replay, sortEvents } from '@/lib/indoor/engine';
import { summaryOf } from '@/lib/indoor/format';
import type { LocalMatch } from '@/lib/indoor/store';
import { loadLocal, mergeEvents, newId, removeLocal, saveLocal } from '@/lib/indoor/store';
import { fetchMatch, push, type PushResult } from '@/lib/indoor/sync';

export type SyncState = 'idle' | 'saving' | 'synced' | 'offline' | 'refused';

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

  const flush = useCallback(async () => {
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
    const res: PushResult = await push(supabase, current).catch((e: unknown) => ({ pending: current.pending, matchPending: current.matchPending, error: String(e) }));
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
    store({ ...latest, pending: stillPending, matchPending, uploaded: latest.uploaded || !res.matchPending });
    if (res.code === 'refused') {
      setSync('refused'); // retrying cannot help: this account may not score the match
    } else if (res.error) {
      setSync('offline');
      if (retry.current) clearTimeout(retry.current);
      retry.current = setTimeout(() => void flush(), 8000);
    } else if (stillPending.length || matchPending) {
      void flush();
    } else {
      setSync('synced');
    }
  }, [supabase, store, forget]);

  useEffect(() => {
    if (!lm) return;
    const t = setTimeout(() => void flush(), 250);
    return () => clearTimeout(t);
  }, [lm, flush]);

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

  return { lm, state, loading, missing, gone, sync, add, remove, undo, restore, restoreMany, restart, deleteMatch, setStatus, flush, pull, handOver };
}
