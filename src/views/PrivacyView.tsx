import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { CLUB_EMAIL, CLUB_NAME } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs } from '@/lib/structured';
import PageHero from '@/components/ui/PageHero';
import JsonLd from '@/components/JsonLd';

// Shared by /privacy (English) and /cs/privacy (Czech). Keep in step with what the site actually collects.

const UPDATED = { en: '29 October 2026', cs: '29. října 2026' };

export function privacyMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/privacy',
    title: tr(lang, { en: 'Privacy notice', cs: 'Ochrana osobních údajů' }),
    description: tr(lang, {
      en: 'How Prague Spartans Cricket Club collects, uses and protects personal data from the join form, member accounts and this website.',
      cs: 'Jak kriketový klub Prague Spartans shromažďuje, používá a chrání osobní údaje z přihlášky, členských účtů a tohoto webu.',
    }),
  });
}

const mail = (
  <a href={`mailto:${CLUB_EMAIL}`} className="text-gold hover:text-gold-hi">
    {CLUB_EMAIL}
  </a>
);

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-cream/12 py-8">
      <h2 className="h-sub text-[26px] sm:text-[30px]">{title}</h2>
      <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-sand [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyView({ lang }: { lang: Lang }) {
  const label = tr(lang, { en: 'Privacy notice', cs: 'Ochrana osobních údajů' });
  const cs = lang === 'cs';

  return (
    <>
      <JsonLd data={breadcrumbs(lang, [[label, '/privacy']])} />
      <PageHero
        compact
        eyebrow={tr(lang, { en: 'Your data', cs: 'Vaše údaje' })}
        title={label}
        intro={tr(lang, {
          en: `${CLUB_NAME} collects only what it needs to run the club. This page explains what that is, why we keep it and how to ask us to change or delete it.`,
          cs: `${CLUB_NAME} shromažďuje jen údaje, které potřebuje k chodu klubu. Na této stránce vysvětlujeme, o jaké údaje jde, proč je uchováváme a jak nás můžete požádat o jejich opravu nebo smazání.`,
        })}
      />

      <div className="container-x max-w-3xl pb-20 pt-6">
        <p className="text-[15px] text-muted">{tr(lang, { en: `Last updated ${UPDATED.en}`, cs: `Naposledy upraveno ${UPDATED.cs}` })}</p>

        <Block title={tr(lang, { en: 'Who is responsible', cs: 'Kdo za údaje odpovídá' })}>
          <p>
            {cs ? (
              <>Správcem údajů je {CLUB_NAME}, kriketový klub v Praze. Ve všech věcech ochrany údajů nás kontaktujte na {mail}.</>
            ) : (
              <>The data controller is {CLUB_NAME}, a cricket club in Prague. For anything about your data, email us at {mail}.</>
            )}
          </p>
        </Block>

        <Block title={tr(lang, { en: 'What we collect and why', cs: 'Jaké údaje shromažďujeme a proč' })}>
          <ul>
            <li>
              {tr(lang, {
                en: 'Join form: your name, email, age, where you are based, your cricket experience and playing role. We use them to answer you and invite you to training.',
                cs: 'Přihláška: jméno, e-mail, věk, místo pobytu, zkušenosti s kriketem a herní role. Používáme je k odpovědi a pozvání na trénink.',
              })}
            </li>
            <li>
              {tr(lang, {
                en: 'Member account: your name, email, a password (stored only in encrypted form), your CricHeroes profile link, your match availability and training replies, and any photo or player details you add. We use them to organise teams and keep members informed.',
                cs: 'Členský účet: jméno, e-mail, heslo (uložené jen v zašifrované podobě), odkaz na profil CricHeroes, dostupnost na zápasy, odpovědi na tréninky a fotka či údaje hráče, pokud je doplníte. Používáme je k sestavování týmů a informování členů.',
              })}
            </li>
            <li>
              {tr(lang, {
                en: 'Player profiles: the name, photo, role and short bio of squad players appear on the public site. Ask us at any time to change or remove yours.',
                cs: 'Profily hráčů: jméno, fotka, role a krátký popis hráčů jsou na veřejném webu. Kdykoli nás můžete požádat o úpravu nebo odstranění svého profilu.',
              })}
            </li>
            <li>
              {tr(lang, {
                en: 'Club emails: notices and replies are sent from the club Gmail account to members and applicants.',
                cs: 'E-maily klubu: oznámení a odpovědi posíláme členům a zájemcům z klubového účtu Gmail.',
              })}
            </li>
          </ul>
          <p>
            {tr(lang, {
              en: 'The legal basis is your request to join or your membership (taking steps for, and carrying out, our agreement with you) and the club’s legitimate interest in running its teams.',
              cs: 'Právním základem je vaše žádost o členství nebo samotné členství (kroky k uzavření a plnění dohody s vámi) a oprávněný zájem klubu na organizaci týmů.',
            })}
          </p>
        </Block>

        <Block title={tr(lang, { en: 'Cookies and analytics', cs: 'Cookies a statistiky' })}>
          <p>
            {tr(lang, {
              en: 'We use no advertising or tracking cookies. Signed-in members get a login cookie that is needed for the member area. Visitor numbers come from Vercel Web Analytics, which counts page views without cookies and without identifying you. YouTube videos load only when you press play, from YouTube’s privacy-enhanced domain.',
              cs: 'Nepoužíváme reklamní ani sledovací cookies. Přihlášení členové dostanou přihlašovací cookie, bez které členská sekce nefunguje. Návštěvnost měříme pomocí Vercel Web Analytics, která počítá zobrazení stránek bez cookies a bez vaší identifikace. Videa z YouTube se načtou až po stisknutí tlačítka přehrát, a to z domény YouTube se zvýšenou ochranou soukromí.',
            })}
          </p>
        </Block>

        <Block title={tr(lang, { en: 'Where it is stored', cs: 'Kde jsou údaje uložené' })}>
          <ul>
            <li>
              {tr(lang, {
                en: 'Supabase: our database and member logins, hosted in Frankfurt, Germany.',
                cs: 'Supabase: databáze a přihlašování členů, servery ve Frankfurtu v Německu.',
              })}
            </li>
            <li>
              {tr(lang, {
                en: 'Vercel: hosts this website. Some requests may be processed in the United States.',
                cs: 'Vercel: hostuje tento web. Některé požadavky mohou být zpracovány ve Spojených státech.',
              })}
            </li>
            <li>
              {tr(lang, {
                en: 'Google: the club Gmail account sends our emails, and gallery photos are served from Google Drive.',
                cs: 'Google: z klubového účtu Gmail odesíláme e-maily a fotky v galerii se načítají z Google Drive.',
              })}
            </li>
          </ul>
          <p>
            {tr(lang, {
              en: 'We never sell your data or share it for marketing.',
              cs: 'Vaše údaje nikdy neprodáváme ani je nesdílíme pro marketing.',
            })}
          </p>
        </Block>

        <Block title={tr(lang, { en: 'How long we keep it', cs: 'Jak dlouho údaje uchováváme' })}>
          <p>
            {tr(lang, {
              en: 'We keep applications only as long as we need them to arrange your first session and membership, and member data while you are a member. When you leave or ask us, we delete it, apart from anything we must keep by law.',
              cs: 'Přihlášky uchováváme jen po dobu potřebnou k domluvě prvního tréninku a členství, údaje členů po dobu členství. Když odejdete nebo nás o to požádáte, údaje smažeme, s výjimkou toho, co musíme uchovat ze zákona.',
            })}
          </p>
        </Block>

        <Block title={tr(lang, { en: 'Your rights', cs: 'Vaše práva' })}>
          <p>
            {tr(lang, {
              en: 'You can ask to see, correct or delete your data, to limit how we use it, to object, or to get a copy. Email us and we will reply within one month.',
              cs: 'Můžete požádat o přístup ke svým údajům, jejich opravu nebo smazání, omezení zpracování, vznést námitku nebo získat jejich kopii. Napište nám a odpovíme do jednoho měsíce.',
            })}
          </p>
          <p>
            {cs ? (
              <>
                Pokud nejste spokojeni, můžete podat stížnost u{' '}
                <a href="https://uoou.gov.cz" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-hi">
                  Úřadu pro ochranu osobních údajů
                </a>
                .
              </>
            ) : (
              <>
                If you are not satisfied, you can complain to the Czech data protection authority,{' '}
                <a href="https://uoou.gov.cz" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-hi">
                  Úřad pro ochranu osobních údajů
                </a>
                .
              </>
            )}
          </p>
        </Block>

        <p className="border-t border-cream/12 pt-8 text-sand">
          {cs ? (
            <>
              Pravidla pro ochranu dětí a mládeže najdete na stránce{' '}
              <Link href={localePath(lang, '/safeguarding')} className="text-gold hover:text-gold-hi">
                Bezpečí dětí a pravidla chování
              </Link>
              .
            </>
          ) : (
            <>
              Our rules for keeping young players safe are on the{' '}
              <Link href={localePath(lang, '/safeguarding')} className="text-gold hover:text-gold-hi">
                safeguarding and code of conduct
              </Link>{' '}
              page.
            </>
          )}
        </p>
      </div>
    </>
  );
}
