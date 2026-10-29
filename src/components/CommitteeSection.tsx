import Link from 'next/link';
import type { CommitteeMember } from '@/types/supabase';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import Avatar from '@/components/ui/Avatar';
import { ArrowRight } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';

const POSITION_CS: Record<string, string> = {
  President: 'Prezident',
  Chairman: 'Předseda',
  Secretary: 'Jednatel',
  Treasurer: 'Pokladník',
  Manager: 'Manažer',
};

export default function CommitteeSection({ members, lang = 'en' }: { members: CommitteeMember[]; lang?: Lang }) {
  if (members.length === 0) return null;

  return (
    <section className="py-20 sm:py-28" aria-labelledby="committee-heading">
      <div className="container-x">
        <SectionHeading
          id="committee-heading"
          eyebrow={tr(lang, { en: 'Run by members', cs: 'Klub vedou členové' })}
          title={tr(lang, { en: 'The committee', cs: 'Výbor klubu' })}
          intro={tr(lang, {
            en: 'The people who keep the club running, from fixtures to finances.',
            cs: 'Lidé, kteří se starají o chod klubu, od rozpisu zápasů po finance.',
          })}
          action={
            <Link href={localePath(lang, '/committee')} className="link-arrow">
              {tr(lang, { en: 'Meet the committee', cs: 'Poznejte výbor' })} <ArrowRight size={18} />
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
                  <p className="text-[14px] text-faint">
                    {lang === 'cs' ? (POSITION_CS[member.position] ?? member.position) : member.position}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
