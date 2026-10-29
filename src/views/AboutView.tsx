import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageHero from '@/components/ui/PageHero';
import { ReadingProgress } from '@/components/ScrollExtras';
import Reveal from '@/components/ui/Reveal';
import Ticker from '@/components/ui/Ticker';
import JoinCta from '@/components/JoinCta';
import JsonLd from '@/components/JsonLd';
import { ArrowRight, Bolt, Glass, Users } from '@/components/ui/Icons';
import {
  CLUB_EMAIL,
  CLUB_NAME,
  FOUNDED,
  GOVERNING_BODY,
  GROUND,
  HONOURS,
  SOCIAL,
  SQUADS,
  TRAINING,
  VENUES,
} from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs, clubNode } from '@/lib/structured';

// Shared by /about (English) and /cs/about (Czech): the club's canonical fact sheet.

export function aboutMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/about',
    absoluteTitle: tr(lang, {
      en: 'About Prague Spartans Cricket Club | History, Ground & Leagues',
      cs: 'O klubu Prague Spartans | Historie, hřiště a soutěže',
    }),
    description: tr(lang, {
      en: `Prague Spartans Cricket Club is an amateur cricket club in Prague, founded in ${FOUNDED}. Three squads in Czech Cricket Union Divisions 1, 2 and 3, home ground at Vinoř, 2026 honours.`,
      cs: `Prague Spartans Cricket Club je amatérský kriketový klub v Praze, založený v roce ${FOUNDED}. Tři týmy v 1., 2. a 3. divizi ČMKS, domácí hřiště ve Vinoři a úspěchy sezóny 2026.`,
    }),
  });
}

const link = 'font-semibold text-gold transition-colors hover:text-gold-hi';
const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

const OFFERS = [
  {
    icon: Users,
    title: { en: 'Inclusive community', cs: 'Otevřená komunita' },
    text: {
      en: 'A welcoming club for players of every skill level and background. There is no minimum age.',
      cs: 'Přátelský klub pro hráče všech úrovní a z různých zemí. Minimální věk není stanoven.',
    },
  },
  {
    icon: Bolt,
    title: { en: 'Regular training', cs: 'Pravidelné tréninky' },
    text: {
      en: 'Weekly sessions, usually on Thursday evenings, and indoor sessions through the winter.',
      cs: 'Pravidelné tréninky, obvykle ve čtvrtek večer, a v zimě tréninky v hale.',
    },
  },
  {
    icon: Glass,
    title: { en: 'Social events', cs: 'Společenské akce' },
    text: {
      en: 'Team dinners, awards nights and get-togethers that build friendships beyond the field.',
      cs: 'Týmové večeře, vyhlášení sezóny a setkání, ze kterých vznikají přátelství i mimo hřiště.',
    },
  },
];

const SOCIAL_LINKS: { label: string; href: string; text: { en: string; cs: string } }[] = [
  { label: 'Instagram', href: SOCIAL.instagram, text: { en: 'News, photos and match days', cs: 'Novinky, fotky a zápasové dny' } },
  { label: 'Facebook', href: SOCIAL.facebook, text: { en: 'Club page', cs: 'Stránka klubu' } },
  { label: 'YouTube', href: SOCIAL.youtube, text: { en: 'Spartans TV match streams', cs: 'Spartans TV, přenosy zápasů' } },
  { label: 'Play-Cricket', href: SOCIAL.playCricket, text: { en: 'Club profile and scorecards', cs: 'Profil klubu a zápisy ze zápasů' } },
];

function FactCard({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="card h-full p-7 sm:p-8">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="h-sub mt-2 text-[28px] leading-tight">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[16px] leading-relaxed text-sand">{children}</div>
    </section>
  );
}

export default function AboutView({ lang }: { lang: Lang }) {
  const weekly = TRAINING.weekly;
  const honours = HONOURS.filter((h) => h.year === 2026);
  const winterEn = TRAINING.winter.map((v) => v.name);

  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', ...clubNode(lang) }} />
      <JsonLd data={breadcrumbs(lang, [[tr(lang, { en: 'About', cs: 'O klubu' }), '/about']])} />

      <ReadingProgress />

      <PageHero
        eyebrow={tr(lang, { en: `About the club · Prague since ${FOUNDED}`, cs: `O klubu · v Praze od roku ${FOUNDED}` })}
        title={tr(lang, {
          en: (
            <>
              Prague Spartans <span className="text-gold">Cricket Club</span>
            </>
          ),
          cs: (
            <>
              Kriketový klub <span className="text-gold">Prague Spartans</span>
            </>
          ),
        })}
        intro={tr(lang, {
          en: `An amateur cricket club in Prague, Czech Republic, founded in ${FOUNDED}. Three squads, league and tournament cricket at Vinoř, and every level welcome.`,
          cs: `Amatérský kriketový klub v Praze, založený v roce ${FOUNDED}. Tři týmy, ligový a turnajový kriket ve Vinoři a místo pro hráče všech úrovní.`,
        })}
        image="/home_carousel1.jpeg"
      />

      {/* Who we are */}
      <section className="py-20 sm:py-28" aria-labelledby="who-heading">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-3">{tr(lang, { en: '01 · Who we are', cs: '01 · Kdo jsme' })}</p>
            <h2 id="who-heading" className="h-section">
              {tr(lang, { en: 'A cricket club in Prague', cs: 'Kriketový klub v Praze' })}
            </h2>
            <p className="mt-6 text-[17px] leading-relaxed text-sand">
              {tr(lang, {
                en: `${CLUB_NAME} (Prague Spartans CC) is an amateur cricket club based in Prague, Czech Republic. It was founded in ${FOUNDED} and is a member of the Czech Cricket Union (Českomoravský kriketový svaz, ČMKS). In 2026 its three squads (Vanguards, Mobilizers and Strikers) play in Divisions 1, 2 and 3 of the Czech Cricket Union leagues, and the club also plays ČMKS T10 and ECS Czechia. Home matches are played at ${GROUND.name} in Vinoř, Prague 9.`,
                cs: `${CLUB_NAME} (Prague Spartans CC) je amatérský kriketový klub se sídlem v Praze. Vznikl v roce ${FOUNDED} a je členem Českomoravského kriketového svazu (ČMKS). V roce 2026 hrají jeho tři týmy (Vanguards, Mobilizers a Strikers) 1., 2. a 3. divizi soutěží svazu. Klub se účastní také soutěží ČMKS T10 a ECS Czechia. Domácí zápasy hraje na kriketovém hřišti ve Vinoři (Praha 9).`,
              })}
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">
              {tr(lang, {
                en: "We are an English-speaking, international club, and Czech speakers are very welcome too. Whether you're a seasoned cricketer or picking up a bat for the first time, there is a place for you.",
                cs: 'Klubovým jazykem je angličtina a hrají u nás lidé z mnoha zemí. Rádi uvítáme i hráče, kteří mluví česky. Ať už máte za sebou roky kriketu, nebo pálku držíte poprvé, místo se pro vás najde.',
              })}
            </p>
          </Reveal>
          <Reveal delay={120} className="zoom-frame relative aspect-[4/3] overflow-hidden">
            <Image
              src="/story1.jpeg"
              alt={tr(lang, { en: 'Prague Spartans members together in Prague', cs: 'Členové klubu Prague Spartans v Praze' })}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[center_60%]"
            />
          </Reveal>
        </div>
      </section>

      <Ticker lang={lang} />

      {/* History */}
      <section className="bg-ink-2 py-20 sm:py-28" aria-labelledby="history-heading">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal delay={120} className="zoom-frame relative order-2 aspect-[4/3] overflow-hidden lg:order-1">
            <Image
              src="/home_carouse2.jpeg"
              alt={tr(lang, { en: 'Prague Spartans award trophies', cs: 'Trofeje klubu Prague Spartans' })}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <p className="eyebrow mb-3">{tr(lang, { en: '02 · Our story', cs: '02 · Náš příběh' })}</p>
            <h2 id="history-heading" className="h-section">
              {tr(lang, { en: 'Our history', cs: 'Historie klubu' })}
            </h2>
            <p className="mt-6 text-[17px] leading-relaxed text-sand">
              {tr(lang, {
                en: `Prague Spartans Cricket Club was founded in Prague in ${FOUNDED} to bring people together through cricket. What began as a small group of friends sharing a passion for the game has grown into a club with three squads playing league cricket every season.`,
                cs: `Kriketový klub Prague Spartans vznikl v Praze v roce ${FOUNDED} s jednoduchým cílem: spojit lidi díky kriketu. Z malé party přátel se stal klub se třemi týmy, které každou sezónu hrají ligový kriket.`,
              })}
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">
              {tr(lang, {
                en: 'In 2026 the club won the ECS Czechia Challenger Division and the ČMKS T10, Mobilizers won Division 2, and Vanguards finished second in the Division 1 league stage and reached the semi-finals.',
                cs: 'V roce 2026 klub vyhrál Challenger Division ECS Czechia i ČMKS T10, Mobilizers ovládli 2. divizi a Vanguards skončili po základní části 1. divize druzí a postoupili do semifinále.',
              })}
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">
              {tr(lang, {
                en: 'Our aim has stayed the same: good cricket, sportsmanship and the spirit of the game, on and off the field.',
                cs: 'Náš cíl se nemění: dobrý kriket, sportovní chování a duch hry, na hřišti i mimo něj.',
              })}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Squads, leagues and honours */}
      <section className="py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <section aria-labelledby="leagues-heading">
              <p className="eyebrow mb-3">{tr(lang, { en: '03 · What we play', cs: '03 · Co hrajeme' })}</p>
              <h2 id="leagues-heading" className="h-section">
                {tr(lang, { en: 'Squads & leagues 2026', cs: 'Týmy a soutěže 2026' })}
              </h2>
              <table className="mt-8 w-full border-collapse text-left text-[16px]">
                <caption className="sr-only">
                  {tr(lang, {
                    en: 'Prague Spartans squads and their Czech Cricket Union league divisions in 2026',
                    cs: 'Týmy Prague Spartans a jejich divize v soutěžích ČMKS v roce 2026',
                  })}
                </caption>
                <thead>
                  <tr className="border-b border-cream/20">
                    <th scope="col" className="eyebrow py-3 pr-4 font-normal">
                      {tr(lang, { en: 'Squad', cs: 'Tým' })}
                    </th>
                    <th scope="col" className="eyebrow py-3 font-normal">
                      {tr(lang, { en: 'League (ČMKS)', cs: 'Soutěž (ČMKS)' })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SQUADS.map((s) => (
                    <tr key={s.slug} className="border-b border-cream/12">
                      <th scope="row" className="py-4 pr-4 font-normal">
                        <Link href={localePath(lang, `/squads/${s.slug}`)} className={link}>
                          {s.name}
                        </Link>
                      </th>
                      <td className="py-4 text-sand">{tr(lang, { en: `Division ${s.division}`, cs: `${s.division}. divize` })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-5 text-[16px] leading-relaxed text-muted">
                {tr(lang, {
                  en: 'The club also enters the ČMKS T10 competition and ECS Czechia, the Czech event of the European Cricket Series.',
                  cs: 'Klub hraje také soutěž ČMKS T10 a ECS Czechia, český turnaj European Cricket Series.',
                })}{' '}
                <Link href={localePath(lang, '/fixtures')} className={link}>
                  {tr(lang, { en: 'Fixtures & results', cs: 'Zápasy a výsledky' })}
                </Link>
              </p>
            </section>
          </Reveal>

          <Reveal delay={120}>
            <section aria-labelledby="honours-heading">
              <p className="eyebrow mb-3">{tr(lang, { en: '04 · Honours', cs: '04 · Úspěchy' })}</p>
              <h2 id="honours-heading" className="h-section">
                {tr(lang, { en: 'Honours 2026', cs: 'Úspěchy 2026' })}
              </h2>
              <ul className="mt-8 border-t border-cream/12">
                {honours.map((h) => (
                  <li key={h.en} className="flex gap-4 border-b border-cream/12 py-4 text-[16px] leading-relaxed text-sand">
                    <span className="font-display text-lg font-extrabold text-gold">{h.year}</span>
                    <span>{h[lang]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        </div>
      </section>

      {/* Ground, training, governing body */}
      <section className="bg-ink-2 py-20 sm:py-28">
        <div className="container-x grid gap-4 md:grid-cols-3">
          <Reveal>
            <FactCard id="ground-heading" eyebrow={tr(lang, { en: '05 · Where we play', cs: '05 · Kde hrajeme' })} title={tr(lang, { en: 'Home ground', cs: 'Domácí hřiště' })}>
              <p>
                {tr(lang, { en: GROUND.name, cs: GROUND.localName })} ({GROUND.pitch})
                <br />
                {GROUND.streetAddress}, {GROUND.postalCode} {GROUND.locality}
              </p>
              <p className="flex flex-wrap gap-x-5 gap-y-2">
                <Link href={localePath(lang, '/ground')} className={link}>
                  {tr(lang, { en: 'About the ground', cs: 'O hřišti' })}
                </Link>
                <a href={GROUND.mapsUrl} {...ext} className={link}>
                  {tr(lang, { en: 'Google Maps', cs: 'Mapy Google' })}
                </a>
              </p>
            </FactCard>
          </Reveal>

          <Reveal delay={90}>
            <FactCard id="training-heading" eyebrow={tr(lang, { en: '06 · Training', cs: '06 · Tréninky' })} title={tr(lang, { en: 'When we train', cs: 'Kdy trénujeme' })}>
              <p>
                {tr(lang, {
                  en: `Usually on ${weekly.day.en}s, ${weekly.time}, in the cricket nets at ${weekly.venue.name} (${weekly.venue.address}).`,
                  cs: `Obvykle ve ${weekly.day.cs} ${weekly.time} v kriketových sítích v Tenisovém centru Olšanská (${VENUES.olsanska.address}).`,
                })}
              </p>
              <p className="text-muted">
                {tr(lang, {
                  en: `In winter we train indoors at ${winterEn.slice(0, -1).join(', ')} and ${winterEn[winterEn.length - 1]}.`,
                  cs: 'V zimě trénujeme v hale: ve sportovní hale VŠE Na Třebešíně, ve Sportovní hale Radotín a na Olšanské.',
                })}
              </p>
              <p>
                <Link href={localePath(lang, '/practices')} className={link}>
                  {tr(lang, { en: 'Training calendar', cs: 'Kalendář tréninků' })}
                </Link>
              </p>
            </FactCard>
          </Reveal>

          <Reveal delay={180}>
            <FactCard id="body-heading" eyebrow={tr(lang, { en: '07 · Governing body', cs: '07 · Svaz' })} title={tr(lang, { en: 'Czech Cricket Union', cs: 'Českomoravský kriketový svaz' })}>
              <p>
                {tr(lang, {
                  en: 'Prague Spartans Cricket Club is a member club of the Czech Cricket Union (Českomoravský kriketový svaz, ČMKS), the governing body for cricket in the Czech Republic and an Associate Member of the International Cricket Council (ICC).',
                  cs: 'Prague Spartans Cricket Club je členským klubem Českomoravského kriketového svazu (ČMKS), který řídí kriket v Česku a je přidruženým členem Mezinárodní kriketové rady (ICC).',
                })}
              </p>
              <p>
                <a href={GOVERNING_BODY.url} {...ext} className={link}>
                  czechcricket.cz
                </a>
              </p>
            </FactCard>
          </Reveal>
        </div>
      </section>

      {/* Online and joining */}
      <section className="py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <section aria-labelledby="online-heading">
              <p className="eyebrow mb-3">{tr(lang, { en: '08 · Online', cs: '08 · Online' })}</p>
              <h2 id="online-heading" className="h-section">
                {tr(lang, { en: 'Find us online', cs: 'Kde nás najdete online' })}
              </h2>
              <ul className="mt-8 border-t border-cream/12">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-cream/12 py-4">
                    <a href={s.href} target="_blank" rel="me noopener noreferrer" className={`${link} text-[17px]`}>
                      {s.label}
                    </a>
                    <span className="text-[15px] text-muted">{s.text[lang]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal delay={120}>
            <section aria-labelledby="join-heading">
              <p className="eyebrow mb-3">{tr(lang, { en: '09 · Join', cs: '09 · Nábor' })}</p>
              <h2 id="join-heading" className="h-section">
                {tr(lang, { en: 'How to join', cs: 'Jak se přidat' })}
              </h2>
              <ol className="mt-8 list-decimal space-y-3 pl-5 text-[17px] leading-relaxed text-sand marker:text-gold">
                <li>
                  {tr(lang, {
                    en: (
                      <>
                        Apply with the{' '}
                        <Link href={localePath(lang, '/join')} className={link}>
                          join form
                        </Link>
                        , or email{' '}
                        <a href={`mailto:${CLUB_EMAIL}`} className={link}>
                          {CLUB_EMAIL}
                        </a>{' '}
                        or message us on Instagram.
                      </>
                    ),
                    cs: (
                      <>
                        Vyplňte{' '}
                        <Link href={localePath(lang, '/join')} className={link}>
                          přihlášku
                        </Link>
                        , nebo nám napište na{' '}
                        <a href={`mailto:${CLUB_EMAIL}`} className={link}>
                          {CLUB_EMAIL}
                        </a>{' '}
                        nebo přes Instagram.
                      </>
                    ),
                  })}
                </li>
                <li>{tr(lang, { en: 'We invite you to a training session.', cs: 'Pozveme vás na trénink.' })}</li>
                <li>
                  {tr(lang, {
                    en: 'You are placed in one of our three squads.',
                    cs: 'Zařadíme vás do jednoho ze tří týmů.',
                  })}
                </li>
              </ol>
              <p className="mt-5 text-[16px] leading-relaxed text-muted">
                {tr(lang, {
                  en: 'Beginners and experienced players are welcome, and there is no minimum age. Membership includes free nets, use of the club\'s cricket equipment and student discounts.',
                  cs: 'Vítáme začátečníky i zkušené hráče a minimální věk není stanoven. Členství zahrnuje tréninky v sítích zdarma, klubové kriketové vybavení a slevy pro studenty.',
                })}
              </p>
              <Link href={localePath(lang, '/join')} className="link-arrow mt-6">
                {tr(lang, { en: 'Apply to join', cs: 'Chci se přidat' })} <ArrowRight size={18} />
              </Link>
            </section>
          </Reveal>
        </div>
      </section>

      {/* Why players join */}
      <section className="border-t border-cream/12 bg-ink-2 py-20 sm:py-28" aria-labelledby="offer-heading">
        <div className="container-x">
          <Reveal className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">{tr(lang, { en: '10 · What we offer', cs: '10 · Co nabízíme' })}</p>
            <h2 id="offer-heading" className="h-section">
              {tr(lang, { en: 'Why players join', cs: 'Proč k nám hráči chodí' })}
            </h2>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {OFFERS.map((offer, i) => (
              <Reveal key={offer.title.en} delay={i * 90}>
                <div className="card card-hover h-full p-7">
                  <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-ink">
                    <offer.icon size={22} />
                  </span>
                  <h3 className="font-display text-2xl font-extrabold uppercase">{offer.title[lang]}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{offer.text[lang]}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <JoinCta
        lang={lang}
        title={tr(lang, { en: 'Join us today', cs: 'Přidejte se k nám' })}
        text={tr(lang, {
          en: "Be part of a team where friendship and the spirit of the game come first. Whether you want competitive league cricket or a friendly game, there's a place for you.",
          cs: 'Staňte se součástí týmu, kde je na prvním místě přátelství a duch hry. Ať už chcete hrát soutěžní ligový kriket, nebo si jen přátelsky zahrát, místo se pro vás najde.',
        })}
      />
    </>
  );
}
