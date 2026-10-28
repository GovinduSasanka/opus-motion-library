import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {AGENTS, ARMY_CENTERS, Faction, IsoGrid, armyBlock, h01, iso2, lin, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x6 tactical-map: the "HUD OFF" symbolic view of the battle — a near-black plane with a faint isometric grid,
 * each army a cluster of flat coloured glyphs (circles = infantry, triangles = archers, hexes = cavalry), thin
 * white selection rectangles that resample every few frames, faint dashed link lines between commanders and
 * targets, and small floating command boxes. Horizontal glitch bands on entry and periodically after.
 */
type Props = {
  background: string;
  factions: Faction[];
  unitsPerArmy: number;
  march: number;
  grid: boolean;
  links: boolean;
  selections: number;
  glitchAt: number[];
  commandBox: string;
  seed: number;
};

const hexPath = (r: number) => {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
  }
  return d + 'Z';
};

const TacticalMap: React.FC<Props> = ({background, factions, unitsPerArmy, march, grid, links, selections, glitchAt, commandBox, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const k = portrait ? w * 0.052 : w * 0.034;
  const ox = w / 2;
  const oy = h * 0.48;
  const fs = factions.slice(0, 4);
  const gs = k * 0.013 * 600;
  void gs;
  // glitch bands: displace horizontal slices for ~5 frames around each glitchAt
  let glitch = 0;
  for (const g of glitchAt) {
    const d = frame - g;
    if (d >= 0 && d < 5) glitch = 1 - d / 5;
  }
  const bandShift = (y: number) => (glitch > 0 ? (h01(Math.floor(y / (26 * u)), Math.floor(frame / 2), seed) - 0.5) * glitch * w * 0.05 : 0);
  const glyphs: React.ReactNode[] = [];
  const cmdPts: [number, number, string][] = [];
  fs.forEach((f, fi) => {
    const units = armyBlock(seed * 13 + fi, unitsPerArmy, 12);
    const [cx0, cy0] = ARMY_CENTERS[fi % 4];
    const len = Math.hypot(cx0, cy0);
    const adv = Math.min(2.2, march * t);
    const bx = cx0 - (cx0 / len) * adv;
    const by = cy0 - (cy0 / len) * adv;
    const col = f.chip === '#141227' ? '#8D8AB8' : f.chip;
    units.forEach((un, ui) => {
      const drift = 0.15 * Math.sin(t * 0.8 + un.ph);
      const [sx, sy] = iso2(bx + un.gx + drift * 0.3, by + un.gy + drift, 0, k, ox, oy);
      const r = k * (0.1 + 0.05 * h01(ui, fi, 3));
      const op = 0.85;
      if (un.type === 1) glyphs.push(<path key={`g${fi}-${ui}`} d={`M${sx} ${sy - r * 1.2} L${sx + r} ${sy + r * 0.8} L${sx - r} ${sy + r * 0.8}Z`} fill={col} opacity={op} />);
      else if (un.type === 2) glyphs.push(<path key={`g${fi}-${ui}`} d={hexPath(r * 1.2)} transform={`translate(${sx} ${sy})`} fill={col} opacity={op} />);
      else glyphs.push(<circle key={`g${fi}-${ui}`} cx={sx} cy={sy} r={r} fill={col} opacity={op} />);
    });
    const [hx, hy] = iso2(bx, by, 0, k, ox, oy);
    cmdPts.push([hx, hy, col]);
  });
  const fsz = 11 * u * (portrait ? 1.4 : 1);
  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <filter id={`tm-noise-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={seed} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0" />
        </filter>
        <rect width={w} height={h} filter={`url(#tm-noise-${seed})`} />
        <g transform={glitch > 0 ? `translate(${bandShift(oy)} 0)` : undefined}>
          {grid ? <IsoGrid w={w} h={h} k={k * 1.2} ox={ox} oy={oy} color="#1A1A2A" sw={1 * u} n={24} /> : null}
          {glyphs}
          {/* selection rectangles, resampled every 4 frames */}
          {Array.from({length: selections}, (_, i) => {
            const step = Math.floor(frame / 4);
            const fi = i % fs.length;
            const [cx0, cy0] = ARMY_CENTERS[fi % 4];
            const len = Math.hypot(cx0, cy0);
            const adv = Math.min(2.2, march * t);
            const [sx, sy] = iso2(cx0 - (cx0 / len) * adv + (h01(i, step, 1) - 0.5) * 2, cy0 - (cy0 / len) * adv + (h01(i, step, 2) - 0.5) * 2, 0, k, ox, oy);
            const bw = k * (1.5 + 2 * h01(i, step, 3));
            const bh = k * (1 + 1.4 * h01(i, step, 4));
            return <rect key={`s${i}`} x={sx - bw / 2} y={sy - bh / 2} width={bw} height={bh} fill="none" stroke="#fff" strokeWidth={1 * u} opacity={0.7} />;
          })}
          {/* dashed command links */}
          {links
            ? cmdPts.map(([x1, y1], i) => {
                const [x2, y2] = cmdPts[(i + 1) % cmdPts.length];
                return <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={1 * u} strokeDasharray={`${4 * u} ${6 * u}`} opacity={0.3} />;
              })
            : null}
          {/* floating command box */}
          {commandBox
            ? (() => {
                const [x, y, col] = cmdPts[2 % cmdPts.length];
                const bw = commandBox.length * fsz * 0.62 + fsz * 2;
                const kIn = lin(frame, 20, 28);
                return (
                  <g opacity={0.85 * kIn}>
                    <rect x={x - bw / 2} y={y + k * 1.6} width={bw} height={fsz * 2} fill="#0B0E16" stroke={col} strokeWidth={1 * u} opacity={0.9} />
                    <text x={x} y={y + k * 1.6 + fsz * 1.3} textAnchor="middle" fontFamily={x58Fonts.mono} fontSize={fsz} fill="#DDE2F0">
                      {commandBox}
                    </text>
                    <path d={`M${x} ${y + k * 1.2} l${-4 * u} ${6 * u} h${8 * u}Z`} fill={col} />
                  </g>
                );
              })()
            : null}
        </g>
        {/* glitch slice overlay */}
        {glitch > 0
          ? Array.from({length: 7}, (_, i) => {
              const y = h01(i, Math.floor(frame / 2), seed + 5) * h;
              const bh = (6 + 20 * h01(i, 8)) * u;
              return <rect key={i} x={bandShift(y)} y={y} width={w} height={bh} fill="#fff" opacity={0.06} />;
            })
          : null}
      </svg>
    </AbsoluteFill>
  );
};

export const tacticalMap = defineMotion<Props>({
  id: 'tactical-map',
  title: 'Tactical map',
  category: 'game',
  description:
    'A "HUD OFF" symbolic battle view: coloured glyph clusters (circles, triangles, hexagons) drift on a near-black isometric grid with stepped white selection rectangles, dashed command links, a floating command box and horizontal glitch bands on entry.',
  source: ['video x6 36.13-37.13 s, 47.10-47.35 s (tactical view)', 'video x6 40.10-40.25 s (tactical flash)'],
  useFor: 'Abstract strategy diagrams, "simulation view" of any system, a data-overlay twin of a scene (pairs with army-formation).',
  durationInFrames: 150,
  defaultProps: {
    background: '#030309',
    factions: AGENTS,
    unitsPerArmy: 96,
    march: 0.3,
    grid: true,
    links: true,
    selections: 3,
    glitchAt: [0, 70, 140],
    commandBox: 'CMD GRD: HOLD LINE',
    seed: 6,
  },
  propDocs: {
    background: 'near-black plane colour',
    factions: 'up to 4 armies (chip colour is used for the glyphs)',
    unitsPerArmy: 'glyphs per cluster',
    march: 'ground units per second the clusters drift inwards',
    grid: 'faint isometric grid lines',
    links: 'dashed command links between cluster leads',
    selections: 'number of stepped white selection rectangles',
    glitchAt: 'frames with a horizontal glitch-band burst',
    commandBox: 'text of the floating command box ("" = none)',
    seed: 'layout seed (match army-formation for an exact HUD-ON/OFF pair)',
  },
  component: TacticalMap,
  tags: ['tactical', 'map', 'simulation', 'glyphs', 'grid', 'isometric', 'data view', 'strategy', 'abstract', 'hud off', 'glitch', 'game', 'ai'],
});
