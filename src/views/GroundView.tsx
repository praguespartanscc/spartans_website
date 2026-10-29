import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import JoinCta from '@/components/JoinCta';
import JsonLd from '@/components/JsonLd';
import { ArrowUpRight, MapPin } from '@/components/ui/Icons';
import { GOVERNING_BODY, GROUND } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs, groundNode } from '@/lib/structured';

// Shared by /ground (English) and /cs/ground (Czech).

export function groundMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/ground',
    title: tr(lang, {
      en: 'Vinoř Cricket Ground, Prague – Directions & Info',
      cs: 'Kriketové hřiště Vinoř, Praha – adresa a doprava',
    }),
    description: tr(lang, {
      en: `Vinoř Cricket Ground (Scott Page Field), ${GROUND.streetAddress}, Prague 9 – the Czech Republic's main cricket ground and home of Prague Spartans Cricket Club. Address, map and directions.`,
      cs: `Kriketové hřiště Vinoř (Scott Page Field), ${GROUND.streetAddress}, Praha 9 – hlavní kriketové hřiště v Česku a domácí hřiště klubu Prague Spartans. Adresa, mapa a cesta na hřiště.`,
    }),
  });
}

const link = 'font-semibold text-gold transition-colors hover:text-gold-hi';
const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

const PID_URL = { en: 'https://pid.cz/en/', cs: 'https://pid.cz/' };

// External references for the "About the ground" section, numbered in this order.
const SOURCES = [
  {
    key: 'wiki',
    title: 'Vinoř Cricket Ground – Wikipedia',
    url: GROUND.wikipedia,
  },
  {
    key: 'cricinfo',
    title: 'Scott Page Field, Vinor – ground records, ESPNcricinfo',
    url: 'https://www.espncricinfo.com/cricket-grounds/scott-page-field-vinor-1230852/records',
  },
  {
    key: 'page',
    title: 'New field to be named in honour of Scott Page – Prague Barbarians CC (2020)',
    url: 'https://praguebarbarianscc.cz/2020/05/25/press-release/',
  },
  {
    key: 'cec',
    title: 'Central Europe Cup – Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Central_Europe_Cup',
  },
  {
    key: 'ecs',
    title: 'Prague Power Play: ECS Czechia 2026 set to light up Vinor – European Cricket Network',
    url: 'https://www.ecn.cricket/post/prague-power-play-ecs-czechia-2026-set-to-light-up-vinor',
  },
  {
    key: 'radio',
    title: 'Bringing the international world of cricket to Prague: Vinoř hosts the Central Europe Cup – Radio Prague International',
    url: 'https://english.radio.cz/bringing-international-world-cricket-prague-vinor-hosts-three-teams-central-8853661',
  },
] as const;

type SourceKey = (typeof SOURCES)[number]['key'];

function Cite({ ids }: { ids: SourceKey[] }) {
  return (
    <sup className="ml-0.5 text-[12px]">
      {ids.map((id, i) => {
        const n = SOURCES.findIndex((s) => s.key === id) + 1;
        return (
          <a key={id} href={`#source-${id}`} className="text-gold hover:text-gold-hi">
            {i > 0 ? ',' : '['}
            {n}
            {i === ids.length - 1 ? ']' : ''}
          </a>
        );
      })}
    </sup>
  );
}

function Block({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <Reveal>
      <section aria-labelledby={id}>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 id={id} className="h-section">
          {title}
        </h2>
        <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-sand">{children}</div>
      </section>
    </Reveal>
  );
}

export default function GroundView({ lang }: { lang: Lang }) {
  const address = `${GROUND.streetAddress}, ${GROUND.postalCode} ${GROUND.locality}`;

  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', ...groundNode() }} />
      <JsonLd data={breadcrumbs(lang, [[tr(lang, { en: 'Home ground', cs: 'Domácí hřiště' }), '/ground']])} />

      <PageHero
        eyebrow={tr(lang, { en: 'Home ground · Prague 9 – Vinoř', cs: 'Domácí hřiště · Praha 9 – Vinoř' })}
        title={tr(lang, {
          en: (
            <>
              Our home ground: <span className="text-gold">Vinoř Cricket Ground</span>, Prague
            </>
          ),
          cs: (
            <>
              Naše domácí hřiště: <span className="text-gold">Kriketové hřiště Vinoř</span>
            </>
          ),
        })}
        intro={tr(lang, {
          en: `Prague Spartans Cricket Club plays its home matches at ${GROUND.name} (${GROUND.pitch}) on the north-eastern edge of Prague. Here is the address, how to get there and how to watch a match.`,
          cs: `Kriketový klub Prague Spartans hraje domácí zápasy na kriketovém hřišti ve Vinoři (${GROUND.pitch}) na severovýchodním okraji Prahy. Najdete tu adresu, cestu na hřiště a informace pro diváky.`,
        })}
        image="/home_carousel.jpeg"
      />

      {/* Address */}
      <section className="border-b border-cream/12 py-16 sm:py-20" aria-labelledby="address-heading">
        <div className="container-x">
          <Reveal className="card flex flex-wrap items-center justify-between gap-8 p-7 sm:p-10">
            <div className="flex gap-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
                <MapPin size={22} />
              </span>
              <div>
                <h2 id="address-heading" className="eyebrow">
                  {tr(lang, { en: 'Address', cs: 'Adresa' })}
                </h2>
                <address className="mt-2 text-[19px] not-italic leading-relaxed text-cream">
                  <strong className="font-semibold">{tr(lang, { en: GROUND.name, cs: GROUND.localName })}</strong> ({GROUND.pitch})
                  <br />
                  {GROUND.streetAddress}
                  <br />
                  {GROUND.postalCode} {GROUND.locality}
                  <br />
                  {tr(lang, { en: 'Prague, Czech Republic', cs: 'Praha, Česká republika' })}
                </address>
              </div>
            </div>
            <a href={GROUND.mapsUrl} {...ext} className="btn btn-gold btn-lg">
              {tr(lang, { en: 'Open in Google Maps', cs: 'Otevřít v Mapách Google' })}
              <ArrowUpRight size={18} />
            </a>
          </Reveal>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-x grid max-w-4xl gap-16">
          <Block
            id="about-ground-heading"
            eyebrow={tr(lang, { en: '01 · The ground', cs: '01 · Hřiště' })}
            title={tr(lang, { en: 'About the ground', cs: 'O hřišti' })}
          >
            <p>
              {tr(lang, {
                en: `${GROUND.name} in Prague 9 – Vinoř is the main cricket ground in the Czech Republic and the first in the country built for cricket. It is run by the Czech Cricket Union (Českomoravský kriketový svaz, ČMKS) and has been in use since 2012. A second field was added in 2014.`,
                cs: 'Kriketové hřiště ve Vinoři (Praha 9) je hlavním kriketovým hřištěm v Česku a prvním hřištěm v zemi postaveným přímo pro kriket. Hřiště provozuje Českomoravský kriketový svaz (ČMKS) a v provozu je od roku 2012. V roce 2014 přibyla druhá hrací plocha.',
              })}
              <Cite ids={['wiki']} />
            </p>
            <p>
              {tr(lang, {
                en: `One of the fields is named ${GROUND.pitch} in honour of Scott Page, a long-serving Czech international cricketer and the head groundsman at Vinoř, who died in 2020.`,
                cs: `Jedna z ploch nese jméno ${GROUND.pitch} na počest Scotta Pageho, dlouholetého českého reprezentanta a hlavního správce hřiště ve Vinoři, který zemřel v roce 2020.`,
              })}
              <Cite ids={['page', 'cricinfo']} />
            </p>
            <p>
              {tr(lang, {
                en: 'Vinoř hosts the Czech Cricket Union league competitions and the Czech national team, including Twenty20 internationals. International club and national-team tournaments are played here too, such as the Central Europe Cup and ECS Czechia, the Czech event of the European Cricket Series.',
                cs: 'Ve Vinoři se hrají soutěže Českomoravského kriketového svazu a domácí zápasy české reprezentace včetně mezistátních utkání ve formátu Twenty20. Konají se tu i mezinárodní turnaje, například Central Europe Cup a ECS Czechia, český turnaj European Cricket Series.',
              })}
              <Cite ids={['cricinfo', 'cec', 'radio', 'ecs']} />
            </p>
            <p className="text-muted">
              {tr(lang, {
                en: 'The ground is shared: several other Prague clubs also play their matches at Vinoř.',
                cs: 'Hřiště není jen naše: ve Vinoři hraje své zápasy i několik dalších pražských klubů.',
              })}{' '}
              <Link href={localePath(lang, '/cricket-in-prague')} className={link}>
                {tr(lang, { en: 'Cricket in Prague – a guide', cs: 'Průvodce kriketem v Praze' })}
              </Link>
            </p>
          </Block>

          <Block
            id="getting-there-heading"
            eyebrow={tr(lang, { en: '02 · Directions', cs: '02 · Doprava' })}
            title={tr(lang, { en: 'Getting there', cs: 'Jak se k nám dostanete' })}
          >
            <p>
              {tr(lang, {
                en: `The ground is in Vinoř, a district on the north-eastern edge of Prague, at ${address}.`,
                cs: `Hřiště leží ve Vinoři na severovýchodním okraji Prahy, na adrese ${address}.`,
              })}
            </p>
            <h3 className="font-display text-2xl font-extrabold uppercase text-cream">
              {tr(lang, { en: 'By public transport', cs: 'Městskou hromadnou dopravou' })}
            </h3>
            <p>
              {tr(lang, {
                en: (
                  <>
                    Plan your trip with the{' '}
                    <a href={PID_URL.en} {...ext} className={link}>
                      PID journey planner
                    </a>{' '}
                    (Prague Integrated Transport). Enter <strong className="text-cream">Vinoř</strong> as your destination and
                    check the walk to {GROUND.streetAddress}; the planner always shows the current connections.
                  </>
                ),
                cs: (
                  <>
                    Spojení si najděte ve{' '}
                    <a href={PID_URL.cs} {...ext} className={link}>
                      vyhledávači spojení PID
                    </a>{' '}
                    (Pražská integrovaná doprava). Jako cíl zadejte <strong className="text-cream">Vinoř</strong> a zkontrolujte
                    si pěší cestu na adresu {GROUND.streetAddress}. Vyhledávač vždy ukáže aktuální spoje.
                  </>
                ),
              })}
            </p>
            <h3 className="font-display text-2xl font-extrabold uppercase text-cream">
              {tr(lang, { en: 'By car or bike', cs: 'Autem nebo na kole' })}
            </h3>
            <p>
              {tr(lang, {
                en: (
                  <>
                    Use the{' '}
                    <a href={GROUND.mapsUrl} {...ext} className={link}>
                      Google Maps link
                    </a>{' '}
                    for directions to {GROUND.streetAddress}, {GROUND.locality}.
                  </>
                ),
                cs: (
                  <>
                    Trasu na adresu {GROUND.streetAddress}, {GROUND.locality} vám ukážou{' '}
                    <a href={GROUND.mapsUrl} {...ext} className={link}>
                      Mapy Google
                    </a>
                    .
                  </>
                ),
              })}
            </p>
          </Block>

          <Block
            id="watching-heading"
            eyebrow={tr(lang, { en: '03 · Spectators', cs: '03 · Pro diváky' })}
            title={tr(lang, { en: 'Watching a match', cs: 'Přijďte se podívat na zápas' })}
          >
            <p>
              {tr(lang, {
                en: (
                  <>
                    Our match dates, times and opponents are on the{' '}
                    <Link href={localePath(lang, '/fixtures')} className={link}>
                      fixtures & results
                    </Link>{' '}
                    page. When we stream a match, you can watch it live on{' '}
                    <Link href={localePath(lang, '/live')} className={link}>
                      Spartans TV
                    </Link>
                    .
                  </>
                ),
                cs: (
                  <>
                    Termíny, časy a soupeře našich zápasů najdete na stránce{' '}
                    <Link href={localePath(lang, '/fixtures')} className={link}>
                      Zápasy a výsledky
                    </Link>
                    . Když zápas vysíláme, můžete ho sledovat živě na{' '}
                    <Link href={localePath(lang, '/live')} className={link}>
                      Spartans TV
                    </Link>
                    .
                  </>
                ),
              })}
            </p>
            <p className="text-muted">
              {tr(lang, {
                en: (
                  <>
                    Fixtures of other clubs and national competitions are published by the{' '}
                    <a href={GOVERNING_BODY.url} {...ext} className={link}>
                      Czech Cricket Union
                    </a>
                    .
                  </>
                ),
                cs: (
                  <>
                    Rozpis zápasů ostatních klubů a celostátních soutěží zveřejňuje{' '}
                    <a href={GOVERNING_BODY.url} {...ext} className={link}>
                      Českomoravský kriketový svaz
                    </a>
                    .
                  </>
                ),
              })}
            </p>
          </Block>

          <Reveal>
            <section aria-labelledby="sources-heading" className="border-t border-cream/12 pt-10">
              <h2 id="sources-heading" className="eyebrow">
                {tr(lang, { en: 'Sources', cs: 'Zdroje' })}
              </h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-muted marker:text-dim">
                {SOURCES.map((s) => (
                  <li key={s.key} id={`source-${s.key}`}>
                    <a href={s.url} {...ext} className="underline decoration-cream/30 underline-offset-2 hover:text-cream">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          </Reveal>
        </div>
      </section>

      <JoinCta
        lang={lang}
        title={tr(lang, { en: 'Play at Vinoř', cs: 'Hrajte ve Vinoři' })}
        text={tr(lang, {
          en: 'Want to play league cricket in Prague? Prague Spartans welcomes beginners and experienced players. Apply and we will invite you to training.',
          cs: 'Chcete hrát ligový kriket v Praze? Kriketový klub Prague Spartans vítá začátečníky i zkušené hráče. Přihlaste se a pozveme vás na trénink.',
        })}
      />
    </>
  );
}
