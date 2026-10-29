import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getCommittee, getHonours, getLiveNow, getMatches, getNews, getPractices, getSponsors, pragueToday, type Honour } from '@/lib/data';
import { getLiveStatus } from '@/lib/youtube';
import { getSitePhotos } from '@/lib/drive';
import { PHOTO_SLOT, sitePhoto, sitePhotosFor } from '@/lib/photos';
import {
  CLUB_EMAIL,
  FOUNDED,
  GOVERNING_BODY,
  GROUND,
  MEMBERSHIP,
  SEASON,
  SOCIAL,
  SQUADS,
  TRAINING,
  VENUES,
} from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { homeGraph } from '@/lib/structured';
import JsonLd from '@/components/JsonLd';
import HeroSection from '@/components/HeroSection';
import NextMatchBar from '@/components/NextMatchBar';
import LiveBar from '@/components/LiveBar';
import ValuesBand from '@/components/ValuesBand';
import QuoteBand from '@/components/QuoteBand';
import SquadsSection from '@/components/SquadsSection';
import EventsSection from '@/components/EventsSection';
import PracticeSection from '@/components/PracticeSection';
import StorySection from '@/components/StorySection';
import CommitteeSection from '@/components/CommitteeSection';
import SponsorsSection from '@/components/SponsorsSection';
import GallerySection from '@/components/GallerySection';
import NewsSection from '@/components/NewsSection';
import QuickLinks from '@/components/QuickLinks';
import JoinCta from '@/components/JoinCta';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight } from '@/components/ui/Icons';

// Shared by / (English) and /cs (Czech).

export function homeMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/',
    absoluteTitle: tr(lang, {
      en: 'Prague Spartans Cricket Club | Cricket Club in Prague, Czech Republic',
      cs: 'Kriket v Praze | Kriketový klub Prague Spartans',
    }),
    description: tr(lang, {
      en: 'Cricket club in Prague with three squads in Czech Cricket Union Divisions 1, 2 and 3, ČMKS T10 and ECS Czechia. Home ground: Vinoř. All levels are welcome.',
      cs: 'Kriketový klub v Praze: tři týmy v 1., 2. a 3. divizi Českomoravského kriketového svazu, ČMKS T10 a ECS Czechia. Domácí hřiště ve Vinoři. Vítáme hráče všech úrovní.',
    }),
  });
}

const link = 'font-semibold text-gold transition-colors hover:text-gold-hi';

// A short introduction for Czech visitors who are new to cricket (Czech home page only).
function CricketIntroCs() {
  return (
    <section className="border-b border-cream/12 py-16 sm:py-20" aria-labelledby="intro-heading">
      <Reveal className="container-x max-w-3xl">
        <p className="eyebrow mb-3">Pro nováčky</p>
        <h2 id="intro-heading" className="h-section">
          Kriket v Praze
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-cream">
          Kriket je týmová pálkovací hra, kterou možná znáte z Anglie, Indie, Pákistánu nebo Austrálie. Jeden tým odpaluje
          míček a sbírá body (tzv. runy), druhý nadhazuje a v poli se snaží pálkaře vyřadit.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          Kriketový klub Prague Spartans hraje kriket v Praze od roku {FOUNDED} a vítá i úplné začátečníky. Stačí vyplnit{' '}
          <Link href={localePath('cs', '/join')} className={link}>
            přihlášku
          </Link>{' '}
          a pozveme vás na trénink.
        </p>
        <Link href={localePath('cs', '/cricket-in-prague')} className="link-arrow mt-6">
          Více o kriketu v Praze a v Česku <ArrowRight size={18} />
        </Link>
      </Reveal>
    </section>
  );
}

function Fact({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`bg-ink p-6 sm:p-7 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2 text-[17px] leading-relaxed text-cream">{children}</dd>
    </div>
  );
}

// Plain, server-rendered club facts that search engines and AI assistants can quote.
function ClubFacts({ lang, honours: all }: { lang: Lang; honours: Honour[] }) {
  const weekly = TRAINING.weekly;
  const winter = TRAINING.winter.map((v) => v.name);
  const winterEn = `${winter.slice(0, -1).join(', ')} and ${winter[winter.length - 1]}`;
  const honoursYear = Math.max(...all.map((h) => h.year));
  const honours = all.filter((h) => h.year === honoursYear);

  return (
    <section className="border-t border-cream/12 bg-ink-2 py-20 sm:py-28" aria-labelledby="facts-heading">
      <div className="container-x">
        <SectionHeading
          id="facts-heading"
          eyebrow={tr(lang, { en: 'At a glance', cs: 'V kostce' })}
          title={tr(lang, { en: 'Club facts', cs: 'Fakta o klubu' })}
          intro={tr(lang, {
            en: 'The essentials about Prague Spartans Cricket Club: where we play, which leagues we play in, when we train and how to join.',
            cs: 'To nejdůležitější o kriketovém klubu Prague Spartans: kde hrajeme, v jakých soutěžích, kdy trénujeme a jak se přidat.',
          })}
        />
        <dl className="grid gap-px border border-cream/12 bg-cream/12 sm:grid-cols-2">
          <Fact label={tr(lang, { en: 'Founded', cs: 'Založení' })}>
            {tr(lang, { en: `${FOUNDED}, in Prague, Czech Republic`, cs: `${FOUNDED}, Praha` })}
          </Fact>

          <Fact label={tr(lang, { en: 'Home ground', cs: 'Domácí hřiště' })}>
            <Link href={localePath(lang, '/ground')} className={link}>
              {tr(lang, { en: GROUND.name, cs: GROUND.localName })}
            </Link>{' '}
            ({GROUND.pitch}), {GROUND.streetAddress}, {GROUND.postalCode} {GROUND.locality}
          </Fact>

          <Fact label={tr(lang, { en: `Leagues in ${SEASON}`, cs: `Soutěže v roce ${SEASON}` })}>
            <ul className="space-y-1">
              {SQUADS.map((s) => (
                <li key={s.slug}>
                  <Link href={localePath(lang, `/squads/${s.slug}`)} className={link}>
                    {s.name}
                  </Link>{' '}
                  ({tr(lang, { en: `Division ${s.division}`, cs: `${s.division}. divize` })})
                </li>
              ))}
            </ul>
            <p className="mt-2 text-muted">
              {tr(lang, {
                en: 'The club also plays ČMKS T10 and ECS Czechia (European Cricket Series).',
                cs: 'Klub hraje také ČMKS T10 a ECS Czechia (European Cricket Series).',
              })}
            </p>
          </Fact>

          <Fact label={tr(lang, { en: 'Governing body', cs: 'Svaz' })}>
            <a href={GOVERNING_BODY.url} target="_blank" rel="noopener noreferrer" className={link}>
              {tr(lang, { en: GOVERNING_BODY.name, cs: 'Českomoravský kriketový svaz' })}
            </a>{' '}
            {tr(lang, { en: '(Českomoravský kriketový svaz, ČMKS)', cs: '(ČMKS, Czech Cricket Union)' })}
          </Fact>

          <Fact label={tr(lang, { en: 'Training', cs: 'Tréninky' })}>
            {tr(lang, {
              en: `Usually on ${weekly.day.en}s, ${weekly.time}, in the cricket nets at ${weekly.venue.name}, ${weekly.venue.address}. Winter indoor sessions at ${winterEn}.`,
              cs: `Obvykle ve ${weekly.day.cs} ${weekly.time} v kriketových sítích v Tenisovém centru Olšanská, ${VENUES.olsanska.address}. V zimě trénujeme v hale: ve sportovní hale VŠE Na Třebešíně, ve Sportovní hale Radotín a na Olšanské.`,
            })}{' '}
            <Link href={localePath(lang, '/practices')} className={link}>
              {tr(lang, { en: 'Training calendar', cs: 'Kalendář tréninků' })}
            </Link>
          </Fact>

          <Fact label={tr(lang, { en: 'Membership', cs: 'Členství' })}>
            {tr(lang, { en: 'Membership includes:', cs: 'Členství zahrnuje:' })}
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {MEMBERSHIP.includes[lang].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {MEMBERSHIP.minimumAge === null && (
              <p className="mt-2 text-muted">
                {tr(lang, { en: 'There is no minimum age.', cs: 'Minimální věk není stanoven.' })}
              </p>
            )}
          </Fact>

          <Fact label={tr(lang, { en: 'Club language', cs: 'Jazyk klubu' })}>
            {tr(lang, {
              en: 'English-speaking and international. Czech speakers are welcome too.',
              cs: 'V klubu se mluví anglicky a hrají v něm hráči z mnoha zemí. Rádi přivítáme i ty, kdo mluví česky.',
            })}
          </Fact>

          <Fact label={tr(lang, { en: `${honoursYear} honours`, cs: `Úspěchy ${honoursYear}` })}>
            <ul className="space-y-1">
              {honours.map((h) => (
                <li key={h.en}>{h[lang]}</li>
              ))}
            </ul>
          </Fact>

          <Fact label={tr(lang, { en: 'How to join', cs: 'Jak se přidat' })} wide>
            {tr(lang, {
              en: (
                <>
                  Apply with the{' '}
                  <Link href={localePath(lang, '/join')} className={link}>
                    join form
                  </Link>
                  , email{' '}
                  <a href={`mailto:${CLUB_EMAIL}`} className={link}>
                    {CLUB_EMAIL}
                  </a>{' '}
                  or message us on{' '}
                  <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className={link}>
                    Instagram
                  </a>
                  . We invite you to a training session, then place you in a squad. Beginners and experienced players are
                  both welcome.
                </>
              ),
              cs: (
                <>
                  Vyplňte{' '}
                  <Link href={localePath(lang, '/join')} className={link}>
                    přihlášku
                  </Link>
                  , napište na{' '}
                  <a href={`mailto:${CLUB_EMAIL}`} className={link}>
                    {CLUB_EMAIL}
                  </a>{' '}
                  nebo nám pošlete zprávu na{' '}
                  <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className={link}>
                    Instagramu
                  </a>
                  . Pozveme vás na trénink a potom vás zařadíme do týmu. Vítáme začátečníky i zkušené hráče.
                </>
              ),
            })}
          </Fact>
        </dl>
      </div>
    </section>
  );
}

// The latest T10 title, for the hero stat.
function t10Year(honours: Honour[]): number | null {
  const years = honours.filter((h) => h.en.includes('T10') && /winners/i.test(h.en)).map((h) => h.year);
  return years.length ? Math.max(...years) : null;
}

export default async function HomeView({ lang }: { lang: Lang }) {
  const today = pragueToday();
  const [matches, practices, committee, sponsors, live, photos, honours, news, liveNow] = await Promise.all([
    getMatches(),
    getPractices(),
    getCommittee(),
    getSponsors(),
    getLiveStatus(),
    getSitePhotos(),
    getHonours(),
    getNews(),
    getLiveNow(),
  ]);

  const upcoming = matches.filter((m) => m.result === 'will be played' && m.date >= today);
  const next = upcoming[0] ?? null;
  const latest = [...matches].reverse().find((m) => m.result !== 'will be played' && m.date <= today) ?? null;

  return (
    <>
      <JsonLd data={homeGraph(lang)} />
      <LiveBar live={live.live} now={liveNow} lang={lang} />
      <HeroSection lang={lang} photos={photos} t10Year={t10Year(honours)} />
      <NextMatchBar match={next} live={!!next && next.date === today && !!next.stream_url} lang={lang} />
      <QuickLinks lang={lang} />
      <ValuesBand lang={lang} />
      {lang === 'cs' && <CricketIntroCs />}
      <SquadsSection lang={lang} />
      <EventsSection upcoming={upcoming.slice(0, 4)} latest={latest} today={today} lang={lang} />
      <NewsSection posts={news} lang={lang} />
      <SponsorsSection sponsors={sponsors} lang={lang} />
      <QuoteBand lang={lang} photo={sitePhoto(photos, PHOTO_SLOT.quote)} />
      <PracticeSection practices={practices.filter((p) => p.date >= today).slice(0, 3)} photo={sitePhoto(photos, PHOTO_SLOT.practice)} lang={lang} />
      <StorySection lang={lang} photos={sitePhotosFor(photos, [PHOTO_SLOT.story, PHOTO_SLOT.story2])} />
      <ClubFacts lang={lang} honours={honours} />
      <GallerySection photos={photos.slice(0, 8).map((photo) => ({ photo, href: '/gallery' }))} lang={lang} />
      <CommitteeSection members={committee} lang={lang} />
      <JoinCta lang={lang} />
    </>
  );
}
