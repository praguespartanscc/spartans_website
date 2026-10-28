'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { initials } from '@/lib/format';
import { sortByPosition } from '@/components/CommitteeSection';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import JoinCta from '@/components/JoinCta';

type CommitteeMember = {
  id: string;
  name: string;
  position: string;
  created_at?: string;
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  President: "Serves as the figurehead and leads the club's official functions.",
  Chairman: "Chairs committee meetings and oversees the club's direction.",
  Secretary: 'Manages correspondence, keeps records and handles administrative duties.',
  Treasurer: "Manages the club's finances, budget and financial reporting.",
  Manager: 'Oversees team selection, training and cricket operations.',
};

function MemberCard({ member, lead }: { member: CommitteeMember; lead?: boolean }) {
  return (
    <div className={`card card-hover relative h-full overflow-hidden p-6 sm:p-7 ${lead ? 'border-gold/40' : ''}`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${lead ? 'bg-gold' : 'bg-cream/15'}`} />
      <div className="flex items-center gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-xl font-extrabold ${
            lead ? 'bg-gold text-ink' : 'bg-panel-2 text-gold ring-1 ring-cream/10'
          }`}
        >
          {initials(member.name)}
        </span>
        <div className="min-w-0">
          <p className="eyebrow">{member.position}</p>
          <p className="mt-1 font-display text-[24px] font-extrabold uppercase leading-tight">{member.name}</p>
        </div>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        {ROLE_DESCRIPTIONS[member.position] ?? 'Serves on the committee for the club.'}
      </p>
    </div>
  );
}

export default function CommitteePage() {
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommitteeMembers() {
      try {
        setLoading(true);
        // Handle case when Supabase is not configured (development/preview)
        if (!isSupabaseConfigured) {
          setCommitteeMembers([
            { id: '1', name: 'John Smith', position: 'Chairman' },
            { id: '2', name: 'Sarah Johnson', position: 'President' },
            { id: '3', name: 'Mike Davis', position: 'Secretary' },
            { id: '4', name: 'Emma Wilson', position: 'Treasurer' },
            { id: '5', name: 'Robert Lee', position: 'Manager' },
          ]);
          return;
        }
        const { data, error } = await supabase.from('committee').select('*').order('position', { ascending: true });
        if (error) throw error;
        setCommitteeMembers(data || []);
      } catch (error) {
        console.error('Error fetching committee members:', error);
        setError('We could not load the committee right now. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchCommitteeMembers();
  }, []);

  const sorted = sortByPosition(committeeMembers);
  const leads = sorted.filter((m) => m.position === 'President' || m.position === 'Chairman');
  const others = sorted.filter((m) => m.position !== 'President' && m.position !== 'Chairman');

  return (
    <>
      <PageHero
        eyebrow="Run by members"
        title={
          <>
            Club <span className="text-gold">committee</span>
          </>
        }
        intro="The team behind the team. Our committee keeps the club running and makes it the best place it can be for every member."
      />

      <section className="py-14 sm:py-20">
        <div className="container-x">
          {loading ? (
            <SkeletonGrid items={5} height={170} label="Loading committee" />
          ) : error ? (
            <p className="alert-error">{error}</p>
          ) : committeeMembers.length === 0 ? (
            <EmptyState title="Committee coming soon">Committee members will be listed here shortly.</EmptyState>
          ) : (
            <>
              {leads.length > 0 && (
                <div className="mx-auto mb-4 grid max-w-4xl gap-4 md:grid-cols-2">
                  {leads.map((member, i) => (
                    <Reveal key={member.id} delay={i * 90}>
                      <MemberCard member={member} lead />
                    </Reveal>
                  ))}
                </div>
              )}
              {others.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((member, i) => (
                    <Reveal key={member.id} delay={120 + i * 70}>
                      <MemberCard member={member} />
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <JoinCta title="Get involved" text="Want to help shape the club? Members are always welcome to lend a hand, on the field and off it." />
    </>
  );
}
