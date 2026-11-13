-- The scorer can record two more kinds of event since migration 15's release: sending in a
-- different batter ("replaceBatter") and a new batting order ("battingOrder"). The list of
-- allowed types on indoor_events never got them, so the database refused those events and
-- every ball scored after one stayed on the phone. Re-runnable.
--
-- src/lib/indoor/tests/eventTypes.test.ts fails if this list and the app's ever differ again.

begin;

alter table public.indoor_events drop constraint if exists indoor_events_type_check;
alter table public.indoor_events
  add constraint indoor_events_type_check
  check (type in ('ball', 'overStart', 'openers', 'swapStrike', 'retire', 'nextBatter', 'replaceBatter', 'battingOrder', 'penalty', 'rulesChange', 'oversChange', 'addPlayer', 'inningsEnd'));

commit;
