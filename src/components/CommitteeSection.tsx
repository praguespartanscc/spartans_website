import Link from 'next/link';
import type { CommitteeMember } from '@/types/supabase';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import Avatar from '@/components/ui/Avatar';
import { ArrowRight } from '@/components/ui/Icons';

export default function CommitteeSection({ members }: { members: CommitteeMember[] }) {
  if (members.length === 0) return null;

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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, i) => (
            <Reveal key={member.id} delay={i * 60}>
              <div className="card card-hover flex items-center gap-4 p-5">
                <Avatar name={member.name} src={member.photo_url} size={56} tone="gold" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{member.name}</p>
                  <p className="text-[14px] text-faint">{member.position}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
