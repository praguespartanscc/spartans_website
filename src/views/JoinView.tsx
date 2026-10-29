import { getSitePhotos } from '@/lib/drive';
import { PHOTO_SLOT, sitePhotoUrl } from '@/lib/photos';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CLUB_EMAIL, GROUND, HONOURS, MEMBERSHIP, SOCIAL, SQUADS, TRAINING } from '@/lib/club';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import JoinForm from '@/components/JoinForm';
import JsonLd from '@/components/JsonLd';
import { ArrowRight, ArrowUpRight, Check, Clock, Facebook, Instagram, Mail, MapPin } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs } from '@/lib/structured';

// Shared by /join (English) and /cs/join (Czech): the "play cricket in Prague" landing page
// with the player application form. Every fact comes from src/lib/club.ts.

export function joinMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/join',
    absoluteTitle: tr(lang, {
      en: 'Play Cricket in Prague | Join Prague Spartans Cricket Club',
      cs: 'Hrajte kriket v Praze | Přidejte se ke Prague Spartans',
    }),
    description: tr(lang, {
      en: 'Play cricket in Prague with Prague Spartans Cricket Club: all levels welcome, Thursday training in Prague 3, three league squads and T10 cricket. Apply online.',
      cs: 'Chcete hrát kriket v Praze? Kriketový klub Prague Spartans přijímá hráče všech úrovní. Trénink ve čtvrtek v Praze 3, tři ligové týmy. Přihlaste se online.',
    }),
  });
}

const weekly = TRAINING.weekly;
const groundAddress = `${GROUND.streetAddress}, ${GROUND.postalCode} ${GROUND.locality}`;

function MapLink({ href, lang }: { href: string; lang: Lang }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link-arrow mt-2 text-[15px]">
      {tr(lang, { en: 'Open in Google Maps', cs: 'Otevřít v Mapách Google' })} <ArrowUpRight size={15} />
    </a>
  );
}

function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-gold underline-offset-4 hover:text-gold-hi hover:underline">
      {children}
    </Link>
  );
}

function questions(lang: Lang): { q: string; a: ReactNode }[] {
  const L = (path: string) => localePath(lang, path);
  const winter = TRAINING.winter.map((v) => v.name);
  return tr(lang, {
    en: [
      {
        q: 'Where can I play cricket in Prague?',
        a: (
          <>
            Prague Spartans Cricket Club trains on Thursdays from 17:00 to 19:00 in the cricket nets at {weekly.venue.name} in Žižkov, Prague 3 and plays home
            matches at <InlineLink href={L('/ground')}>{GROUND.name}</InlineLink>, {groundAddress}. New players of every level can apply on
            this page.
          </>
        ),
      },
      {
        q: 'Do I need cricket experience?',
        a: 'No. Beginners and experienced players are both welcome. After your first training session you are placed in one of our three squads.',
      },
      {
        q: 'Do I need my own kit?',
        a: 'No. Membership includes free nets sessions and the club\'s cricket equipment: helmets, gloves, pads, elbow and thigh guards, bats and balls. Just bring comfortable sports clothes and trainers. The club playing shirt is not included in membership.',
      },
      {
        q: 'When and where do you train?',
        a: (
          <>
            Usually on Thursdays from 17:00 to 19:00 in the cricket nets at {weekly.venue.name}, {weekly.venue.address}. Upcoming sessions are listed on the{' '}
            <InlineLink href={L('/practices')}>training page</InlineLink>.
          </>
        ),
      },
      {
        q: 'Is there indoor cricket in winter?',
        a: `Yes. In winter the club holds indoor sessions at ${winter[0]} (Strašnice, Prague 10), ${winter[1]} and ${winter[2]}.`,
      },
      {
        q: 'Do I need to speak Czech?',
        a: 'No. Prague Spartans is an English-speaking, international club, and Czech speakers are just as welcome.',
      },
      {
        q: 'Is there an age limit?',
        a: 'There is no minimum age. Tell us your age in your application.',
      },
      {
        q: 'How much does membership cost?',
        a: 'Ask us about membership when you apply. It includes free nets sessions, use of the club\'s cricket equipment and student discounts.',
      },
      {
        q: 'Can I come and watch a match?',
        a: (
          <>
            Yes. Fixtures and results for all three squads are on the <InlineLink href={L('/fixtures')}>fixtures page</InlineLink>, and home
            matches are played at {GROUND.name}. When a match is streamed, you can watch it on{' '}
            <InlineLink href={L('/live')}>Spartans TV</InlineLink>.
          </>
        ),
      },
    ],
    cs: [
      {
        q: 'Kde si mohu v Praze zahrát kriket?',
        a: (
          <>
            Například u nás. Prague Spartans Cricket Club trénuje ve čtvrtek od 17:00 do 19:00 v kriketových sítích v Tenisovém centru Olšanská v Praze 3 na
            Žižkově a domácí zápasy hraje na <InlineLink href={L('/ground')}>kriketovém hřišti ve Vinoři</InlineLink> ({groundAddress}).
            Noví hráči všech úrovní se mohou přihlásit přímo na této stránce.
          </>
        ),
      },
      {
        q: 'Potřebuji zkušenosti s kriketem?',
        a: 'Ne. Vítáme začátečníky i zkušené hráče. Po prvním tréninku vás zařadíme do jednoho z našich tří týmů.',
      },
      {
        q: 'Potřebuji vlastní vybavení?',
        a: 'Ne. Členství zahrnuje tréninky v sítích zdarma a klubové kriketové vybavení: helmy, rukavice, chrániče nohou, loktů a stehen, pálky a míčky. Stačí si vzít pohodlné sportovní oblečení a obuv. Klubový dres v členství zahrnut není.',
      },
      {
        q: 'Kdy a kde trénujete?',
        a: (
          <>
            Obvykle ve čtvrtek od 17:00 do 19:00 v kriketových sítích v Tenisovém centru Olšanská, {weekly.venue.address}. Aktuální termíny najdete na{' '}
            <InlineLink href={L('/practices')}>stránce tréninků</InlineLink>.
          </>
        ),
      },
      {
        q: 'Hraje se kriket i v zimě v hale?',
        a: 'Ano. V zimě trénujeme v hale: ve sportovní hale VŠE Na Třebešíně (Strašnice, Praha 10), ve Sportovní hale Radotín a v Tenisovém centru Olšanská.',
      },
      {
        q: 'V jakém jazyce se v klubu mluví?',
        a: 'Prague Spartans je mezinárodní klub a dorozumíváme se anglicky. Hráči, kteří mluví česky, jsou u nás stejně vítáni.',
      },
      {
        q: 'Je stanovena věková hranice?',
        a: 'Minimální věk nemáme. Svůj věk prosím uveďte v přihlášce.',
      },
      {
        q: 'Kolik stojí členství?',
        a: 'Na podmínky členství se nás zeptejte v přihlášce. Členství zahrnuje tréninky v sítích zdarma, klubové kriketové vybavení a slevy pro studenty.',
      },
      {
        q: 'Mohu se přijít podívat na zápas?',
        a: (
          <>
            Ano. Rozpis zápasů a výsledky všech tří týmů najdete na <InlineLink href={L('/fixtures')}>stránce zápasů</InlineLink>, domácí
            zápasy hrajeme na kriketovém hřišti ve Vinoři. Pokud zápas vysíláme, můžete ho sledovat na{' '}
            <InlineLink href={L('/live')}>Spartans TV</InlineLink>.
          </>
        ),
      },
    ],
  });
}

export default async function JoinView({ lang }: { lang: Lang }) {
  const photos = await getSitePhotos();
  const L = (path: string) => localePath(lang, path);

  const steps = tr(lang, {
    en: [
      {
        title: 'Apply',
        text: (
          <>
            Fill in the <a href="#apply" className="text-gold hover:text-gold-hi">form below</a>, email{' '}
            <a href={`mailto:${CLUB_EMAIL}`} className="text-gold hover:text-gold-hi">{CLUB_EMAIL}</a> or send us a message on Instagram.
          </>
        ),
      },
      {
        title: 'Come to training',
        text: `We invite you to a training session, usually on a Thursday (${weekly.time}) in the cricket nets at ${weekly.venue.name}.`,
      },
      {
        title: 'Join a squad',
        text: 'You are then placed in one of our three squads: Vanguards, Mobilizers or Strikers.',
      },
    ],
    cs: [
      {
        title: 'Pošlete přihlášku',
        text: (
          <>
            Vyplňte <a href="#apply" className="text-gold hover:text-gold-hi">formulář níže</a>, napište na{' '}
            <a href={`mailto:${CLUB_EMAIL}`} className="text-gold hover:text-gold-hi">{CLUB_EMAIL}</a> nebo nám pošlete zprávu na Instagramu.
          </>
        ),
      },
      {
        title: 'Přijďte na trénink',
        text: 'Pozveme vás na trénink, obvykle ve čtvrtek od 17:00 do 19:00 v kriketových sítích v Tenisovém centru Olšanská.',
      },
      {
        title: 'Zařadíme vás do týmu',
        text: 'Poté vás zařadíme do jednoho z našich tří týmů: Vanguards, Mobilizers nebo Strikers.',
      },
    ],
  });

  const whoCanJoin = tr(lang, {
    en: [
      'Beginners and experienced players are both welcome.',
      'There is no minimum age.',
      'The club is English-speaking and international. Czech speakers are welcome too.',
      'Players of every nationality and background play for the club.',
    ],
    cs: [
      'Vítáme začátečníky i zkušené hráče.',
      'Minimální věk nemáme.',
      'Klub je mezinárodní a mluví se v něm anglicky. Hráči, kteří mluví česky, jsou vítáni.',
      'Hrají u nás lidé mnoha národností a z různého prostředí.',
    ],
  });

  const honours = HONOURS.filter((h) => h.year === 2026);

  return (
    <>
      <JsonLd data={breadcrumbs(lang, [[tr(lang, { en: 'Join', cs: 'Přidejte se' }), '/join']])} />

      <PageHero
        eyebrow={tr(lang, { en: 'Join the club', cs: 'Nábor nových hráčů' })}
        title={tr(lang, {
          en: (
            <>
              Play cricket <span className="text-gold">in Prague</span>{' '}
              <span className="mt-3 block text-[clamp(28px,4.5vw,56px)]">with Prague Spartans</span>
            </>
          ),
          cs: (
            <>
              Hrajte kriket <span className="text-gold">v Praze</span>{' '}
              <span className="mt-3 block text-[clamp(28px,4.5vw,56px)]">s Prague Spartans</span>
            </>
          ),
        })}
        intro={tr(lang, {
          en: 'Prague Spartans Cricket Club is an amateur cricket club in Prague, Czech Republic, founded in 2019. We train on Thursdays in Žižkov, Prague 3, play home matches at Vinoř Cricket Ground and welcome new players of every level and nationality.',
          cs: 'Prague Spartans Cricket Club je amatérský kriketový klub v Praze, založený v roce 2019. Trénujeme ve čtvrtek v Praze 3 na Žižkově, domácí zápasy hrajeme na kriketovém hřišti ve Vinoři a rádi přivítáme nové hráče všech úrovní i národností.',
        })}
        image={sitePhotoUrl(photos, PHOTO_SLOT.join)}
        imagePosition="center 30%"
      >
        <div className="flex flex-wrap gap-3">
          <a href="#apply" className="btn btn-gold btn-lg">
            {tr(lang, { en: 'Apply to join', cs: 'Chci se přidat' })}
            <ArrowRight size={18} className="btn-arrow" />
          </a>
          <a href="#training" className="btn btn-outline btn-lg">
            {tr(lang, { en: 'Training times', cs: 'Kdy trénujeme' })}
          </a>
        </div>
      </PageHero>

      {/* Who can join + how joining works */}
      <section className="py-14 sm:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-3">{tr(lang, { en: 'Everyone welcome', cs: 'Pro každého' })}</p>
            <h2 className="h-section">{tr(lang, { en: 'Who can join', cs: 'Kdo se může přidat' })}</h2>
            <ul className="mt-8 flex flex-col gap-4">
              {whoCanJoin.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[17px] leading-relaxed">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <Check size={16} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={90}>
            <p className="eyebrow mb-3">{tr(lang, { en: 'Three steps', cs: 'Tři kroky' })}</p>
            <h2 className="h-section">{tr(lang, { en: 'How joining works', cs: 'Jak se přidat' })}</h2>
            <ol className="mt-8 flex flex-col gap-4">
              {steps.map((step, i) => (
                <li key={step.title} className="card flex gap-5 p-5 sm:p-6">
                  <span className="font-varsity text-[40px] leading-none text-gold" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="h-sub text-[24px]">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Training */}
      <section id="training" className="scroll-mt-24 border-t border-cream/12 py-14 sm:py-20" aria-labelledby="join-training">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-3">{tr(lang, { en: 'Nets and sessions', cs: 'Tréninky' })}</p>
            <h2 id="join-training" className="h-section">
              {tr(lang, { en: 'Training', cs: 'Kdy a kde trénujeme' })}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <Reveal className="card p-6 sm:p-8">
              <h3 className="h-sub text-[26px]">{tr(lang, { en: 'Regular training', cs: 'Pravidelný trénink' })}</h3>
              <p className="mt-4 flex items-center gap-2 text-[17px]">
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
            </Reveal>
            <Reveal delay={90} className="card p-6 sm:p-8">
              <h3 className="h-sub text-[26px]">{tr(lang, { en: 'Winter indoor sessions', cs: 'Zimní tréninky v hale' })}</h3>
              <ul className="mt-4 flex flex-col gap-4">
                {TRAINING.winter.map((venue) => (
                  <li key={venue.name} className="flex items-start gap-2 text-[16px]">
                    <MapPin size={17} className="mt-1 shrink-0 text-gold" />
                    <span>
                      <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                        {venue.name}
                      </a>
                      <br />
                      <span className="text-muted">{venue.address}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Link href={L('/practices')} className="link-arrow mt-8">
            {tr(lang, { en: 'See upcoming training sessions', cs: 'Termíny nejbližších tréninků' })} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* What we play + membership */}
      <section className="border-t border-cream/12 py-14 sm:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-3">{tr(lang, { en: 'Leagues and cups', cs: 'Soutěže' })}</p>
            <h2 className="h-section">{tr(lang, { en: 'What we play', cs: 'Co hrajeme' })}</h2>
            <p className="mt-6 text-[17px] leading-relaxed text-muted">
              {tr(lang, {
                en: 'In 2026 our three squads played in the Czech Cricket Union (ČMKS) leagues: Vanguards in Division 1, Mobilizers in Division 2 and Strikers in Division 3. The club also plays ČMKS T10 and ECS Czechia, part of the European Cricket Series.',
                cs: 'V sezóně 2026 hrály naše tři týmy soutěže Českomoravského kriketového svazu (ČMKS): Vanguards 1. divizi, Mobilizers 2. divizi a Strikers 3. divizi. Klub hraje také ČMKS T10 a ECS Czechia, součást European Cricket Series.',
              })}
            </p>
            <h3 className="h-sub mt-8 text-[24px]">{tr(lang, { en: '2026 honours', cs: 'Úspěchy v roce 2026' })}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {honours.map((h) => (
                <li key={h.en} className="flex items-start gap-3 text-[16px] leading-relaxed">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <Check size={14} />
                  </span>
                  {h[lang]}
                </li>
              ))}
            </ul>
            <Link href={L('/fixtures')} className="link-arrow mt-8">
              {tr(lang, { en: 'Fixtures and results', cs: 'Zápasy a výsledky' })} <ArrowRight size={18} />
            </Link>
          </Reveal>

          <Reveal delay={90} className="card self-start p-6 sm:p-8">
            <h2 className="h-sub text-[30px]">{tr(lang, { en: 'What membership includes', cs: 'Co zahrnuje členství' })}</h2>
            <ul className="mt-6 flex flex-col gap-3">
              {MEMBERSHIP.includes[lang].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[17px]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <Check size={16} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 leading-relaxed text-muted">
              {tr(lang, {
                en: 'Ask us about membership when you apply, or email ',
                cs: 'Na podmínky členství se nás zeptejte v přihlášce nebo e-mailem na ',
              })}
              <a href={`mailto:${CLUB_EMAIL}`} className="text-gold hover:text-gold-hi">
                {CLUB_EMAIL}
              </a>
              .
            </p>
          </Reveal>
        </div>
      </section>

      {/* Squads */}
      <section className="border-t border-cream/12 py-14 sm:py-20" aria-labelledby="join-squads">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-3">{tr(lang, { en: 'Three squads', cs: 'Tři týmy' })}</p>
            <h2 id="join-squads" className="h-section">
              {tr(lang, { en: 'Our squads', cs: 'Naše týmy' })}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {SQUADS.map((squad, i) => (
              <Reveal key={squad.slug} delay={i * 90}>
                {/* Official squad logos always sit on solid black (brand manual). */}
                <Link
                  href={L(`/squads/${squad.slug}`)}
                  className="group flex h-full items-center gap-5 border border-cream/12 bg-ink p-5 transition-colors hover:border-gold"
                >
                  <Image
                    src={squad.logo}
                    alt={tr(lang, { en: `${squad.name} squad logo`, cs: `Logo týmu ${squad.name}` })}
                    width={85}
                    height={100}
                    className="h-[100px] w-auto shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="display text-[30px] transition-colors group-hover:text-gold">{squad.name}</h3>
                    <p className="mt-1 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-faint">
                      {tr(lang, { en: `Division ${squad.division}`, cs: `${squad.division}. divize` })}
                    </p>
                    <p className="mt-2 text-[15px] leading-snug text-muted">{tr(lang, { en: squad.tagline, cs: squad.taglineCs })}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Questions (visible Q&A, no FAQPage markup) */}
      <section className="border-t border-cream/12 py-14 sm:py-20" aria-labelledby="join-questions">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-3">{tr(lang, { en: 'Good to know', cs: 'Dobré vědět' })}</p>
            <h2 id="join-questions" className="h-section">
              {tr(lang, { en: 'Questions', cs: 'Časté dotazy' })}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {questions(lang).map((item) => (
              <div key={item.q} className="card p-6">
                <h3 className="h-sub text-[22px] leading-tight">{item.q}</h3>
                <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="relative isolate scroll-mt-20 overflow-hidden border-t border-cream/12" aria-labelledby="join-apply">
        <div className="container-x grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow mb-4">{tr(lang, { en: 'Apply', cs: 'Přihláška' })}</p>
            <h2 id="join-apply" className="h-section">
              {tr(lang, {
                en: (
                  <>
                    Your place <span className="text-gold">in the XI</span>
                  </>
                ),
                cs: (
                  <>
                    Vaše místo <span className="text-gold">v týmu</span>
                  </>
                ),
              })}
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-sand">
              {tr(lang, {
                en: 'Tell us a little about yourself and we will invite you to a training session. Prefer email or Instagram? That works too.',
                cs: 'Napište nám pár slov o sobě a pozveme vás na trénink. Můžete nám také napsat e-mail nebo zprávu na Instagramu.',
              })}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-muted">
              <a href={`mailto:${CLUB_EMAIL}`} className="inline-flex items-center gap-2 text-gold hover:text-gold-hi">
                <Mail size={18} />
                {CLUB_EMAIL}
              </a>
              <a
                href={SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="ml-2 flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold"
              >
                <Facebook size={18} />
              </a>
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <JoinForm lang={lang} />
        </div>
      </section>
    </>
  );
}
