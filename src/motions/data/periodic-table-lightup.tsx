// Adapted from mg-styles-15/demos/19-paperclip/index.html (tiles / TP / USED) (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {hs, mixHex} from '../../core/r2-mg1-kit';
import {cl} from '../../core/r2-mg1b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Cell = {label: string; row: number; col: number};
type Props = {
  grid: 'periodic' | 'custom';
  cells: Cell[];
  lit: string;
  accent: string;
  order: 'sequence' | 'random' | 'by-row';
  stagger: number;
  startAt: number;
  accentAt: number;
  title: string;
  background: string;
  litColor: string;
  accentColor: string;
  seed: number;
};

const SYM =
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');

/** periodic layout: [row, col] for atomic number z (1-based); f-block rows 8.6 / 9.6 */
const place = (z: number): [number, number] => {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  if (z <= 4) return [2, z - 2];
  if (z <= 10) return [2, z + 8];
  if (z <= 12) return [3, z - 10];
  if (z <= 18) return [3, z - 0];
  if (z <= 36) return [4, z - 18];
  if (z <= 54) return [5, z - 36];
  if (z <= 56) return [6, z - 54];
  if (z <= 71) return [8.6, z - 54];
  if (z <= 86) return [6, z - 68];
  if (z <= 88) return [7, z - 86];
  if (z <= 103) return [9.6, z - 86];
  return [7, z - 100];
};
const PERIODIC: Cell[] = SYM.map((s, i) => {
  const [row, col] = place(i + 1);
  return {label: s, row, col};
});

const PeriodicTableLightup: React.FC<Props> = ({grid, cells, lit, accent, order, stagger, startAt, accentAt, title, background, litColor, accentColor, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, cx} = useStage();
  const all = grid === 'custom' && cells.length ? cells : PERIODIC;
  const key = JSON.stringify([all, lit, accent, order, seed, stagger, startAt, accentAt]);
  const plan = useMemo(() => {
    const litSet = new Set(lit.split(/\s+/).filter(Boolean));
    const accSet = new Set(accent.split(/\s+/).filter(Boolean));
    const idxOf = new Map(all.map((c, i) => [c.label, i]));
    const mk = (set: Set<string>) => {
      const arr = [...set].map((l) => idxOf.get(l)).filter((i): i is number => i !== undefined);
      if (order === 'random') arr.sort((a, b) => hs(a, seed) - hs(b, seed));
      else if (order === 'by-row') arr.sort((a, b) => all[a].row - all[b].row || all[a].col - all[b].col);
      else arr.sort((a, b) => a - b);
      return arr;
    };
    const L = mk(litSet);
    const A = mk(accSet).filter((i) => !litSet.has(all[i].label));
    const when = new Map<number, {f: number; acc: boolean}>();
    L.forEach((ci, k) => when.set(ci, {f: startAt + k * stagger, acc: false}));
    const a0 = Math.max(accentAt, startAt + L.length * stagger + 14);
    A.forEach((ci, k) => when.set(ci, {f: a0 + k * stagger * 2, acc: true}));
    return {when};
  }, [key]);
  const maxCol = Math.max(...all.map((c) => c.col));
  const maxRow = Math.max(...all.map((c) => c.row));
  const minRow = Math.min(...all.map((c) => c.row));
  const nCols = maxCol;
  const nRows = maxRow - minRow + 1;
  const tile = Math.min((w * 0.95) / nCols, (h * (portrait ? 0.62 : 0.9)) / (nRows * (portrait ? 1.7 : 1)));
  const tileY = portrait ? tile * 1.7 : tile;
  const x0 = cx - (nCols * tile) / 2;
  const topPad = portrait ? h * 0.3 : (h - nRows * tile) / 2;
  const y0 = topPad;
  const lightCount = all.filter((_, i) => {
    const wn = plan.when.get(i);
    return wn && frame >= wn.f;
  }).length;
  const sweep = ((frame - 40) % 90) / 90; // shimmer sweep after everything is lit
  const lastLit = Math.max(0, ...[...plan.when.values()].map((v) => v.f)) + 16;
  const shimmerOn = frame > lastLit ? cl((frame - lastLit) / 12) : 0;
  const sweepX = x0 + sweep * (nCols * tile * 1.6) - nCols * tile * 0.3;
  const total = all.length;
  const numSize = portrait ? 220 * u : tile * 1.9;
  // counter position: landscape sits in the empty gap (cols 3-12, rows 1-3); portrait above the table
  const cxn = portrait ? cx : x0 + tile * 7.6;
  const cyn = portrait ? h * 0.18 : y0 + tile * 2.42;
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        {all.map((c, i) => {
          const x = x0 + (c.col - 1) * tile;
          const y = y0 + (c.row - minRow) * tileY;
          const wn = plan.when.get(i);
          const on = !!wn && frame >= wn.f;
          const pop = wn ? prog(frame, wn.f, wn.f + 6, ease.out) : 0;
          const s = on ? 1.15 - 0.15 * pop : 1;
          const base = wn?.acc ? accentColor : litColor;
          let fill = on ? mixHex('#ffffff', base, Math.min(1, 0.4 + pop)) : '#F8FAFB';
          if (on && shimmerOn > 0) {
            const dxs = Math.abs(x + tile / 2 + (y - y0) * 0.35 - sweepX);
            const g = Math.exp(-((dxs / (tile * 2.2)) ** 2)) * 0.28 * shimmerOn;
            fill = mixHex(fill, '#ffffff', g);
          }
          const pad = tile * 0.045;
          const tx = x + tile / 2;
          const ty = y + tileY / 2;
          return (
            <g key={i} transform={`translate(${tx} ${ty}) scale(${s}) translate(${-tx} ${-ty})`}>
              <rect x={x + pad} y={y + pad} width={tile - pad * 2} height={tileY - pad * 2} rx={tile * 0.13} fill={fill} />
              {!on && <rect x={x + pad + u} y={y + pad + u} width={tile - pad * 2 - 2 * u} height={tileY - pad * 2 - 2 * u} rx={tile * 0.12} fill="none" stroke="#CDD6DE" strokeWidth={2 * u} />}
              <text
                x={tx}
                y={ty + tile * 0.13}
                textAnchor="middle"
                fontFamily={fonts.sans}
                fontWeight={on ? 800 : 600}
                fontSize={tile * (c.label.length > 2 ? 0.3 : 0.38) * (portrait ? 1.3 : 1)}
                fill={on ? '#fff' : '#9AA7B3'}
              >
                {c.label}
              </text>
              {grid === 'periodic' && tile > 46 && (
                <text x={x + pad + tile * 0.1} y={y + pad + tile * 0.24} fontFamily={fonts.mono} fontSize={tile * 0.15 * (portrait ? 1.3 : 1)} fill={on ? '#fff' : '#9AA7B3'} opacity={on ? 0.75 : 0.8}>
                  {i + 1}
                </text>
              )}
            </g>
          );
        })}
        {/* counter */}
        <g opacity={cl(frame / 12)}>
          <text x={cxn} y={portrait ? cyn - numSize * 0.78 : y0 + tile * 0.62} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={Math.max(18 * u, tile * 0.28)} letterSpacing={tile * 0.08} fill="#7A8794">
            {title}
          </text>
          <text x={cxn + numSize * 0.12} y={cyn + numSize * 0.28} textAnchor="end" fontFamily={fonts.grotesk} fontWeight={700} fontSize={numSize} fill={litColor} letterSpacing={-numSize * 0.03}>
            {lightCount}
          </text>
          <text x={cxn + numSize * 0.2} y={cyn + numSize * 0.28} textAnchor="start" fontFamily={fonts.grotesk} fontWeight={500} fontSize={numSize * 0.42} fill="#9AA7B3">
            /{total}
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const periodicTableLightup = defineMotion<Props>({
  id: 'periodic-table-lightup',
  title: 'Periodic table light-up',
  category: 'data',
  description:
    'The 118-element periodic table as rounded tiles; the chosen elements light up one per frame in ink with a pop, a second group lights in the accent colour, a big count-up "N /118" ticks beside the table, and a soft shimmer sweeps the lit tiles. Switch to a custom grid for any category matrix.',
  source: ['mg-styles-15 demos/19-paperclip/index.html tiles / TP / USED (MIT)'],
  useFor: '"How many X of Y" science and finance explainers and data storytelling (elements used in a phone, states served, features in a matrix).',
  durationInFrames: 240,
  defaultProps: {
    grid: 'periodic',
    cells: [],
    lit: 'H Li B C N O F Na Mg Al Si P S Cl K Ca Ti Cr Mn Fe Co Ni Cu Zn Ga Ge As Br Sr Y Zr Nb Mo Ag Sn Sb Te I Ba La Ce Pr Nd Gd Ta W Au Pb Bi',
    accent: 'Ru Rh Pd Pt Ir Os Re Eu Tb Dy Er',
    order: 'sequence',
    stagger: 1.1,
    startAt: 14,
    accentAt: 90,
    title: 'ELEMENTS IN USE',
    background: '#EEF1F4',
    litColor: '#25313D',
    accentColor: '#FF5A36',
    seed: 3,
  },
  propDocs: {
    grid: "'periodic' (built-in 118 layout) or 'custom' (use cells)",
    cells: 'custom grid cells [{label, row, col}] (col 1-based, row 1-based; fractional rows allowed)',
    lit: 'space-separated labels that light in ink',
    accent: 'space-separated labels that light in the accent colour afterwards',
    order: "'sequence' (grid order) | 'random' | 'by-row'",
    stagger: 'frames between tiles lighting',
    startAt: 'frame the first tile lights',
    accentAt: 'earliest frame the accent group starts',
    title: 'small caption above the counter',
    background: 'page colour',
    litColor: 'lit tile fill',
    accentColor: 'accent tile fill',
    seed: 'seed for random order',
  },
  component: PeriodicTableLightup,
  tags: ['periodic table', 'grid', 'light up', 'counter', 'count up', 'data storytelling', 'matrix', 'tiles', 'science', 'chemistry', 'how many'],
});
