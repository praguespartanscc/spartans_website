import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';

export default function NotFoundContent({ lang }: { lang: Lang }) {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-64px)] items-center overflow-hidden lg:min-h-[calc(100svh-152px)]">
      <Image src="/home_carouse2.jpeg" alt="" fill priority sizes="100vw" className="kenburns -z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-ink/85" />
      <div className="container-x py-20">
        <p className="eyebrow rise mb-4" style={{ ['--d' as string]: '60ms' }}>
          {tr(lang, { en: 'Error 404', cs: 'Chyba 404' })}
        </p>
        <h1 className="display rise text-[clamp(56px,11vw,140px)]" style={{ ['--d' as string]: '140ms' }}>
          {tr(lang, {
            en: (
              <>
                Out of <span className="text-gold">bounds</span>
              </>
            ),
            cs: (
              <>
                Mimo <span className="text-gold">hřiště</span>
              </>
            ),
          })}
        </h1>
        <p className="rise mt-6 max-w-lg text-lg text-sand" style={{ ['--d' as string]: '240ms' }}>
          {tr(lang, {
            en: "That page has been hit for six. Let's get you back to the middle.",
            cs: 'Tahle stránka letěla za hranici hřiště. Vraťme se zpátky do hry.',
          })}
        </p>
        <div className="rise mt-8 flex flex-wrap gap-3" style={{ ['--d' as string]: '320ms' }}>
          <Link href={localePath(lang, '/')} className="btn btn-gold btn-lg">
            {tr(lang, { en: 'Back to home', cs: 'Zpět na úvod' })}
            <ArrowRight size={18} className="btn-arrow" />
          </Link>
          <Link href={localePath(lang, '/fixtures')} className="btn btn-outline btn-lg">
            {tr(lang, { en: 'See fixtures', cs: 'Zápasy' })}
          </Link>
        </div>
      </div>
    </section>
  );
}
