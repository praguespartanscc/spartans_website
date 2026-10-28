import type { Metadata } from 'next';
import { getCommittee } from '@/lib/data';
import { ROLE_DESCRIPTIONS } from '@/lib/club';
import type { CommitteeMember } from '@/types/supabase';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import JoinCta from '@/components/JoinCta';
import { Mail } from '@/components/ui/Icons';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Committee',
  description: 'Meet the committee that runs Prague Spartans Cricket Club: president, chairman, secretary, treasurer and team managers.',
  alternates: { canonical: '/committee' },
  openGraph: { url: '/committee', title: 'Prague Spartans committee' },
};

const LEAD_POSITIONS = ['President', 'Chairman'];

function MemberCard({ member, lead }: { member: CommitteeMember; lead?: boolean }) {
  return (
    <article className={`card relative h-full overflow-hidden p-6 sm:p-7 ${lead ? 'border-gold/60' : ''}`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${lead ? 'bg-gold' : 'bg-cream/15'}`} />
      <div className="flex items-center gap-5">
        <Avatar name={member.name} src={member.photo_url} size={lead ? 96 : 72} tone={lead ? 'gold' : 'dark'} />
        <div className="min-w-0">
          <p className="eyebrow">{member.position}</p>
          <h3 className="h-sub mt-1 text-[26px] leading-tight">{member.name}</h3>
        </div>
      </div>
      <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-muted">
        {member.bio || ROLE_DESCRIPTIONS[member.position] || 'Serves on the committee for the club.'}
      </p>
      {member.contact_email && (
        <a
          href={`mailto:${member.contact_email}`}
          className="mt-4 inline-flex items-center gap-2 text-[15px] text-gold transition-colors hover:text-gold-hi"
        >
          <Mail size={16} /> {member.contact_email}
        </a>
      )}
    </article>
  );
}

export default async function CommitteePage() {
  const members = await getCommittee();
  const leads = members.filter((m) => LEAD_POSITIONS.includes(m.position));
  const others = members.filter((m) => !LEAD_POSITIONS.includes(m.position));

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
          {members.length === 0 ? (
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
