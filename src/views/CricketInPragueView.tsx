import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import JsonLd from '@/components/JsonLd';
import { ArrowRight, Check } from '@/components/ui/Icons';
import { CLUB_NAME, FOUNDED, GOVERNING_BODY, GROUND, GROUND_ID, ORG_ID, SITE_URL, TRAINING } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { OG_IMAGE, pageMeta } from '@/lib/seo';
import { breadcrumbs } from '@/lib/structured';

// Shared by /cricket-in-prague (English) and /cs/cricket-in-prague (Czech).
// A factual guide to cricket in Prague and the Czech Republic. Refresh it every season.

const UPDATED = '2026-10-28';

const TITLE = {
  en: 'Cricket in Prague & the Czech Republic: Clubs, Leagues & Grounds (2026)',
  cs: 'Kriket v Praze a v Česku: kluby, soutěže a hřiště (2026)',
};

const HEADLINE = {
  en: 'Cricket in Prague and the Czech Republic – a practical guide',
  cs: 'Kriket v Praze a v Česku – praktický průvodce',
};

const DESCRIPTION = {
  en: 'A practical guide to cricket in Prague and the Czech Republic: the Czech Cricket Union, leagues, T10 and indoor cricket, ECS Czechia, Vinoř Cricket Ground and Prague clubs.',
  cs: 'Praktický průvodce kriketem v Praze a v Česku: Českomoravský kriketový svaz, soutěže, T10 a halový kriket, ECS Czechia, hřiště ve Vinoři a pražské kluby.',
};

export function cricketInPragueMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/cricket-in-prague',
    absoluteTitle: TITLE[lang],
    description: DESCRIPTION[lang],
    type: 'article',
  });
}

const link = 'font-semibold text-gold transition-colors hover:text-gold-hi';
const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

// External references, numbered in this order in the text and in the Sources list.
const SOURCES = [
  { key: 'icc', title: 'Czech Republic – ICC Associate Member profile, International Cricket Council', url: 'https://www.icc-cricket.com/about/members/associate/czech-republic' },
  { key: 'wikiCzech', title: 'Czech Cricket (Czech Cricket Union) – Wikipedia', url: 'https://en.wikipedia.org/wiki/Czech_Cricket' },
  { key: 'wikiTeam', title: 'Czech Republic national cricket team – Wikipedia', url: 'https://en.wikipedia.org/wiki/Czech_Republic_national_cricket_team' },
  { key: 'radio', title: '“What is this game?” The steady rise of Czech cricket – Radio Prague International', url: 'https://english.radio.cz/what-game-steady-rise-czech-cricket-8772005' },
  { key: 'vinor', title: 'Vinoř Cricket Ground – Wikipedia', url: GROUND.wikipedia },
  { key: 'page', title: 'New field to be named in honour of Scott Page – Prague Barbarians CC (2020)', url: 'https://praguebarbarianscc.cz/2020/05/25/press-release/' },
  { key: 'cricinfo', title: 'Scott Page Field, Vinor – ground records, ESPNcricinfo', url: 'https://www.espncricinfo.com/cricket-grounds/scott-page-field-vinor-1230852/records' },
  { key: 'ecs', title: 'Prague Power Play: ECS Czechia 2026 set to light up Vinor – European Cricket Network', url: 'https://www.ecn.cricket/post/prague-power-play-ecs-czechia-2026-set-to-light-up-vinor' },
  { key: 'cec', title: 'Central Europe Cup – Wikipedia', url: 'https://en.wikipedia.org/wiki/Central_Europe_Cup' },
  { key: 'radioCec', title: 'Vinoř hosts three teams for the Central Europe Cup – Radio Prague International', url: 'https://english.radio.cz/bringing-international-world-cricket-prague-vinor-hosts-three-teams-central-8853661' },
  { key: 'clubs', title: 'Clubs – Czech Cricket Union (czechcricket.cz)', url: 'https://czechcricket.cz/pages/clubs' },
  { key: 'kacr', title: 'Kriketová akademie ČR (KAČR) – Czech Cricket Union', url: 'https://czechcricket.cz/pages/kacr' },
  { key: 'women', title: "Czech Republic women's national cricket team – Wikipedia", url: 'https://en.wikipedia.org/wiki/Czech_Republic_women%27s_national_cricket_team' },
  { key: 'cricheroes', title: 'Czech Cricket – competitions, scores and results, CricHeroes', url: 'https://cricheroes.com/association/1068/czech-cricket/home' },
  { key: 'pcc', title: 'Prague Cricket Club – official website', url: 'https://praguecricket.cz/' },
  { key: 'bohemian', title: 'Bohemian Cricket Club – Facebook', url: 'https://www.facebook.com/p/bohemian_cricket_club-100069571262171/' },
  { key: 'barbarians', title: 'Prague Barbarians Cricket Club – Facebook', url: 'https://www.facebook.com/PragueBarbarians/' },
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

type Club = {
  name: string;
  url: string;
  internal?: boolean;
  linkLabel: string;
  text: { en: string; cs: string };
  cite?: SourceKey[];
};

// Prague clubs we could verify, in alphabetical order. The official list is on czechcricket.cz.
const CLUBS: Club[] = [
  {
    name: 'Bohemian Cricket Club',
    url: 'https://www.facebook.com/p/bohemian_cricket_club-100069571262171/',
    linkLabel: 'Facebook',
    text: {
      en: 'Prague club that plays 40-over, T20, T10 and indoor cricket, according to the club. In the ECS Czechia Premier Division in 2026.',
      cs: 'Pražský klub, který podle vlastních informací hraje kriket na 40 overů, T20, T10 i halový kriket. V roce 2026 hrál Premier Division ECS Czechia.',
    },
    cite: ['bohemian', 'ecs'],
  },
  {
    name: 'Prague Barbarians Cricket Club',
    url: 'https://praguebarbarianscc.cz/',
    linkLabel: 'praguebarbarianscc.cz',
    text: {
      en: 'Social club that plays 40-over, T20 and winter league cricket, according to the club. In the ECS Czechia Challenger Division in 2026.',
      cs: 'Společenský klub, který podle vlastních informací hraje soutěže na 40 overů, T20 a zimní halovou ligu. V roce 2026 hrál Challenger Division ECS Czechia.',
    },
    cite: ['barbarians', 'ecs'],
  },
  {
    name: 'Prague Cricket Club',
    url: 'https://praguecricket.cz/',
    linkLabel: 'praguecricket.cz',
    text: {
      en: 'Founded in 1997 as the first cricket team in the country. In the ECS Czechia Premier Division in 2026.',
      cs: 'Založen v roce 1997 jako vůbec první kriketový tým v zemi. V roce 2026 hrál Premier Division ECS Czechia.',
    },
    cite: ['radio', 'pcc', 'ecs'],
  },
  {
    name: 'Prague Spartans Cricket Club',
    url: '/about',
    internal: true,
    linkLabel: 'praguespartanscc.com',
    text: {
      en: `Founded in ${FOUNDED}. Three squads in Divisions 1, 2 and 3 of the Czech Cricket Union leagues in 2026, plus ČMKS T10 and ECS Czechia. 2026 ECS Czechia Challenger Division winners.`,
      cs: `Založen v roce ${FOUNDED}. V roce 2026 tři týmy v 1., 2. a 3. divizi soutěží ČMKS, k tomu ČMKS T10 a ECS Czechia. Vítěz Challenger Division ECS Czechia 2026.`,
    },
  },
  {
    name: 'Prague Tigers Cricket Club',
    url: 'https://www.facebook.com/praguetigerscc/',
    linkLabel: 'Facebook',
    text: {
      en: 'Amateur cricket club in Prague. Went into ECS Czechia 2026 as the defending Premier Division champions.',
      cs: 'Amatérský kriketový klub v Praze. Do ECS Czechia 2026 vstupoval jako obhájce titulu v Premier Division.',
    },
    cite: ['ecs'],
  },
  {
    name: 'United Cricket Club',
    url: 'https://www.facebook.com/uccprague/',
    linkLabel: 'Facebook',
    text: {
      en: 'Prague-based club. In the ECS Czechia Premier Division in 2026.',
      cs: 'Klub se sídlem v Praze. V roce 2026 hrál Premier Division ECS Czechia.',
    },
    cite: ['ecs'],
  },
  {
    name: 'Vinohrady Cricket Club',
    url: 'http://www.vinohradycricket.cz/',
    linkLabel: 'vinohradycricket.cz',
    text: {
      en: 'Named after the Prague district of Vinohrady. Won the ECS Czechia Challenger Division in 2025 and was promoted to the Premier Division for 2026.',
      cs: 'Klub pojmenovaný po pražských Vinohradech. V roce 2025 vyhrál Challenger Division ECS Czechia a pro rok 2026 postoupil do Premier Division.',
    },
    cite: ['ecs'],
  },
];

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
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

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-ink p-6">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2 text-[16px] leading-relaxed text-cream">{children}</dd>
    </div>
  );
}

function articleLd(lang: Lang) {
  const url = `${SITE_URL}${localePath(lang, '/cricket-in-prague')}`;
  const club = { '@type': 'SportsOrganization', '@id': ORG_ID, name: CLUB_NAME, url: `${SITE_URL}/` };
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: HEADLINE[lang],
    name: TITLE[lang],
    description: DESCRIPTION[lang],
    inLanguage: lang,
    url,
    mainEntityOfPage: url,
    image: `${SITE_URL}${OG_IMAGE.url}`,
    datePublished: UPDATED,
    dateModified: UPDATED,
    author: club,
    publisher: club,
    about: [
      { '@type': 'Thing', name: tr(lang, { en: 'Cricket in the Czech Republic', cs: 'Kriket v České republice' }) },
      { '@type': 'City', name: tr(lang, { en: 'Prague', cs: 'Praha' }) },
    ],
    mentions: [
      { '@type': 'SportsOrganization', name: GOVERNING_BODY.name, alternateName: GOVERNING_BODY.localName, url: GOVERNING_BODY.url },
      { '@id': GROUND_ID },
    ],
  };
}

export default function CricketInPragueView({ lang }: { lang: Lang }) {
  const weekly = TRAINING.weekly;

  return (
    <>
      <JsonLd data={articleLd(lang)} />
      <JsonLd data={breadcrumbs(lang, [[tr(lang, { en: 'Cricket in Prague', cs: 'Kriket v Praze' }), '/cricket-in-prague']])} />

      <PageHero
        compact
        eyebrow={tr(lang, { en: 'Guide · Cricket in Czechia', cs: 'Průvodce · kriket v Česku' })}
        title={tr(lang, {
          en: (
            <>
              <span className="text-gold">Cricket in Prague</span> and the Czech Republic – a practical guide
            </>
          ),
          cs: (
            <>
              <span className="text-gold">Kriket v Praze</span> a v Česku – praktický průvodce
            </>
          ),
        })}
        intro={tr(lang, {
          en: 'Who runs cricket in the Czech Republic, how the leagues work, where matches are played, which clubs you can join in Prague and how to watch.',
          cs: 'Kdo řídí kriket v Česku, jak fungují soutěže, kde se hraje, ke kterým pražským klubům se můžete přidat a kde se dá kriket sledovat.',
        })}
      >
        <p className="text-[15px] text-muted">
          {tr(lang, { en: 'Updated', cs: 'Aktualizováno' })}{' '}
          <time dateTime={UPDATED}>{tr(lang, { en: 'October 2026', cs: 'říjen 2026' })}</time>
          {' · '}
          {tr(lang, { en: `By ${CLUB_NAME}`, cs: `Připravil ${CLUB_NAME}` })}
        </p>
      </PageHero>

      {/* Key facts */}
      <section className="border-b border-cream/12 bg-ink-2 py-16 sm:py-20" aria-labelledby="facts-heading">
        <div className="container-x">
          <Reveal className="mb-8 max-w-3xl">
            <h2 id="facts-heading" className="h-section">
              {tr(lang, { en: 'Czech cricket at a glance', cs: 'Český kriket v kostce' })}
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-sand">
              {tr(lang, {
                en: 'Cricket in the Czech Republic is played mostly in and around Prague. The sport is governed by the Czech Cricket Union (Českomoravský kriketový svaz, ČMKS), an Associate Member of the International Cricket Council, and most league and international matches are played at Vinoř Cricket Ground in Prague 9.',
                cs: 'Kriket se v Česku hraje hlavně v Praze a okolí. Řídí ho Českomoravský kriketový svaz (ČMKS), přidružený člen Mezinárodní kriketové rady (ICC). Většina ligových i mezinárodních zápasů se hraje na kriketovém hřišti ve Vinoři (Praha 9).',
              })}
              <Cite ids={['icc', 'vinor']} />
            </p>
          </Reveal>
          <dl className="grid gap-px border border-cream/12 bg-cream/12 sm:grid-cols-2 lg:grid-cols-3">
            <Fact label={tr(lang, { en: 'Governing body', cs: 'Řídicí orgán' })}>
              <a href={GOVERNING_BODY.url} {...ext} className={link}>
                {tr(lang, { en: 'Czech Cricket Union (ČMKS)', cs: 'Českomoravský kriketový svaz (ČMKS)' })}
              </a>
            </Fact>
            <Fact label={tr(lang, { en: 'ICC status', cs: 'Členství v ICC' })}>
              {tr(lang, { en: 'Member since 2000; Associate Member since 2017', cs: 'Člen od roku 2000, přidružený člen od roku 2017' })}
            </Fact>
            <Fact label={tr(lang, { en: 'Main ground', cs: 'Hlavní hřiště' })}>
              <Link href={localePath(lang, '/ground')} className={link}>
                {tr(lang, { en: GROUND.name, cs: GROUND.localName })}
              </Link>
              , Praha 9
            </Fact>
            <Fact label={tr(lang, { en: 'Formats', cs: 'Formáty' })}>
              {tr(lang, { en: 'League divisions, T10, indoor league in winter', cs: 'Ligové divize, T10, v zimě halová liga' })}
            </Fact>
            <Fact label={tr(lang, { en: 'International events', cs: 'Mezinárodní akce' })}>ECS Czechia, Central Europe Cup</Fact>
            <Fact label={tr(lang, { en: 'Youth cricket', cs: 'Mládež' })}>Kriketová akademie ČR (KAČR)</Fact>
          </dl>
        </div>
      </section>

      <div className="py-20 sm:py-28">
        <div className="container-x grid max-w-4xl gap-16">
          <Section id="history-heading" eyebrow={tr(lang, { en: '01 · History', cs: '01 · Historie' })} title={tr(lang, { en: 'A short history of Czech cricket', cs: 'Stručná historie českého kriketu' })}>
            <p>
              {tr(lang, {
                en: 'Cricket is a young sport in the Czech Republic. The first recorded match in the country was played in 1997, the year Prague Cricket Club – the first team in the country – was founded.',
                cs: 'Kriket je v Česku mladý sport. První zaznamenaný zápas se v zemi odehrál v roce 1997, kdy vznikl i Prague Cricket Club – vůbec první tým v zemi.',
              })}
              <Cite ids={['wikiCzech', 'radio']} />
            </p>
            <p>
              {tr(lang, {
                en: 'The Czech Cricket Union (Českomoravský kriketový svaz) was formed in 2000 and joined the International Cricket Council the same year. It has been an ICC Associate Member since 2017 and is also a member of ICC Europe.',
                cs: 'Českomoravský kriketový svaz vznikl v roce 2000 a ve stejném roce se stal členem Mezinárodní kriketové rady (ICC). Od roku 2017 je jejím přidruženým členem a patří také do ICC Europe.',
              })}
              <Cite ids={['icc', 'wikiTeam', 'wikiCzech']} />
            </p>
            <p>
              {tr(lang, {
                en: 'In 2012 the union opened Vinoř Cricket Ground in Prague, the first ground in the country built for cricket; a second field followed in 2014. For many years the game was played mainly by expatriates in Prague, which is why the Kriketová akademie ČR was set up to bring more young and Czech-speaking players into the sport.',
                cs: 'V roce 2012 otevřel svaz v Praze kriketové hřiště Vinoř, první hřiště v zemi postavené přímo pro kriket. V roce 2014 přibyla druhá hrací plocha. Kriket dlouho hráli v Praze hlavně cizinci, a proto vznikla Kriketová akademie ČR, která do sportu přivádí mladé a česky mluvící hráče.',
              })}
              <Cite ids={['vinor', 'kacr']} />
            </p>
          </Section>

          <Section id="leagues-heading" eyebrow={tr(lang, { en: '02 · Leagues', cs: '02 · Soutěže' })} title={tr(lang, { en: 'How Czech cricket is organised', cs: 'Jak jsou soutěže uspořádané' })}>
            <p>
              {tr(lang, {
                en: 'The Czech Cricket Union runs the national club competitions. A season usually includes league cricket in several divisions, a T10 league with ten-over matches and, in winter, an indoor league. Formats and the number of divisions can change from season to season, so check the union for the current set-up.',
                cs: 'Celostátní klubové soutěže pořádá Českomoravský kriketový svaz. Sezóna obvykle zahrnuje ligu v několika divizích, ligu T10 se zápasy na deset overů a v zimě halovou ligu. Formáty i počet divizí se mohou rok od roku měnit, aktuální podobu soutěží proto ověřte u svazu.',
              })}
              <Cite ids={['wikiCzech', 'cricheroes']} />
            </p>
            <p>
              {tr(lang, {
                en: `In 2026, for example, Prague Spartans Cricket Club entered three squads in Divisions 1, 2 and 3 and also played the ČMKS T10.`,
                cs: 'Například kriketový klub Prague Spartans měl v roce 2026 tři týmy v 1., 2. a 3. divizi a hrál také ČMKS T10.',
              })}
            </p>
            <p>
              {tr(lang, {
                en: 'Most clubs are based in Prague. Outside the capital there are clubs in Brno, Olomouc and České Budějovice, among others.',
                cs: 'Většina klubů sídlí v Praze. Mimo hlavní město jsou kluby mimo jiné v Brně, Olomouci a Českých Budějovicích.',
              })}
              <Cite ids={['wikiCzech', 'clubs']} />
            </p>
            <p>
              <a href={GOVERNING_BODY.url} {...ext} className="link-arrow">
                {tr(lang, { en: 'Competitions on czechcricket.cz', cs: 'Soutěže na czechcricket.cz' })} <ArrowRight size={18} />
              </a>
            </p>
          </Section>

          <Section id="ground-heading" eyebrow={tr(lang, { en: '03 · Ground', cs: '03 · Hřiště' })} title={tr(lang, { en: 'Vinoř Cricket Ground', cs: 'Kriketové hřiště Vinoř' })}>
            <p>
              {tr(lang, {
                en: `Vinoř Cricket Ground, ${GROUND.streetAddress}, ${GROUND.postalCode} ${GROUND.locality}, is the home of Czech cricket. It is run by the Czech Cricket Union, the national team plays its home internationals there, and many Prague clubs – Prague Spartans among them – play their league matches there.`,
                cs: `Kriketové hřiště Vinoř (${GROUND.streetAddress}, ${GROUND.postalCode} ${GROUND.locality}) je domovem českého kriketu. Provozuje ho Českomoravský kriketový svaz, hraje tu domácí zápasy česká reprezentace a ligové zápasy tu odehrává řada pražských klubů včetně Prague Spartans.`,
              })}
              <Cite ids={['vinor', 'cricinfo']} />
            </p>
            <p>
              {tr(lang, {
                en: 'One of its fields is named Scott Page Field after Scott Page, a long-serving Czech international and head groundsman at Vinoř, who died in 2020.',
                cs: 'Jedna z hracích ploch nese jméno Scott Page Field po Scottu Pageovi, dlouholetém českém reprezentantovi a hlavním správci hřiště ve Vinoři, který zemřel v roce 2020.',
              })}
              <Cite ids={['page']} />
            </p>
            <p>
              <Link href={localePath(lang, '/ground')} className="link-arrow">
                {tr(lang, { en: 'Address and directions', cs: 'Adresa a doprava' })} <ArrowRight size={18} />
              </Link>
            </p>
          </Section>

          <Section id="international-heading" eyebrow={tr(lang, { en: '04 · International', cs: '04 · Mezinárodní kriket' })} title={tr(lang, { en: 'ECS Czechia and international cricket', cs: 'ECS Czechia a mezinárodní kriket' })}>
            <p>
              {tr(lang, {
                en: 'ECS Czechia is the Czech event of the European Cricket Series, a T10 club competition run by the European Cricket Network. The 2026 edition at Vinoř had 58 matches between eleven clubs: a Challenger Division from 17 to 22 May, followed by a Premier Division from 23 to 31 May.',
                cs: 'ECS Czechia je český turnaj European Cricket Series, klubové soutěže ve formátu T10, kterou pořádá European Cricket Network. Ročník 2026 ve Vinoři nabídl 58 zápasů jedenácti klubů: nejprve Challenger Division od 17. do 22. května, potom Premier Division od 23. do 31. května.',
              })}
              <Cite ids={['ecs']} />
            </p>
            <p>
              {tr(lang, {
                en: 'Vinoř also hosts the Czech national team. The Central Europe Cup, an international tournament organised by the Czech Cricket Union, was first held in 2014 and is played at Vinoř; it is now a Twenty20 event.',
                cs: 'Ve Vinoři hraje i česká reprezentace. Central Europe Cup, mezinárodní turnaj pořádaný Českomoravským kriketovým svazem, se poprvé konal v roce 2014 a hraje se ve Vinoři, dnes ve formátu Twenty20.',
              })}
              <Cite ids={['cec', 'radioCec', 'cricinfo']} />
            </p>
          </Section>

          <Section id="clubs-heading" eyebrow={tr(lang, { en: '05 · Clubs', cs: '05 · Kluby' })} title={tr(lang, { en: 'Cricket clubs in Prague', cs: 'Kriketové kluby v Praze' })}>
            <p>
              {tr(lang, {
                en: 'Prague has more cricket clubs than any other Czech city. These are the Prague clubs we could verify, in alphabetical order; the Czech Cricket Union keeps the official list of member clubs.',
                cs: 'Praha má víc kriketových klubů než kterékoli jiné české město. Níže jsou pražské kluby, jejichž existenci jsme si ověřili, v abecedním pořadí. Oficiální seznam členských klubů vede Českomoravský kriketový svaz.',
              })}
              <Cite ids={['clubs', 'wikiCzech']} />
            </p>
            <ul className="grid pt-4 gap-4 sm:grid-cols-2">
              {CLUBS.map((c) => (
                <li key={c.name} className="card h-full p-6">
                  <h3 className="font-display text-2xl font-extrabold uppercase text-cream">{c.name}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">
                    {c.text[lang]}
                    {c.cite && <Cite ids={c.cite} />}
                  </p>
                  <p className="mt-3 text-[15px]">
                    {c.internal ? (
                      <Link href={localePath(lang, c.url)} className={link}>
                        {c.linkLabel}
                      </Link>
                    ) : (
                      <a href={c.url} {...ext} className={link}>
                        {c.linkLabel}
                      </a>
                    )}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-muted">
              {tr(lang, {
                en: (
                  <>
                    Missing a club or spotted an error? Email us and we will update this guide. Full list:{' '}
                    <a href="https://czechcricket.cz/pages/clubs" {...ext} className={link}>
                      czechcricket.cz/pages/clubs
                    </a>
                    .
                  </>
                ),
                cs: (
                  <>
                    Chybí tu nějaký klub nebo jste našli chybu? Napište nám a průvodce opravíme. Úplný seznam:{' '}
                    <a href="https://czechcricket.cz/pages/clubs" {...ext} className={link}>
                      czechcricket.cz/pages/clubs
                    </a>
                    .
                  </>
                ),
              })}
            </p>
          </Section>

          <Section id="youth-heading" eyebrow={tr(lang, { en: '06 · Youth & women', cs: '06 · Mládež a ženy' })} title={tr(lang, { en: "Youth and women's cricket", cs: 'Kriket pro mládež a ženy' })}>
            <p>
              {tr(lang, {
                en: 'Kriketová akademie ČR (KAČR) is a non-profit development partner of the Czech Cricket Union that focuses on young and Czech-speaking players. It runs introductory cricket classes in primary schools, after-school clubs and coach education, and junior teams play at under-10, under-12 and under-15 level.',
                cs: 'Kriketová akademie ČR (KAČR) je nezisková organizace a rozvojový partner Českomoravského kriketového svazu, která se zaměřuje na mladé a česky mluvící hráče. Pořádá úvodní hodiny kriketu na základních školách, kroužky a vzdělávání trenérů. Juniorské týmy hrají v kategoriích do 10, do 12 a do 15 let.',
              })}
              <Cite ids={['kacr']} />
            </p>
            <p>
              {tr(lang, {
                en: "The Czech Republic also has a women's national team, and a women's league – the Czech Women's Premier League – was played in 2026.",
                cs: 'Česko má také ženskou reprezentaci a v roce 2026 se hrála ženská liga Czech Women’s Premier League.',
              })}
              <Cite ids={['women', 'cricheroes']} />
            </p>
            <p>
              <a href="https://czechcricket.cz/pages/kacr" {...ext} className="link-arrow">
                {tr(lang, { en: 'Kriketová akademie ČR', cs: 'Kriketová akademie ČR' })} <ArrowRight size={18} />
              </a>
            </p>
          </Section>

          <Section id="watch-heading" eyebrow={tr(lang, { en: '07 · Watch', cs: '07 · Sledujte' })} title={tr(lang, { en: 'Watching cricket in Prague', cs: 'Kde sledovat kriket v Praze' })}>
            <p>
              {tr(lang, {
                en: (
                  <>
                    Most league and international matches in Prague are played at Vinoř – see the{' '}
                    <Link href={localePath(lang, '/ground')} className={link}>
                      ground page
                    </Link>{' '}
                    for the address and directions. Fixtures and live scores of Czech competitions are published on CricHeroes,
                    and ECS Czechia matches are streamed by the European Cricket Network.
                  </>
                ),
                cs: (
                  <>
                    Většina ligových i mezinárodních zápasů v Praze se hraje ve Vinoři – adresu a cestu najdete na{' '}
                    <Link href={localePath(lang, '/ground')} className={link}>
                      stránce o hřišti
                    </Link>
                    . Rozpisy a průběžné výsledky českých soutěží zveřejňuje CricHeroes a zápasy ECS Czechia vysílá European
                    Cricket Network.
                  </>
                ),
              })}
              <Cite ids={['cricheroes', 'ecs']} />
            </p>
            <p>
              {tr(lang, {
                en: (
                  <>
                    Prague Spartans fixtures and results are on our{' '}
                    <Link href={localePath(lang, '/fixtures')} className={link}>
                      fixtures page
                    </Link>
                    , and matches we stream are on{' '}
                    <Link href={localePath(lang, '/live')} className={link}>
                      Spartans TV
                    </Link>
                    .
                  </>
                ),
                cs: (
                  <>
                    Zápasy a výsledky Prague Spartans najdete na stránce{' '}
                    <Link href={localePath(lang, '/fixtures')} className={link}>
                      Zápasy a výsledky
                    </Link>{' '}
                    a přenosy na{' '}
                    <Link href={localePath(lang, '/live')} className={link}>
                      Spartans TV
                    </Link>
                    .
                  </>
                ),
              })}
            </p>
          </Section>

          {/* Why Prague Spartans */}
          <Reveal>
            <aside aria-labelledby="why-heading" className="card border-gold/60 relative overflow-hidden p-7 sm:p-10">
              <span className="absolute inset-x-0 top-0 h-1 bg-gold" />
              <p className="eyebrow">{tr(lang, { en: 'Want to play?', cs: 'Chcete hrát?' })}</p>
              <h2 id="why-heading" className="h-sub mt-2 text-[32px] leading-tight">
                {tr(lang, { en: 'Why Prague Spartans', cs: 'Proč Prague Spartans' })}
              </h2>
              <ul className="mt-6 space-y-4 text-[17px] leading-relaxed text-sand">
                <li className="flex gap-3">
                  <Check size={20} className="mt-1 shrink-0 text-gold" />
                  <span>
                    {tr(lang, {
                      en: 'Three squads – Vanguards, Mobilizers and Strikers – in Divisions 1, 2 and 3 of the Czech Cricket Union leagues, plus ČMKS T10 and ECS Czechia.',
                      cs: 'Tři týmy – Vanguards, Mobilizers a Strikers – v 1., 2. a 3. divizi soutěží ČMKS, k tomu ČMKS T10 a ECS Czechia.',
                    })}
                  </span>
                </li>
                <li className="flex gap-3">
                  <Check size={20} className="mt-1 shrink-0 text-gold" />
                  <span>
                    {tr(lang, {
                      en: 'In 2026: ECS Czechia Challenger Division winners, ČMKS T10 winners and Division 2 winners (Mobilizers).',
                      cs: 'V roce 2026: vítězové Challenger Division ECS Czechia, vítězové ČMKS T10 a vítězové 2. divize (Mobilizers).',
                    })}
                  </span>
                </li>
                <li className="flex gap-3">
                  <Check size={20} className="mt-1 shrink-0 text-gold" />
                  <span>
                    {tr(lang, {
                      en: `Beginners and experienced players welcome, no minimum age, English-speaking. Training usually on ${weekly.day.en}s, ${weekly.time}, in the cricket nets at ${weekly.venue.name}; membership includes free nets, use of the club's cricket equipment and student discounts.`,
                      cs: `Vítáme začátečníky i zkušené hráče, minimální věk není stanoven a v klubu se mluví anglicky. Trénujeme obvykle ve ${weekly.day.cs} ${weekly.time} v kriketových sítích v Tenisovém centru Olšanská; členství zahrnuje tréninky v sítích zdarma, klubové kriketové vybavení a slevy pro studenty.`,
                    })}
                  </span>
                </li>
              </ul>
              <Link href={localePath(lang, '/join')} className="btn btn-gold btn-lg mt-8">
                {tr(lang, { en: 'Apply to join', cs: 'Chci se přidat' })}
                <ArrowRight size={18} className="btn-arrow" />
              </Link>
            </aside>
          </Reveal>

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
              <p className="mt-6 text-[14px] text-dim">
                {tr(lang, { en: 'Updated', cs: 'Aktualizováno' })} <time dateTime={UPDATED}>{tr(lang, { en: '28 October 2026', cs: '28. října 2026' })}</time>
              </p>
            </section>
          </Reveal>
        </div>
      </div>
    </>
  );
}
