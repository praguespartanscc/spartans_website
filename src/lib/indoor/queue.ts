// Who bats next. Batters who have not batted come first, in batting order. After that the
// batters who left come back in the order they left (first out, first back).

export type BattingQueue = {
  fresh: string[]; // not yet batted, in batting order
  returning: string[]; // left the crease, oldest first
  retiredWaiting: string[]; // retired batters when they do not rejoin the queue (used only if nobody else is left)
  chosen: string | null; // scorer picked the next batter by hand
};

export function newQueue(order: string[]): BattingQueue {
  return { fresh: [...order], returning: [], retiredWaiting: [], chosen: null };
}

const without = (list: string[], id: string) => list.filter((x) => x !== id);

function take(q: BattingQueue, id: string): void {
  q.fresh = without(q.fresh, id);
  q.returning = without(q.returning, id);
  q.retiredWaiting = without(q.retiredWaiting, id);
}

export function depart(q: BattingQueue, id: string, how: 'out' | 'retired', retiredRejoin: boolean): void {
  take(q, id);
  if (how === 'retired' && !retiredRejoin) q.retiredWaiting.push(id);
  else q.returning.push(id);
}

// Next batter in, skipping anyone already at the crease.
export function callNext(q: BattingQueue, atCrease: (string | null)[]): string | null {
  const busy = (id: string) => atCrease.includes(id);
  let id: string | null = null;
  if (q.chosen && !busy(q.chosen)) id = q.chosen;
  id ??= q.fresh.find((x) => !busy(x)) ?? q.returning.find((x) => !busy(x)) ?? q.retiredWaiting.find((x) => !busy(x)) ?? null;
  q.chosen = null;
  if (id) take(q, id);
  return id;
}

export function addLatePlayer(q: BattingQueue, id: string): void {
  if (!q.fresh.includes(id)) q.fresh.push(id);
}

// The line as the scorer sees it.
export function upcoming(q: BattingQueue): string[] {
  const rest = [...q.fresh, ...q.returning, ...q.retiredWaiting];
  return q.chosen ? [q.chosen, ...rest.filter((x) => x !== q.chosen)] : rest;
}
