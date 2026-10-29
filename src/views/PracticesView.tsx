import type { Metadata } from 'next';
import Link from 'next/link';
import { getPractices, pragueToday } from '@/lib/data';
import { MEMBERSHIP, TRAINING } from '@/lib/club';
import PageHero from '@/components/ui/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Reveal from '@/components/ui/Reveal';
import PracticeRow from '@/components/PracticeRow';
import JoinCta from '@/components/JoinCta';
import JsonLd from '@/components/JsonLd';
import { ArrowRight, ArrowUpRight, Check, Clock, MapPin } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs } from '@/lib/structured';

// Shared by /practices (English) and /cs/practices (Czech). The regular and winter training
// blocks come from src/lib/club.ts and always render; the session calendar comes from the database.

export function practicesMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/practices',
    title: tr(lang, { en: 'Cricket Training & Nets in Prague', cs: 'Kriketové tréninky v Praze' }),
    description: tr(lang, {
      en: 'Cricket training in Prague with Prague Spartans Cricket Club: Thursdays 17:00–19:00 at Tenisové centrum Olšanská, Prague 3, plus indoor sessions in winter. Beginners welcome.',
      cs: 'Kriketové tréninky v Praze s klubem Prague Spartans: ve čtvrtek 17:00–19:00 v Tenisovém centru Olšanská v Praze 3, v zimě v hale. Začátečníci jsou vítáni.',
    }),
  });
}

const weekly = TRAINING.weekly;

function MapLink({ href, lang }: { href: string; lang: Lang }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link-arrow mt-4 text-[15px]">
      {tr(lang, { en: 'Open in Google Maps', cs: 'Otevřít v Mapách Google' })} <ArrowUpRight size={15} />
    </a>
  );
}

export default async function PracticesView({ lang }: { lang: Lang }) {
  const today = pragueToday();
  const all = await getPractices();
  const upcoming = all.filter((p) => p.date >= today);
  const past = all.filter((p) => p.date < today).reverse().slice(0, 8);
  const joinHref = localePath(lang, '/join');

  return (
    <>
      <JsonLd data={breadcrumbs(lang, [[tr(lang, { en: 'Training', cs: 'Tréninky' }), '/practices']])} />

      <PageHero
        eyebrow={tr(lang, { en: 'Train with us', cs: 'Trénujte s námi' })}
        title={tr(lang, {
          en: (
            <>
              Cricket training <span className="text-gold">in Prague</span>
            </>
          ),
          cs: (
            <>
              Kriketové tréninky <span className="text-gold">v Praze</span>
            </>
          ),
        })}
        intro={tr(lang, {
          en: 'Prague Spartans Cricket Club usually trains on Thursdays from 17:00 to 19:00 at Tenisové centrum Olšanská in Prague 3 – Žižkov, with indoor sessions through the winter. Beginners and experienced players are welcome.',
          cs: 'Prague Spartans Cricket Club obvykle trénuje ve čtvrtek od 17:00 do 19:00 v Tenisovém centru Olšanská v Praze 3 na Žižkově a v zimě v hale. Vítáme začátečníky i zkušené hráče.',
        })}
        image="/home_carousel.jpeg"
        imagePosition="center 40%"
      />

      {/* Static training information: always shown, even when the calendar is empty. */}
      <section className="py-12 sm:py-16">
        <div className="container-x grid max-w-5xl gap-4 lg:grid-cols-2">
          <Reveal className="card p-6 sm:p-8" as="article">
            <h2 className="h-sub text-[30px]">{tr(lang, { en: 'Regular training', cs: 'Pravidelný trénink' })}</h2>
            <p className="mt-5 flex items-center gap-2 text-[17px]">
              <Clock size={18} className="text-gold" />
              {tr(lang, {
                en: `Usually ${weekly.day.en}s, ${weekly.time}`,
                cs: `Obvykle ve ${weekly.day.cs} ${weekly.time}`,
              })}
            </p>
            <p className="mt-2 flex items-start gap-2 text-[17px]">
              <MapPin size={18} className="mt-1 shrink-0 text-gold" />
              <span>
                {weekly.venue.name}
                <br />
                <span className="text-muted">{weekly.venue.address}</span>
              </span>
            </p>
            <MapLink href={weekly.venue.mapsUrl} lang={lang} />
            <h3 className="mt-8 font-display text-[15px] font-bold uppercase tracking-[0.14em] text-faint">
              {tr(lang, { en: 'Membership includes', cs: 'Členství zahrnuje' })}
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {MEMBERSHIP.includes[lang].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[16px]">
                  <Check size={16} className="text-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href={joinHref} className="link-arrow mt-6">
              {tr(lang, { en: 'Come to training', cs: 'Přijďte na trénink' })} <ArrowRight size={18} />
            </Link>
          </Reveal>

          <Reveal className="card p-6 sm:p-8" as="article" delay={90}>
            <h2 className="h-sub text-[30px]">{tr(lang, { en: 'Winter indoor training', cs: 'Zimní tréninky v hale' })}</h2>
            <p className="mt-4 leading-relaxed text-muted">
              {tr(lang, {
                en: 'In winter the club trains indoors. Sessions are held at these venues; check the calendar below for dates.',
                cs: 'V zimě trénujeme v hale, a to na těchto místech. Termíny najdete v kalendáři níže.',
              })}
            </p>
            <ul className="mt-5 flex flex-col gap-5">
              {TRAINING.winter.map((venue) => (
                <li key={venue.name}>
                  <h3 className="flex items-start gap-2 text-[17px] font-semibold">
                    <MapPin size={18} className="mt-1 shrink-0 text-gold" />
                    {venue.name}
                  </h3>
                  <p className="ml-[26px] text-muted">{venue.address}</p>
                  <a
                    href={venue.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-[26px] mt-1 inline-flex items-center gap-1.5 text-[15px] text-gold hover:text-gold-hi"
                  >
                    {tr(lang, { en: 'Map', cs: 'Mapa' })} <ArrowUpRight size={14} />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-cream/12 py-12 sm:py-16" aria-labelledby="upcoming-practices">
        <div className="container-x max-w-4xl">
          <h2 id="upcoming-practices" className="h-sub mb-5 text-[30px]">
            {tr(lang, { en: 'Upcoming sessions', cs: 'Nejbližší tréninky' })}
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState
              title={tr(lang, { en: 'No dates in the calendar yet', cs: 'Termíny zatím nejsou v kalendáři' })}
              action={
                <Link href={joinHref} className="btn btn-gold">
                  {tr(lang, { en: 'Ask about the next session', cs: 'Zeptat se na další trénink' })}
                </Link>
              }
            >
              {tr(lang, {
                en: 'Specific session dates are not listed right now. Training usually runs on Thursdays from 17:00 to 19:00; get in touch and we will confirm the next one.',
                cs: 'Konkrétní termíny teď v kalendáři nejsou. Obvykle trénujeme ve čtvrtek od 17:00 do 19:00; ozvěte se nám a potvrdíme vám nejbližší trénink.',
              })}
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((practice) => (
                <PracticeRow key={practice.id} practice={practice} lang={lang} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <details className="group mt-14">
              <summary className="h-sub cursor-pointer list-none text-[24px] text-muted transition-colors hover:text-cream">
                {tr(lang, { en: 'Recent sessions', cs: 'Proběhlé tréninky' })}{' '}
                <span className="font-display text-[16px] text-dim">{past.length}</span>
                <span className="ml-2 inline-block transition-transform group-open:rotate-90">›</span>
              </summary>
              <div className="mt-5 flex flex-col gap-3">
                {past.map((practice) => (
                  <PracticeRow key={practice.id} practice={practice} past lang={lang} />
                ))}
              </div>
            </details>
          )}
        </div>
      </section>

      <JoinCta
        lang={lang}
        title={tr(lang, { en: 'Come to nets', cs: 'Přijďte si zatrénovat' })}
        text={tr(lang, {
          en: "New faces are always welcome at training. Tell us a little about yourself and we'll invite you to a session.",
          cs: 'Nové tváře jsou na trénincích vždy vítány. Napište nám pár slov o sobě a pozveme vás na trénink.',
        })}
      />
    </>
  );
}
