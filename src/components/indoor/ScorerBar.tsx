import Image from 'next/image';
import Link from 'next/link';

// The scorer has no site menu, so its home screen gets a slim bar back to the website.
export default function ScorerBar() {
  return (
    <nav aria-label="Website" className="border-b border-cream/12">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="-ml-1 flex min-h-11 items-center gap-2.5 px-1 font-display text-lg font-bold uppercase italic leading-none hover:text-gold">
          <Image src="/brand/spartans-logo.png" alt="" width={99} height={120} className="h-9 w-auto" />
          Prague Spartans
        </Link>
        <Link href="/dashboard" className="min-h-11 content-center px-2 font-display text-sm font-bold uppercase italic text-muted hover:text-cream">
          My dashboard
        </Link>
      </div>
    </nav>
  );
}
