// Adapted from lemo-opuscar/styles/papercut-red/demo/tuanhua.js (wedge × D4, outerR), demo/fold.js (flap, stack) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {D4, P, back, clamp, eio, eo, fitW, hash, lbf, lerp, pd, rosetteWedge, seg} from '../../core/r2-lb1-kit';

/**
 * Fold – cut – unfold window flower (团花): a square of red paper folds three times in snappy flaps (back side lighter,
 * stack edges darker) down to a 45° wedge; scissors trim a scalloped edge (the offcut drops) and cut motifs out as
 * holes; then the wedge unfolds in three quick snaps into an 8-fold round paper-cut that blooms with a warm flash and
 * slowly turns while red scraps flutter down. Folding uses the mirror trick: a flap = the base scaled by s along the
 * fold normal, s going +1 → −1.
 */

type Props = {
  color: string;
  backColor: string;
  paper: string;
  motifs: string[];
  title: string;
  titleColor: string;
  foldAt: number;
  cutAt: number;
  cutFrames: number;
  unfoldAt: number;
  spin: number;
  scraps: number;
  mode: 'full' | 'unfold-only' | 'static';
  background: string;
};

/** scale along unit normal n (through origin) by s, as an SVG matrix */
const normalScale = (nx: number, ny: number, s: number) => {
  const k = s - 1;
  return `matrix(${1 + k * nx * nx} ${k * nx * ny} ${k * nx * ny} ${1 + k * ny * ny} 0 0)`;
};

const PapercutRosette: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'papercut-rosette';
  const S = Math.min(w, h);
  const TR = S * (portrait ? 0.4 : 0.36);
  const cx = w / 2;
  const cy = h * (p.title ? (portrait ? 0.42 : 0.45) : 0.5);
  const wedge = React.useMemo(() => rosetteWedge(TR, p.motifs), [TR, p.motifs.join(',')]);
  const A = Math.PI / 4;
  const mode = p.mode;
  const fold = mode === 'full';
  // --- phase timings
  const F1 = p.foldAt;
  const foldK = (i: number) => (fold ? eio(seg(frame, F1 + i * 15, F1 + i * 15 + 13)) : 1);
  const cutStart = fold ? p.cutAt : -1000;
  const cutK = mode === 'static' ? 1 : fold ? seg(frame, cutStart, cutStart + p.cutFrames) : 1;
  const U0 = mode === 'static' ? -1000 : mode === 'unfold-only' ? 6 : p.unfoldAt;
  const unK = (i: number) => (mode === 'static' ? 1 : eo(seg(frame, U0 + i * 8, U0 + i * 8 + 7)));
  const bloomT = U0 + 24;
  const bloom = mode === 'static' ? 0 : frame >= bloomT ? Math.exp(-(frame - bloomT) / 6) * Math.sin(Math.min(Math.PI, ((frame - bloomT) / 10) * Math.PI)) : 0;
  const flash = mode === 'static' ? 0 : frame >= bloomT ? Math.exp(-(frame - bloomT) / 7) * 0.3 : 0;
  const spin = frame > bloomT ? (frame - bloomT) * p.spin : 0;
  const unfolding = mode !== 'full' || frame >= U0;
  const half = TR * 1.02; // half-side of the square sheet
  // folded wedge region (triangle) before trimming: (0,0),(half,0),(half,half) — note angle 0..45°
  const tri: P[] = [
    [0, 0],
    [half, 0],
    [half, half],
  ];
  const sq: P[] = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ];
  const halfBottom: P[] = [
    [-half, 0],
    [half, 0],
    [half, half],
    [-half, half],
  ];
  const quarter: P[] = [
    [0, 0],
    [half, 0],
    [half, half],
    [0, half],
  ];
  const stack = (pts: P[], n: number) =>
    Array.from({length: n}, (_, i) => <path key={i} d={pd(pts.map(([x, y]) => [x + (n - i) * 1.1 * u, y + (n - i) * 1.4 * u] as P))} fill={i % 2 ? '#9C1418' : '#B51A1C'} />);
  // the cut wedge shape (mask) — reveal holes progressively with the scissors
  const holesShown = Math.floor(wedge.holes.length * clamp((cutK - 0.35) / 0.65));
  const trimK = clamp(cutK / 0.35);
  // scissors position along the scallop edge, then hopping over the holes
  let sx = 0;
  let sy = 0;
  if (cutK < 0.35) {
    const a = A * trimK;
    const r = TR * (0.9 + 0.1 * Math.pow(Math.abs(Math.cos(8 * a)), 0.6));
    sx = Math.cos(a) * r;
    sy = Math.sin(a) * r;
  } else {
    const a = A * (0.2 + 0.6 * hash(holesShown, 3));
    const r = TR * (0.15 + 0.75 * (1 - (cutK - 0.35) / 0.65));
    sx = Math.cos(a) * r;
    sy = Math.sin(a) * r;
  }
  const wedgeMask = (key: string, holes: number, trim: number) => (
    <mask id={`${id}-${key}`} maskUnits="userSpaceOnUse" x={-TR * 1.5} y={-TR * 1.5} width={TR * 3} height={TR * 3}>
      {/* untrimmed triangle part beyond the scallop that has not been cut yet */}
      {trim < 1 && <path d={pd(tri)} fill="#fff" />}
      <path d={pd(wedge.outline)} fill="#fff" />
      {trim < 1 && (
        // the already-cut part of the offcut: everything outside the scallop up to angle A*trim is removed
        <path
          d={pd([[0, 0], ...Array.from({length: 21}, (_, i) => {
            const a = A * trim * (i / 20);
            return [Math.cos(a) * half * 1.5, Math.sin(a) * half * 1.5] as P;
          })])}
          fill="#000"
        />
      )}
      {trim < 1 && <path d={pd(wedge.outline)} fill="#fff" />}
      {wedge.holes.slice(0, holes).map((hd, i) => (
        <path key={i} d={hd} fill="#000" fillRule="evenodd" />
      ))}
    </mask>
  );
  // ---------- render phases
  let body: React.ReactNode = null;
  if (!unfolding) {
    const k1 = foldK(0);
    const k2 = foldK(1);
    const k3 = foldK(2);
    if (k3 <= 0 && k2 <= 0) {
      if (k1 < 1) {
        // fold 1: top half over bottom half (normal y)
        const s = Math.cos(Math.PI * k1);
        body = (
          <g>
            <path d={pd(halfBottom)} fill={p.color} />
            <path d={pd([[-half, -half], [half, -half], [half, 0], [-half, 0]])} fill={s > 0 ? p.color : p.backColor} transform={normalScale(0, 1, s)} />
          </g>
        );
      } else body = <g>{stack(halfBottom, 2)}<path d={pd(halfBottom)} fill={p.backColor} /></g>;
    } else if (k3 <= 0) {
      // fold 2: left half over right (normal x)
      const s = Math.cos(Math.PI * k2);
      body = (
        <g>
          {stack(quarter, 2)}
          <path d={pd(quarter)} fill={p.backColor} />
          <path d={pd([[-half, 0], [0, 0], [0, half], [-half, half]])} fill={s > 0 ? p.backColor : p.color} transform={normalScale(1, 0, s)} />
        </g>
      );
    } else if (k3 < 1 || frame < cutStart) {
      // fold 3: lower triangle of the quarter over the diagonal (normal (−1,1)/√2)
      const s = Math.cos(Math.PI * k3);
      const n = Math.SQRT1_2;
      body = (
        <g>
          {stack(tri, 4)}
          <path d={pd(tri)} fill={p.color} />
          <path d={pd([[0, 0], [half, half], [0, half]])} fill={s > 0 ? p.color : p.backColor} transform={normalScale(-n, n, s)} />
        </g>
      );
    } else {
      // cut phase: folded wedge with stack edges, holes appearing, offcut dropping
      const offDrop = seg(frame, cutStart + p.cutFrames * 0.35, cutStart + p.cutFrames * 0.35 + 18);
      body = (
        <g>
          <defs>{wedgeMask('cutm', holesShown, trimK)}</defs>
          <g mask={`url(#${id}-cutm)`}>
            {stack(tri, 6)}
            <path d={pd(tri)} fill={p.color} />
          </g>
          {offDrop > 0 && offDrop < 1 && (
            <g transform={`translate(${half * 0.4} ${offDrop * h * 0.8}) rotate(${offDrop * 70})`} opacity={1 - offDrop}>
              <path d={pd([[half * 0.6, 0], [half * 0.95, 0], [half * 0.95, half * 0.6]])} fill={p.color} />
            </g>
          )}
          {/* scissors */}
          {cutK < 1 && (
            <g transform={`translate(${sx} ${sy}) rotate(${-30})`}>
              {[-1, 1].map((sgn) => {
                const open = Math.abs(Math.sin(frame * 0.8)) * 14 * sgn;
                return (
                  <g key={sgn} transform={`rotate(${open})`}>
                    <path d={`M0 0 L${-110 * u} ${-8 * u * sgn} L${-110 * u} ${4 * u * sgn} Z`} fill="#C9CFD4" stroke="#2A2A2E" strokeWidth={2 * u} />
                    <ellipse cx={-140 * u} cy={10 * u * sgn} rx={26 * u} ry={18 * u} fill="none" stroke="#2A2A2E" strokeWidth={9 * u} />
                  </g>
                );
              })}
            </g>
          )}
        </g>
      );
    }
  } else {
    // unfold: wedge → quarter → half → full, each flap = mirror image with scale s (+1 folded → −1 open)
    const k1 = unK(0);
    const k2 = unK(1);
    const k3 = unK(2);
    const W = (key: string) => (
      <g key={key}>
        <use href={`#${id}-w`} />
      </g>
    );
    const quarterG = (kk: number) => (
      <g>
        {W('a')}
        <g transform={normalScale(-Math.SQRT1_2, Math.SQRT1_2, Math.cos(Math.PI * kk))} opacity={kk > 0 ? 1 : 0}>
          {W('b')}
        </g>
      </g>
    );
    // quarter covers angle 0..90°; half = quarter + mirror across x=0 (normal x); full = half + mirror across y=0
    const halfG = (kk: number) => (
      <g>
        {quarterG(1)}
        <g transform={normalScale(1, 0, Math.cos(Math.PI * kk))} opacity={kk > 0 ? 1 : 0}>
          {quarterG(1)}
        </g>
      </g>
    );
    const full = (
      <g>
        {halfG(1)}
        <g transform={normalScale(0, 1, Math.cos(Math.PI * k3))} opacity={k3 > 0 ? 1 : 0}>
          {halfG(1)}
        </g>
      </g>
    );
    body =
      k3 >= 1 ? (
        <g transform={`rotate(${spin}) scale(${1 + 0.06 * bloom})`}>
          {D4.map((tf, i) => (
            <use key={i} href={`#${id}-w`} transform={tf} />
          ))}
        </g>
      ) : k2 >= 1 || k3 > 0 ? (
        full
      ) : k1 >= 1 || k2 > 0 ? (
        halfG(k2)
      ) : (
        quarterG(k1)
      );
  }
  // scraps
  const scrapEls: React.ReactNode[] = [];
  if (mode !== 'static') {
    for (let i = 0; i < p.scraps; i++) {
      const t0 = U0 + 20 + hash(i, 1, 9) * 40;
      const tt = (frame - t0) / 30;
      if (tt < 0) continue;
      const x = cx + (hash(i, 2, 9) - 0.5) * w * 0.9 + Math.sin(tt * 3 + i) * 30 * u;
      const y = -40 * u + tt * (120 + hash(i, 3, 9) * 140) * u + hash(i, 4, 9) * h * 0.3;
      if (y > h + 40 * u) continue;
      const s = (10 + hash(i, 5, 9) * 14) * u;
      const r = tt * 200 * (hash(i, 6, 9) - 0.5) * 3;
      scrapEls.push(
        <path key={i} d={pd([[0, -s], [s * 0.8, s * 0.6], [-s * 0.8, s * 0.6]])} fill={hash(i, 7, 9) > 0.4 ? p.color : p.backColor} transform={`translate(${x} ${y}) rotate(${r}) scale(1 ${Math.cos(tt * 5 + i)})`} />,
      );
    }
  }
  const titleK = p.title ? eo(seg(frame, bloomT + 10, bloomT + 24)) : 0;
  const tSize = fitW(p.title, (portrait ? 78 : 84) * u, w * 0.84, 'fraunces');
  return (
    <AbsoluteFill style={{background: p.background === 'paper' ? p.paper : p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          {wedgeMask('wm', wedge.holes.length, 1)}
          <g id={`${id}-w`}>
            <path d={pd(wedge.outline)} fill={p.color} mask={`url(#${id}-wm)`} />
          </g>
          <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx={2.6 * u} dy={3.6 * u} stdDeviation={4 * u} floodColor="#34060A" floodOpacity={0.45} />
          </filter>
          <radialGradient id={`${id}-fl`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFF6D6" stopOpacity={1} />
            <stop offset="1" stopColor="#FFF6D6" stopOpacity={0} />
          </radialGradient>
          <filter id={`${id}-fib`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={0.012 / u} numOctaves={3} seed={9} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.09 0" />
          </filter>
        </defs>
        <rect width={w} height={h} filter={`url(#${id}-fib)`} />
        {flash > 0 && <circle cx={cx} cy={cy} r={TR * 2} fill={`url(#${id}-fl)`} opacity={flash} />}
        <g transform={`translate(${cx} ${cy})`} filter={`url(#${id}-sh)`}>
          {body}
        </g>
        {scrapEls}
        {titleK > 0 && (
          <text x={cx} y={cy + TR + (portrait ? 150 : 110) * u} textAnchor="middle" fontFamily={lbf('fraunces')} fontWeight={800} fontSize={tSize} fill={p.titleColor} opacity={titleK} transform={`translate(0 ${(1 - titleK) * 20 * u})`}>
            {p.title}
          </text>
        )}
      </svg>
    </AbsoluteFill>
  );
};
void lerp;
void back;

export const papercutRosette = defineMotion<Props>({
  id: 'papercut-rosette',
  title: 'Papercut rosette (fold · cut · unfold)',
  category: 'shape',
  description:
    'A square of red paper folds three times in snappy flaps down to a wedge, scissors trim a scalloped edge and cut saw-tooth bands, crescents, slits and coins out as holes, then the wedge unfolds in three quick snaps into an 8-fold round window flower that blooms with a warm flash, turns slowly and sheds fluttering red scraps.',
  source: ['lemo-opuscar styles/papercut-red (MIT code, CC BY 4.0 docs, LemoLab) — demo/tuanhua.js, demo/fold.js, demo/motifs.js'],
  useFor: 'Lunar New Year and festive greetings, "one becomes many" metaphors, emblem / logo-style reveals, a slow decorative spinning backdrop (mode static).',
  durationInFrames: 210,
  defaultProps: {
    color: '#D2201F',
    backColor: '#DE3B30',
    paper: '#1C2446',
    motifs: ['saw', 'crescent', 'slit', 'coin', 'petal', 'dots'],
    title: 'Good Fortune',
    titleColor: '#FFF1D6',
    foldAt: 4,
    cutAt: 52,
    cutFrames: 60,
    unfoldAt: 122,
    spin: 0.12,
    scraps: 26,
    mode: 'full',
    background: 'paper',
  },
  propDocs: {
    color: 'paper red (front)',
    backColor: 'paper back side (lighter, shows on folded flaps)',
    paper: 'background paper colour when background is "paper"',
    motifs: 'cut motifs: saw, crescent, slit, coin, petal, dots',
    title: 'title under the rosette after the bloom ("" to hide)',
    titleColor: 'title colour',
    foldAt: 'frame the first fold starts',
    cutAt: 'frame the scissors start',
    cutFrames: 'length of the cutting phase',
    unfoldAt: 'frame the unfold starts',
    spin: 'slow spin after the bloom (deg/frame)',
    scraps: 'red paper scraps fluttering down',
    mode: '"full" (fold-cut-unfold), "unfold-only" or "static" (finished rosette, slow spin)',
    background: '"paper" or any colour / "transparent"',
  },
  component: PapercutRosette,
  tags: ['paper cut', 'rosette', 'window flower', 'lunar new year', 'chinese', 'fold', 'cut', 'unfold', 'scissors', 'red', 'festive', 'symmetry', 'kaleidoscope', 'emblem'],
});
