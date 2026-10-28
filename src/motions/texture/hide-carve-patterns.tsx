// Adapted from lemo-opuscar/styles/shadow-puppet/demo/carve.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {LampCloth, Pt, back, carve, eo3, fx, h1, lf, mixHex, seg, tremor, useUid} from '../../core/r2-lb2-kit';

/**
 * The openwork vocabulary of shadow theatre as a sample board: crescent fish-scale holes, diamond lattice, coin holes
 * (a round hole leaving a square of hide), cloud scrolls, meander bands, bead lines, tapered rain slits and leaf holes.
 * Each piece of hide presses onto a lit cloth and is cut by a sweeping knife. The `carve.*` generators in
 * src/core/r2-lb2-kit.tsx return plain SVG path data, usable as black (= cut) in any mask.
 */
type Kind = 'scales' | 'lattice' | 'coins' | 'clouds' | 'meander' | 'beads' | 'slits' | 'leaves';
type Props = {
  patterns: Kind[];
  title: string;
  labels: boolean;
  hideColor: string;
  inkColor: string;
  startAt: number;
  stagger: number;
  seed: number;
};

const CW = 300;
const CH = 210;
const BX = 14;
const BY = 12;
const BW = CW - 28;
const BH = 160;

const holes = (kind: Kind, seed: number): {fill?: string; stroke?: string; sw?: number} => {
  switch (kind) {
    case 'scales':
      return {fill: carve.scales(BX + 10, BY + 10, BW - 20, BH - 20, 9)};
    case 'lattice':
      return {fill: carve.lattice(BX + 10, BY + 10, BW - 20, BH - 20, 19, 2.4)};
    case 'coins': {
      const c: Pt[] = [];
      for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) c.push([BX + 48 + q * 68 + (r % 2 ? 0 : 0), BY + 36 + r * 50]);
      return {fill: carve.coins(c, 21)};
    }
    case 'clouds':
      return {stroke: [carve.cloud(BX + 62, BY + 80, 36, 1), carve.cloud(BX + 130, BY + 80, 32, -1), carve.cloud(BX + 196, BY + 80, 36, 1)].join(' '), sw: 5};
    case 'meander':
      return {stroke: [carve.meander(BX + 14, BY + 34, BX + BW - 14, 7), carve.meander(BX + 14, BY + 80, BX + BW - 14, 7), carve.meander(BX + 14, BY + 126, BX + BW - 14, 7)].join(' '), sw: 3};
    case 'beads':
      return {
        fill: [0, 1, 2, 3].map((i) => carve.beads([[BX + 16, BY + 28 + i * 34], [BX + BW - 16, BY + 28 + i * 34]], 3.6 + (i % 2), 14)).join(' '),
      };
    case 'slits': {
      let d = '';
      for (let i = 0; i < 14; i++) {
        const x = BX + 18 + i * ((BW - 36) / 13) + (h1(i, seed) - 0.5) * 5;
        const len = 80 + h1(i + 4, seed) * 60;
        d += carve.taper([[x, BY + 12], [x - len * 0.12, BY + 12 + len * 0.5], [x - len * 0.25, BY + 12 + len]], 1.3, 7.5) + ' ';
      }
      return {fill: d};
    }
    default: {
      // leaf holes in a canopy
      let d = '';
      for (let i = 0; i < 34; i++) {
        const x = BX + 16 + h1(i, seed + 1) * (BW - 32);
        const y = BY + 16 + h1(i + 40, seed + 1) * (BH - 32);
        const a = (h1(i + 80, seed) - 0.5) * 2.4;
        const l = 11 + h1(i + 20, seed) * 7;
        const wd = 4.2 + h1(i + 60, seed) * 2;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const P = (px: number, py: number) => `${fx(x + px * ca - py * sa)},${fx(y + px * sa + py * ca)}`;
        d += `M${P(-l, 0)} Q${P(0, -wd * 2)} ${P(l, 0)} Q${P(0, wd * 2)} ${P(-l, 0)} Z `;
      }
      return {fill: d};
    }
  }
};

const HideCarvePatterns: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useUid('hcp');
  const n = p.patterns.length;
  const cols = portrait ? 2 : 4;
  const rows = Math.ceil(n / cols);
  const topPad = h * (portrait ? 0.13 : 0.16);
  const botPad = h * 0.05;
  const gx = w * 0.05;
  const availW = w - gx * 2;
  const availH = h - topPad - botPad;
  const s = Math.min(availW / (cols * CW + (cols - 1) * 26), availH / (rows * (CH + 34) + (rows - 1) * 10));
  const gridW = cols * CW * s + (cols - 1) * 26 * s;
  const gridH = rows * (CH + 34) * s + (rows - 1) * 10 * s;
  const x0 = (w - gridW) / 2;
  const y0 = topPad + (availH - gridH) / 2;
  const tr = tremor(frame, p.seed, 0.8);
  const lit = Math.min(1, seg(frame, 0, 12));
  const ink = p.inkColor;

  return (
    <AbsoluteFill style={{background: '#120805'}}>
      <Svg>
        <LampCloth
          w={w}
          h={h}
          u={u}
          lamps={[
            {x: w * 0.3, y: h * 0.5},
            {x: w * 0.7, y: h * 0.5},
          ]}
          level={[lit, lit]}
          frame={frame}
          id={`${id}c`}
          weave={1}
        />
        {p.title && (
          <text
            x={w / 2}
            y={topPad * 0.62}
            textAnchor="middle"
            fontFamily={lf('cormorant')}
            fontWeight={700}
            fontSize={(portrait ? 52 : 58) * u}
            letterSpacing={8 * u}
            fill={ink}
            opacity={seg(frame, 2, 14)}
          >
            {p.title.toUpperCase()}
          </text>
        )}
        {p.patterns.map((kind, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const at = p.startAt + i * p.stagger;
          const press = back(seg(frame, at, at + 12), 1.4);
          if (frame < at) return null;
          const cutP = eo3(seg(frame, at + 10, at + 34));
          const cx = x0 + col * (CW + 26) * s;
          const cy = y0 + row * (CH + 34 + 10) * s;
          const ht = holes(kind, p.seed + i);
          const mid = `${id}m${i}`;
          const reveal = BX + (BW + 8) * cutP;
          const sc = 0.88 + 0.12 * press;
          return (
            <g key={kind} opacity={seg(frame, at, at + 6)} transform={`translate(${fx(cx + tr.x * u)},${fx(cy + tr.y * u)}) scale(${fx(s * sc, 4)})`}>
              <defs>
                <mask id={mid} maskUnits="userSpaceOnUse" x={0} y={0} width={CW} height={CH}>
                  <rect x={0} y={0} width={CW} height={CH} fill="#fff" />
                  <clipPath id={`${mid}c`}>
                    <rect x={0} y={0} width={reveal} height={CH} />
                  </clipPath>
                  <g clipPath={`url(#${mid}c)`}>
                    {ht.fill && <path d={ht.fill} fill="#000" fillRule="evenodd" />}
                    {ht.stroke && <path d={ht.stroke} fill="none" stroke="#000" strokeWidth={ht.sw} strokeLinecap="round" />}
                  </g>
                </mask>
                <filter id={`${mid}h`} x="0" y="0" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.04 0.06" numOctaves={3} seed={i + 3} />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 1.1 -0.38" />
                </filter>
              </defs>
              <g mask={`url(#${mid})`}>
                <rect x={BX} y={BY} width={BW} height={BH} rx={16} fill={p.hideColor} />
                <rect x={BX} y={BY} width={BW} height={BH} rx={16} filter={`url(#${mid}h)`} style={{mixBlendMode: 'screen'}} opacity={0.5} />
              </g>
              <rect x={BX} y={BY} width={BW} height={BH} rx={16} fill="none" stroke={mixHex(p.hideColor, '#7a4a22', 0.5)} strokeWidth={2.2} />
              {/* knife line while cutting */}
              {cutP > 0 && cutP < 1 && <rect x={reveal - 1.5} y={BY + 2} width={3} height={BH - 4} fill="#ffe9b8" opacity={0.9} />}
              {p.labels && (
                <text x={CW / 2} y={BY + BH + 36} textAnchor="middle" fontFamily={lf('plex')} fontWeight={500} fontSize={17} letterSpacing={5} fill={ink} opacity={seg(frame, at + 14, at + 24)}>
                  {kind.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const hideCarvePatterns = defineMotion<Props>({
  id: 'hide-carve-patterns',
  title: 'Hide-carve patterns (openwork library)',
  category: 'texture',
  description:
    'The openwork vocabulary of shadow theatre on lit cloth: crescent fish-scale holes, diamond lattice, coin holes, cloud scrolls, meander bands, bead lines, tapered rain slits and leaf holes, each hide piece pressed on and cut by a sweeping knife.',
  source: ['lemo-opuscar styles/shadow-puppet demo/carve.js (MIT, LemoLab)'],
  useFor: 'Makes generated silhouettes (animals, buildings, logos) read as crafted lace instead of clip-art; the carve.* path generators (scales, lattice, coins, cloud, meander, taper, beads) in r2-lb2-kit are reusable for papercut and folk looks.',
  durationInFrames: 150,
  defaultProps: {
    patterns: ['scales', 'lattice', 'coins', 'clouds', 'meander', 'beads', 'slits', 'leaves'],
    title: 'Hide carving',
    labels: true,
    hideColor: '#1a100a',
    inkColor: '#2a1209',
    startAt: 8,
    stagger: 7,
    seed: 5,
  },
  propDocs: {
    patterns: "which cells to show: 'scales' | 'lattice' | 'coins' | 'clouds' | 'meander' | 'beads' | 'slits' | 'leaves'",
    title: 'heading (empty = none)',
    labels: 'pattern names under each piece',
    hideColor: 'hide colour',
    inkColor: 'label and heading colour',
    startAt: 'frame the first piece presses on',
    stagger: 'frames between pieces',
    seed: 'variation seed',
  },
  component: HideCarvePatterns,
  tags: ['pattern', 'carve', 'cut out', 'shadow puppet', 'openwork', 'lattice', 'scales', 'meander', 'cloud scroll', 'folk', 'papercut', 'texture', 'lace', 'backlit', 'hide'],
});
