'use client';

import { useEffect, useRef, useState } from 'react';

type CountUpProps = {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
};

// Counts from `from` to `to` once on load. The server renders the final number,
// so search engines, no-JS visitors and reduced-motion users always see it.
export default function CountUp({ to, from = 0, duration = 1600, delay = 0 }: CountUpProps) {
  const [value, setValue] = useState(to);
  const frame = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setValue(from);
    let start = 0;
    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        // ease-out-expo, matching the CSS motion token
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setValue(Math.round(from + (to - from) * eased));
        if (t < 1) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame.current);
    };
  }, [to, from, duration, delay]);

  return <span className="tabular-nums">{value}</span>;
}
