import Image from 'next/image';
import type { Sponsor } from '@/types/supabase';
import { isOptimisable } from '@/lib/images';

// Logos sit on a white tile so dark and coloured logos all read clearly.
export default function SponsorLogo({ sponsor, height = 96 }: { sponsor: Sponsor; height?: number }) {
  return (
    <span className="flex w-full items-center justify-center bg-cream p-4" style={{ height }}>
      {sponsor.logo_url ? (
        <Image
          src={sponsor.logo_url}
          alt={sponsor.name}
          width={240}
          height={height}
          unoptimized={!isOptimisable(sponsor.logo_url)}
          className="h-full w-auto object-contain transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
        />
      ) : (
        <span className="h-sub text-[22px] text-ink">{sponsor.name}</span>
      )}
    </span>
  );
}
