import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight } from '@/components/ui/Icons';
import { FOUNDED } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';

export default function StorySection({ lang = 'en' }: { lang?: Lang }) {
  return (
    <section className="border-t border-cream/12 py-20 sm:py-28" aria-labelledby="story-heading">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow mb-3">{tr(lang, { en: 'Our mission', cs: 'Naše poslání' })}</p>
          <h2 id="story-heading" className="h-section">
            {tr(lang, {
              en: (
                <>
                  Compete
                  <br />
                  fearlessly
                </>
              ),
              cs: (
                <>
                  Hrát
                  <br />
                  nebojácně
                </>
              ),
            })}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-cream">
            {tr(lang, {
              en: 'To compete fearlessly while growing cricket in Prague and inspiring the local community through discipline, respect and teamwork.',
              cs: 'Hrát nebojácně, rozvíjet kriket v Praze a inspirovat místní komunitu disciplínou, respektem a týmovou prací.',
            })}
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            {tr(lang, {
              en: `Founded in ${FOUNDED}, the club began as a small group of friends brought together by the love of cricket, and has grown into a diverse, international community. The club is English-speaking, and Czech speakers are very welcome too.`,
              cs: `Klub vznikl v roce ${FOUNDED} jako malá parta přátel, které spojila láska ke kriketu. Dnes je z něj pestrá mezinárodní komunita. Hlavním jazykem klubu je angličtina, ale rádi mezi sebou přivítáme i hráče, kteří mluví česky.`,
            })}
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            {tr(lang, {
              en: 'Whether you are a seasoned cricketer or picking up a bat for the first time, there is a place for you in the Spartan family, on and off the field.',
              cs: 'Ať už jste zkušený hráč, nebo budete držet pálku poprvé v životě, ve Spartans pro vás najdeme místo – na hřišti i mimo něj.',
            })}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={localePath(lang, '/about')} className="btn btn-outline">
              {tr(lang, { en: 'About the club', cs: 'O klubu' })}
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
            <Link href={localePath(lang, '/committee')} className="btn btn-outline">
              {tr(lang, { en: 'Meet the committee', cs: 'Poznejte výbor' })}
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-4">
          <Reveal delay={100} as="figure" className="col-span-2 m-0">
            <div className="zoom-frame relative aspect-[16/9] overflow-hidden">
              <Image
                src="/home_carouse2.jpeg"
                alt={tr(lang, {
                  en: 'A row of silver Prague Spartans award trophies',
                  cs: 'Řada stříbrných trofejí klubu Prague Spartans',
                })}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-[14px] text-faint">
              {tr(lang, { en: 'Season 2024 player awards', cs: 'Ocenění hráčů za sezónu 2024' })}
            </figcaption>
          </Reveal>
          <Reveal delay={180} as="figure" className="col-span-2 m-0 sm:col-span-2">
            <div className="zoom-frame relative aspect-[16/9] overflow-hidden">
              <Image
                src="/story1.jpeg"
                alt={tr(lang, {
                  en: 'Club members gathered outside a restaurant in Prague with their awards',
                  cs: 'Členové klubu s oceněními před restaurací v Praze',
                })}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover object-[center_60%]"
              />
            </div>
            <figcaption className="mt-2 text-[14px] text-faint">
              {tr(lang, { en: 'Awards night with the squad', cs: 'Večer vyhlášení klubových ocenění' })}
            </figcaption>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
