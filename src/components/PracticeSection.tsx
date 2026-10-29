import Image from 'next/image';
import Link from 'next/link';
import type { Practice } from '@/types/supabase';
import Reveal from '@/components/ui/Reveal';
import PracticeRow from '@/components/PracticeRow';
import { ArrowRight } from '@/components/ui/Icons';
import { TRAINING } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';

const PracticeSection = ({ practices, lang = 'en' }: { practices: Practice[]; lang?: Lang }) => {
  const weekly = TRAINING.weekly;
  return (
    <section className="py-20 sm:py-28" aria-labelledby="practice-heading">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <p className="eyebrow mb-3">{tr(lang, { en: 'Train with us', cs: 'Trénujte s námi' })}</p>
            <h2 id="practice-heading" className="h-section">
              {tr(lang, {
                en: (
                  <>
                    Cricket training
                    <br />
                    in Prague
                  </>
                ),
                cs: (
                  <>
                    Kriketové tréninky
                    <br />
                    v Praze
                  </>
                ),
              })}
            </h2>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted">
              {tr(lang, {
                en: `We usually train on Thursdays from 17:00 to 19:00 in the cricket nets at ${weekly.venue.name} in Žižkov, Prague 3. In winter we move indoors to VŠE sportovní hala Na Třebešíně, Sportovní hala Radotín and Olšanská. Beginners and experienced players are both welcome.`,
                cs: 'Trénujeme obvykle ve čtvrtek od 17:00 do 19:00 v kriketových sítích v Tenisovém centru Olšanská v Praze 3 na Žižkově. V zimě se přesouváme do hal: do sportovní haly VŠE Na Třebešíně, do Sportovní haly Radotín a na Olšanskou. Vítáme začátečníky i zkušené hráče.',
              })}
            </p>
          </Reveal>

          <div className="mt-8 flex flex-col gap-3">
            {practices.length === 0 ? (
              <div className="card border-dashed p-6 text-muted">
                {tr(lang, {
                  en: (
                    <>
                      No extra sessions on the calendar right now.{' '}
                      <Link href={localePath(lang, '/join')} className="font-semibold text-gold hover:text-gold-hi">
                        Get in touch
                      </Link>{' '}
                      and we&apos;ll tell you when the next one is.
                    </>
                  ),
                  cs: (
                    <>
                      V kalendáři teď nejsou žádné další tréninky.{' '}
                      <Link href={localePath(lang, '/join')} className="font-semibold text-gold hover:text-gold-hi">
                        Ozvěte se nám
                      </Link>{' '}
                      a dáme vám vědět, kdy bude ten příští.
                    </>
                  ),
                })}
              </div>
            ) : (
              practices.map((practice, i) => (
                <Reveal key={practice.id} delay={i * 70}>
                  <PracticeRow practice={practice} lang={lang} />
                </Reveal>
              ))
            )}
          </div>

          <Reveal delay={150} className="mt-8">
            <Link href={localePath(lang, '/practices')} className="link-arrow">
              {tr(lang, { en: 'Full practice calendar', cs: 'Celý kalendář tréninků' })} <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={120} className="zoom-frame relative aspect-[4/5] overflow-hidden sm:aspect-[4/3] lg:aspect-[4/5]">
          <Image
            src="/story2.jpeg"
            alt={tr(lang, {
              en: 'Spartans players in whites with a trophy after an indoor tournament',
              cs: 'Hráči Spartans v bílém s trofejí po halovém turnaji',
            })}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>
      </div>
    </section>
  );
};

export default PracticeSection;
