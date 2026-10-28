import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from '@/components/ui/Icons';

export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-64px)] items-center lg:min-h-[calc(100svh-152px)] overflow-hidden">
      <Image src="/home_carouse2.jpeg" alt="" fill priority sizes="100vw" className="kenburns -z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-ink/85" />
      <div className="container-x py-20">
        <p className="eyebrow rise mb-4" style={{ ['--d' as string]: '60ms' }}>
          Error 404
        </p>
        <h1 className="display rise text-[clamp(56px,11vw,140px)]" style={{ ['--d' as string]: '140ms' }}>
          Out of <span className="text-gold">bounds</span>
        </h1>
        <p className="rise mt-6 max-w-lg text-lg text-sand" style={{ ['--d' as string]: '240ms' }}>
          That page has been hit for six. Let&apos;s get you back to the middle.
        </p>
        <div className="rise mt-8 flex flex-wrap gap-3" style={{ ['--d' as string]: '320ms' }}>
          <Link href="/" className="btn btn-gold btn-lg">
            Back to home
            <ArrowRight size={18} className="btn-arrow" />
          </Link>
          <Link href="/fixtures" className="btn btn-outline btn-lg">
            See fixtures
          </Link>
        </div>
      </div>
    </section>
  );
}
