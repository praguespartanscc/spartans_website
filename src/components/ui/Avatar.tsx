import Image from 'next/image';
import { initials } from '@/lib/format';
import { isOptimisable } from '@/lib/images';

type AvatarProps = {
  name: string;
  src?: string | null;
  size: number;
  className?: string;
  tone?: 'gold' | 'dark' | 'red';
};

// Photo when there is one, otherwise the person's initials on a brand colour.
export default function Avatar({ name, src, size, className = '', tone = 'dark' }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        sizes={`${size}px`}
        unoptimized={!isOptimisable(src)}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const tones = {
    gold: 'bg-gold text-ink',
    red: 'bg-crimson text-white',
    dark: 'bg-panel-2 text-gold ring-1 ring-cream/10',
  };
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-extrabold ${tones[tone]} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials(name)}
    </span>
  );
}
