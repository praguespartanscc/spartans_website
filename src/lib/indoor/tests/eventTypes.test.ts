import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// The database only stores event types it knows (a check on indoor_events.type). A new type in
// the app without a migration means those events, and every ball after them, never upload.

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

function appTypes(): string[] {
  const src = read('../engine.ts');
  const block = src.slice(src.indexOf('export type EventData ='), src.indexOf('export type EventType'));
  return [...block.matchAll(/\{ type: '(\w+)'/g)].map((m) => m[1]).sort();
}

function databaseTypes(): string[] {
  const dir = new URL('../../../../supabase/migrations/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
  let list: string[] = [];
  for (const f of files) {
    const sql = readFileSync(new URL(f, dir), 'utf8');
    // The newest migration that states the list wins.
    for (const m of sql.matchAll(/check \(type in \(([^)]+)\)\)/g)) list = [...m[1].matchAll(/'(\w+)'/g)].map((x) => x[1]);
  }
  return list.sort();
}

test('every event the scorer can record is accepted by the database', () => {
  const app = appTypes();
  assert.ok(app.length >= 13, 'event types were read from engine.ts');
  assert.deepEqual(databaseTypes(), app);
});
