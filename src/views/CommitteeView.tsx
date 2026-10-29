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
import { tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

// Shared by /committee (English) and /cs/committee (Czech).

export function committeeMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/committee',
    title: tr(lang, { en: 'Committee', cs: 'Výbor klubu' }),
    description: tr(lang, {
      en: 'Meet the committee that runs Prague Spartans Cricket Club in Prague: president, chairman, secretary, treasurer and team managers.',
      cs: 'Seznamte se s výborem, který vede kriketový klub Prague Spartans v Praze: prezident, předseda, jednatel, pokladník a manažeři týmů.',
    }),
  });
}

const POSITION_CS: Record<string, string> = {
  President: 'Prezident',
  Chairman: 'Předseda',
  Secretary: 'Jednatel',
  Treasurer: 'Pokladník',
  Manager: 'Manažer',
};

const ROLE_DESCRIPTIONS_CS: Record<string, string> = {
  President: 'Reprezentuje klub navenek a vede jeho oficiální akce.',
  Chairman: 'Řídí schůze výboru a dohlíží na směřování klubu.',
  Secretary: 'Vyřizuje korespondenci, vede záznamy a stará se o administrativu.',
  Treasurer: 'Spravuje finance klubu, rozpočet a finanční výkazy.',
  Manager: 'Má na starosti sestavu týmu, tréninky a sportovní chod klubu.',
};

const LEAD_POSITIONS = ['President', 'Chairman'];

function MemberCard({ member, lead, lang }: { member: CommitteeMember; lead?: boolean; lang: Lang }) {
  return (
    <article className={`card relative h-full overflow-hidden p-6 sm:p-7 ${lead ? 'border-gold/60' : ''}`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${lead ? 'bg-gold' : 'bg-cream/15'}`} />
      <div className="flex items-center gap-5">
        <Avatar name={member.name} src={member.photo_url} size={lead ? 96 : 72} tone={lead ? 'gold' : 'dark'} />
        <div className="min-w-0">
          <p className="eyebrow">{lang === 'cs' ? (POSITION_CS[member.position] ?? member.position) : member.position}</p>
          <h3 className="h-sub mt-1 text-[26px] leading-tight">{member.name}</h3>
        </div>
      </div>
      <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-muted">
        {member.bio ||
          (lang === 'cs' ? ROLE_DESCRIPTIONS_CS[member.position] : ROLE_DESCRIPTIONS[member.position]) ||
          tr(lang, { en: 'Serves on the committee for the club.', cs: 'Člen výboru klubu.' })}
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

export default async function CommitteeView({ lang }: { lang: Lang }) {
  const members = await getCommittee();
  const leads = members.filter((m) => LEAD_POSITIONS.includes(m.position));
  const others = members.filter((m) => !LEAD_POSITIONS.includes(m.position));

  return (
    <>
      <PageHero
        eyebrow={tr(lang, { en: 'Run by members', cs: 'Klub vedou členové' })}
        title={tr(lang, {
          en: (
            <>
              Prague Spartans <span className="text-gold">committee</span>
            </>
          ),
          cs: (
            <>
              Výbor klubu <span className="text-gold">Prague Spartans</span>
            </>
          ),
        })}
        intro={tr(lang, {
          en: 'The team behind the team. Our committee keeps Prague Spartans Cricket Club running and makes it the best place it can be for every member.',
          cs: 'Tým, který stojí za týmem. Výbor se stará o chod kriketového klubu Prague Spartans a o to, aby se v něm každý člen cítil co nejlépe.',
        })}
      />

      <section className="py-14 sm:py-20" aria-labelledby="committee-members">
        <div className="container-x">
          <h2 id="committee-members" className="sr-only">
            {tr(lang, { en: 'Committee members', cs: 'Členové výboru' })}
          </h2>
          {members.length === 0 ? (
            <EmptyState title={tr(lang, { en: 'Committee coming soon', cs: 'Výbor brzy doplníme' })}>
              {tr(lang, { en: 'Committee members will be listed here shortly.', cs: 'Členy výboru zde brzy zveřejníme.' })}
            </EmptyState>
          ) : (
            <>
              {leads.length > 0 && (
                <div className="mx-auto mb-4 grid max-w-4xl gap-4 md:grid-cols-2">
                  {leads.map((member, i) => (
                    <Reveal key={member.id} delay={i * 90}>
                      <MemberCard member={member} lead lang={lang} />
                    </Reveal>
                  ))}
                </div>
              )}
              {others.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((member, i) => (
                    <Reveal key={member.id} delay={120 + i * 70}>
                      <MemberCard member={member} lang={lang} />
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <JoinCta
        lang={lang}
        title={tr(lang, { en: 'Get involved', cs: 'Zapojte se' })}
        text={tr(lang, {
          en: 'Want to help shape the club? Members are always welcome to lend a hand, on the field and off it.',
          cs: 'Chcete pomoct utvářet klub? Pomocná ruka členů je vždy vítaná, na hřišti i mimo něj.',
        })}
      />
    </>
  );
}
