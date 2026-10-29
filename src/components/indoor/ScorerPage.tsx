'use client';

import Link from 'next/link';
import MemberGate from './MemberGate';
import Scorer, { rulesSummary } from './Scorer';
import Scorecard from './Scorecard';
import MatchList from './MatchList';
import ScorerBar from './ScorerBar';
import SetupWizard from './SetupWizard';
import { useScorer } from './useScorer';
import { resultText } from '@/lib/indoor/format';
import { ArrowLeft } from '@/components/ui/Icons';

// Client wrapper so the route files stay server components with metadata.
export default function ScorerPage({ id, card = false }: { id: string; card?: boolean }) {
  return <MemberGate>{(m) => (card ? <Card id={id} /> : <Scorer id={id} member={m} />)}</MemberGate>;
}

export function ScoreHome() {
  return (
    <>
      <ScorerBar />
      <MemberGate>{(m) => <MatchList member={m} />}</MemberGate>
    </>
  );
}

export function NewMatch() {
  return <MemberGate>{() => <SetupWizard />}</MemberGate>;
}

function Card({ id }: { id: string }) {
  const { state, loading, lm } = useScorer(id);
  if (loading && !state) return <div className="skeleton mx-4 mt-8 h-64" role="status" aria-label="Loading" />;
  if (!state || !lm) return <p className="px-4 py-20 text-center text-sand">Match not found.</p>;
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-2">
      <Link href={`/score/${id}`} className="-ml-2 inline-grid h-11 w-11 place-items-center text-muted hover:text-cream" aria-label="Back to the match">
        <ArrowLeft size={22} />
      </Link>
      <p className="eyebrow mt-2">{new Date(`${lm.match.played_on}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <h1 className="h-sub mt-2 text-3xl">
        {state.teams[0].name} v {state.teams[1].name}
      </h1>
      {resultText(state) && <p className="mt-2 text-lg text-gold">{resultText(state)}</p>}
      <div className="mt-8">
        <Scorecard state={state} />
      </div>
      <section className="mt-10 border-t border-cream/12 pt-6">
        <h2 className="eyebrow">Rules: {state.setup.rules.name}</h2>
        <ul className="mt-3 space-y-1 text-sm text-sand">
          {rulesSummary(state.setup.rules).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        {state.rulesLog.length > 0 && (
          <>
            <h3 className="field-label mt-5">Changed during the match</h3>
            <ul className="space-y-1 text-sm text-muted">
              {state.rulesLog.map((r) => (
                <li key={r.eventId}>
                  Innings {r.innings + 1}, after {r.overs} overs: {Object.keys(r.patch).join(', ')}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
