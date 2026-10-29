'use client';

import type { IndoorRules, Zone } from '@/lib/indoor/rules';

// Top-down hall: far wall at the top, keeper wall at the bottom, side walls split into the
// halves the day's rules use. Tap the surface the ball hit first. Tap it again to clear.

const W = 300;
const H = 250;
const SIDE = 46;
const BAND = 30;

const LEFT = ['farLeftB', 'farLeft', 'farLeftA', 'nearLeft'];
const RIGHT = ['farRightB', 'farRight', 'farRightA', 'nearRight'];

type Box = { zone: Zone; x: number; y: number; w: number; h: number; vertical: boolean };

function layout(zones: Zone[]): { boxes: Box[]; top: number; bottom: number } {
  const on = zones.filter((z) => z.enabled);
  const far = on.filter((z) => z.area === 'farWall');
  const keeper = on.filter((z) => z.area === 'keeperWall');
  const top = Math.max(1, far.length) * BAND;
  const bottom = H - (keeper.length ? BAND : 12);
  const boxes: Box[] = [];
  far.forEach((zone, i) => boxes.push({ zone, x: 0, y: i * BAND, w: W, h: BAND - 2, vertical: false }));
  keeper.forEach((zone, i) => {
    const w = W / keeper.length;
    boxes.push({ zone, x: i * w, y: bottom + 2, w: w - 2, h: BAND - 2, vertical: false });
  });
  for (const [order, x] of [
    [LEFT, 0],
    [RIGHT, W - SIDE],
  ] as const) {
    const side = order.flatMap((a) => on.filter((z) => z.area === a));
    const len = (bottom - top - 2) / Math.max(1, side.length);
    side.forEach((zone, i) => boxes.push({ zone, x, y: top + 2 + i * len, w: SIDE, h: len - 2, vertical: true }));
  }
  return { boxes, top, bottom };
}

export default function Court({ rules, selected, onSelect }: { rules: IndoorRules; selected: string | null; onSelect: (id: string | null) => void }) {
  const { boxes, top, bottom } = layout(rules.zones);
  const pitchTop = top + 22;
  const pitchBottom = bottom - 22;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full select-none" role="group" aria-label="Court: tap the wall the ball hit first">
      <rect x={SIDE} y={top} width={W - SIDE * 2} height={bottom - top} className="fill-panel-2" />
      <rect x={W / 2 - 18} y={pitchTop} width={36} height={pitchBottom - pitchTop} className="fill-cream/[0.05]" />
      {[pitchTop + 14, pitchBottom - 14].map((y) => (
        <line key={y} x1={W / 2 - 26} x2={W / 2 + 26} y1={y} y2={y} className="stroke-cream/25" strokeWidth={1.5} />
      ))}
      {[pitchTop + 4, pitchBottom - 4].map((y) => (
        <g key={y} className="fill-cream/50">
          {[-6, 0, 6].map((dx) => (
            <rect key={dx} x={W / 2 + dx - 1} y={y - 5} width={2} height={10} />
          ))}
        </g>
      ))}
      <text x={W / 2} y={pitchBottom + 15} textAnchor="middle" className="fill-faint text-[10px] uppercase tracking-[0.2em]">
        Batter
      </text>

      {boxes.map(({ zone, x, y, w, h, vertical }) => {
        const on = zone.id === selected;
        const toggle = () => onSelect(on ? null : zone.id);
        return (
          <g
            key={zone.id}
            role="button"
            tabIndex={0}
            aria-pressed={on}
            aria-label={`${zone.label}, ${zone.runs} ${zone.runs === 1 ? 'run' : 'runs'}${zone.allowRunning ? '' : ', no running'}`}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
              }
            }}
            className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-gold [&:focus-visible>rect]:stroke-2"
          >
            <rect x={x} y={y} width={w} height={h} rx={3} className={on ? 'fill-gold' : 'fill-cream/[0.08] transition-colors duration-150 hover:fill-cream/[0.14]'} />
            {vertical ? (
              <>
                <text x={x + w / 2} y={y + h / 2 + 2} textAnchor="middle" dominantBaseline="middle" className={`font-varsity text-[22px] ${on ? 'fill-ink' : 'fill-cream'}`}>
                  {zone.runs}
                </text>
                {!zone.allowRunning && (
                  <text x={x + w / 2} y={y + h / 2 + 22} textAnchor="middle" className={`text-[8px] uppercase ${on ? 'fill-ink' : 'fill-muted'}`}>
                    no run
                  </text>
                )}
              </>
            ) : (
              <text x={x + w / 2} y={y + h / 2 + 1} textAnchor="middle" dominantBaseline="middle" className={`font-display text-[13px] font-bold uppercase italic ${on ? 'fill-ink' : 'fill-cream'}`}>
                {zone.label} {zone.runs}
                {zone.allowRunning ? '' : ', no run'}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
