import Image from 'next/image';
import Link from 'next/link';
import type { PublicPlayer } from '@/lib/data';
import { PLAYER_TYPE_LABEL, PLAYER_TYPE_LABEL_CS } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { initials } from '@/lib/format';
import { isOptimisable } from '@/lib/images';

export function roleBadge(role?: string | null) {
  if (role === 'captain') return 'C';
  if (role === 'vice-captain') return 'VC';
  return null;
}

// Captain, then vice-captain, then everyone else (order otherwise kept).
export function sortLeadersFirst<T extends { role?: string | null }>(list: T[]): T[] {
  const rank = (r?: string | null) => (r === 'captain' ? 0 : r === 'vice-captain' ? 1 : 2);
  return [...list].sort((a, b) => rank(a.role) - rank(b.role));
}

// Squad-list card in the style of IPL / football club sites: tall photo, number, name, role.
export default function PlayerCard({ player, lang = 'en' }: { player: PublicPlayer; lang?: Lang }) {
  const badge = roleBadge(player.role);
  return (
    <Link
      href={localePath(lang, `/players/${player.slug}`)}
      className="group relative flex h-full flex-col overflow-hidden border border-cream/12 bg-panel transition-[transform,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:border-gold"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-panel-2 to-ink">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={player.name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 50vw"
            unoptimized={!isOptimisable(player.photo_url)}
            className="object-cover object-top transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center font-varsity text-[64px] text-cream/15 sm:text-[80px]"
          >
            {initials(player.name)}
          </span>
        )}
        {player.jersey_number != null && (
          <span className="absolute left-3 top-2 font-varsity text-[40px] leading-none text-gold drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            {player.jersey_number}
          </span>
        )}
        {badge && (
          <span className="absolute right-3 top-3 flex h-9 min-w-9 items-center justify-center bg-gold px-2 font-display text-[15px] font-extrabold text-ink">
            {badge}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <p className="h-sub text-[21px] leading-tight transition-colors group-hover:text-gold sm:text-[23px]">{player.name}</p>
        <p className="mt-1 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">
          {(lang === 'cs' ? PLAYER_TYPE_LABEL_CS : PLAYER_TYPE_LABEL)[player.player_type ?? ''] ?? tr(lang, { en: 'Player', cs: 'Hráč' })}
        </p>
      </div>
    </Link>
  );
}
