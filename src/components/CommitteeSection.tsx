'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { initials } from '@/lib/format';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { ArrowRight } from '@/components/ui/Icons';

type CommitteeMember = {
  id: string;
  name: string;
  position: string;
};

export const POSITION_ORDER = ['President', 'Chairman', 'Secretary', 'Treasurer', 'Manager'];

export function sortByPosition<T extends { position: string }>(members: T[]): T[] {
  const rank = (p: string) => {
    const i = POSITION_ORDER.indexOf(p);
    return i === -1 ? POSITION_ORDER.length : i;
  };
  return [...members].sort((a, b) => rank(a.position) - rank(b.position));
}

export default function CommitteeSection() {
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }
    fetchCommitteeMembers();
  }, []);

  if (!loading && committeeMembers.length === 0) return null;

  return (
    <section className="py-20 sm:py-28" aria-labelledby="committee-heading">
      <div className="container-x">
        <SectionHeading
          id="committee-heading"
          eyebrow="Run by members"
          title="The committee"
          intro="The people who keep the club running, from fixtures to finances."
          action={
            <Link href="/committee" className="link-arrow">
              Meet the committee <ArrowRight size={18} />
            </Link>
          }
        />
        {loading ? (
          <SkeletonGrid items={3} height={96} label="Loading committee" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortByPosition(committeeMembers).map((member, i) => (
              <Reveal key={member.id} delay={i * 60}>
                <div className="card card-hover flex items-center gap-4 p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold font-display text-lg font-semibold text-ink">
                    {initials(member.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{member.name}</p>
                    <p className="text-[14px] text-faint">{member.position}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
