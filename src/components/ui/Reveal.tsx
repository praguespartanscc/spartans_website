'use client';

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

// One observer shared by every <Reveal> on the page keeps scrolling cheap.
let sharedObserver: IntersectionObserver | null = null;

function getObserver() {
  if (sharedObserver || typeof window === 'undefined') return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          sharedObserver?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  return sharedObserver;
}

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
};

export default function Reveal({ children, as: Tag = 'div', delay = 0, className = '', style, id }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    const observer = getObserver();
    if (!el || !observer) return;
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${className}`}
      style={{ ...style, ['--d' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
