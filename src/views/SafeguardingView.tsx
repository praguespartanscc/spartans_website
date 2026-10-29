import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getSettings } from '@/lib/data';
import { CLUB_EMAIL } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs } from '@/lib/structured';
import PageHero from '@/components/ui/PageHero';
import JsonLd from '@/components/JsonLd';
import { Mail } from '@/components/ui/Icons';

// Shared by /safeguarding (English) and /cs/safeguarding (Czech). The welfare officer is set in admin Settings.

export function safeguardingMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/safeguarding',
    title: tr(lang, { en: 'Safeguarding & Code of Conduct', cs: 'Bezpečí dětí a pravidla chování' }),
    description: tr(lang, {
      en: 'How Prague Spartans Cricket Club keeps junior players safe, the code of conduct for players, parents and volunteers, and who to contact with a concern.',
      cs: 'Jak kriketový klub Prague Spartans chrání mladé hráče, pravidla chování pro hráče, rodiče a dobrovolníky a koho kontaktovat, když máte obavy.',
    }),
  });
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-cream/12 py-8">
      <h2 className="h-sub text-[26px] sm:text-[30px]">{title}</h2>
      <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-sand [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">{children}</div>
    </section>
  );
}

export default async function SafeguardingView({ lang }: { lang: Lang }) {
  const settings = await getSettings();
  const officerName = settings.welfare_officer_name?.trim() || null;
  const officerEmail = settings.welfare_officer_email?.trim() || CLUB_EMAIL;
  const label = tr(lang, { en: 'Safeguarding & code of conduct', cs: 'Bezpečí dětí a pravidla chování' });

  const codes: { title: { en: string; cs: string }; items: { en: string; cs: string }[] }[] = [
    {
      title: { en: 'Players', cs: 'Hráči' },
      items: [
        { en: 'Play within the Laws and the Spirit of Cricket. Respect the umpires’ decisions.', cs: 'Hrajte podle pravidel a v duchu kriketu. Respektujte rozhodnutí rozhodčích.' },
        { en: 'Treat teammates, opponents and officials with respect, on and off the field.', cs: 'Chovejte se s respektem ke spoluhráčům, soupeřům i rozhodčím, na hřišti i mimo něj.' },
        { en: 'No bullying, abuse or discrimination of any kind.', cs: 'Žádná šikana, urážky ani diskriminace v jakékoli podobě.' },
        { en: 'Wear a helmet when batting or keeping against a hard ball.', cs: 'Při pálkování a v roli brankáře proti tvrdému míčku noste helmu.' },
      ],
    },
    {
      title: { en: 'Parents and spectators', cs: 'Rodiče a diváci' },
      items: [
        { en: 'Encourage every player and keep comments positive.', cs: 'Povzbuzujte všechny hráče a vyjadřujte se pozitivně.' },
        { en: 'Leave coaching to the coaches and decisions to the umpires.', cs: 'Trénování nechte trenérům a rozhodování rozhodčím.' },
        { en: 'Tell a coach when you drop off or collect a junior player.', cs: 'Když mladého hráče přivádíte nebo vyzvedáváte, dejte vědět trenérovi.' },
      ],
    },
    {
      title: { en: 'Coaches and volunteers', cs: 'Trenéři a dobrovolníci' },
      items: [
        { en: 'Put the welfare of young players first, always.', cs: 'Bezpečí a pohoda mladých hráčů jsou vždy na prvním místě.' },
        { en: 'Avoid being alone with a junior player. Keep sessions open and visible.', cs: 'Nezůstávejte s mladým hráčem o samotě. Tréninky ať jsou otevřené a na očích.' },
        { en: 'Message juniors through their parents or in group chats that include parents.', cs: 'S mladými hráči komunikujte přes rodiče nebo ve skupinách, kde jsou i rodiče.' },
        { en: 'Ask before taking or sharing photos of junior players.', cs: 'Před pořízením nebo sdílením fotek mladých hráčů požádejte o souhlas.' },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumbs(lang, [[label, '/safeguarding']])} />
      <PageHero
        compact
        eyebrow={tr(lang, { en: 'Safe cricket for everyone', cs: 'Bezpečný kriket pro všechny' })}
        title={label}
        intro={tr(lang, {
          en: 'Juniors train and play with Prague Spartans. Everyone at the club shares the job of keeping them safe, and these are the standards we all follow.',
          cs: 'U Prague Spartans trénují a hrají i děti a mládež. Za jejich bezpečí odpovídá každý v klubu a toto jsou pravidla, kterými se všichni řídíme.',
        })}
      />

      <div className="container-x max-w-3xl pb-20 pt-6">
        <section className="card p-6 sm:p-8">
          <p className="eyebrow">{tr(lang, { en: 'Raise a concern', cs: 'Nahlásit obavy' })}</p>
          <h2 className="h-sub mt-3 text-[28px]">
            {officerName
              ? tr(lang, { en: `Club welfare officer: ${officerName}`, cs: `Pověřená osoba pro ochranu dětí: ${officerName}` })
              : tr(lang, { en: 'Talk to the committee', cs: 'Obraťte se na výbor klubu' })}
          </h2>
          <p className="mt-3 text-sand">
            {tr(lang, {
              en: 'If anything worries you about a young player’s safety or wellbeing at the club, tell us straight away. Every concern is taken seriously and handled in confidence.',
              cs: 'Pokud vás cokoli znepokojuje ohledně bezpečí nebo pohody mladého hráče v klubu, dejte nám hned vědět. Každou obavu bereme vážně a řešíme ji důvěrně.',
            })}
          </p>
          <a href={`mailto:${officerEmail}`} className="mt-5 inline-flex items-center gap-2 text-[17px] text-gold hover:text-gold-hi">
            <Mail size={18} /> {officerEmail}
          </a>
          <p className="mt-5 border-t border-cream/12 pt-4 text-[15px] text-muted">
            {tr(lang, {
              en: 'If a child is in immediate danger, call 112. Children and young people can also call Linka bezpečí free on 116\u00a0111.',
              cs: 'Pokud je dítě v bezprostředním ohrožení, volejte 112. Děti a mladí lidé mohou také zdarma volat Linku bezpečí na čísle 116\u00a0111.',
            })}
          </p>
        </section>

        <Block title={tr(lang, { en: 'Our commitment', cs: 'Náš závazek' })}>
          <ul>
            <li>
              {tr(lang, {
                en: 'Junior sessions are always run by adults, with parents welcome to stay and watch.',
                cs: 'Tréninky mládeže vždy vedou dospělí a rodiče se mohou dívat.',
              })}
            </li>
            <li>
              {tr(lang, {
                en: 'We collect only the contact details we need and share them only with the people running sessions.',
                cs: 'Shromažďujeme jen nezbytné kontaktní údaje a sdílíme je jen s lidmi, kteří tréninky vedou.',
              })}
            </li>
            <li>
              {tr(lang, {
                en: 'Photos of junior players go on the website or social media only with a parent’s agreement.',
                cs: 'Fotky mladých hráčů zveřejňujeme na webu a sociálních sítích jen se souhlasem rodičů.',
              })}
            </li>
          </ul>
        </Block>

        <Block title={tr(lang, { en: 'Code of conduct', cs: 'Pravidla chování' })}>
          <div className="grid gap-6">
            {codes.map((c) => (
              <div key={c.title.en}>
                <h3 className="font-display text-[20px] font-extrabold uppercase italic tracking-[0.04em] text-cream">{c.title[lang]}</h3>
                <ul className="mt-3">
                  {c.items.map((i) => (
                    <li key={i.en}>{i[lang]}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Block>

        <p className="border-t border-cream/12 pt-8 text-sand">
          {lang === 'cs' ? (
            <>
              Jak nakládáme s osobními údaji, popisujeme na stránce{' '}
              <Link href={localePath(lang, '/privacy')} className="text-gold hover:text-gold-hi">
                Ochrana osobních údajů
              </Link>
              .
            </>
          ) : (
            <>
              How we handle personal data is explained in our{' '}
              <Link href={localePath(lang, '/privacy')} className="text-gold hover:text-gold-hi">
                privacy notice
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </>
  );
}
