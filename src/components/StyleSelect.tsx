'use client';

import { BATTING_STYLES, BOWLING_GROUPS, DOES_NOT_BOWL, isKnownStyle, normaliseStyle } from '@/lib/playerStyles';

// A dropdown of batting or bowling styles (src/lib/playerStyles.ts), used by the member
// dashboard and the admin player form. A saved value that is not on the list stays selectable,
// so nothing typed in the past disappears without the person noticing.
export default function StyleSelect({
  kind,
  id,
  value,
  onChange,
  className,
  disabled,
}: {
  kind: 'batting' | 'bowling';
  id: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
  disabled?: boolean;
}) {
  const current = normaliseStyle(value);
  const unknown = current && !isKnownStyle(current);
  return (
    <select id={id} className={className} value={current} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">Choose…</option>
      {unknown && <option value={current}>{current} (current)</option>}
      {kind === 'batting' ? (
        BATTING_STYLES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value}
          </option>
        ))
      ) : (
        <>
          {BOWLING_GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={DOES_NOT_BOWL.value}>{DOES_NOT_BOWL.value}</option>
        </>
      )}
    </select>
  );
}
