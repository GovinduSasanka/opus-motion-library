// Adapted from lemo-opuscar styles/urban-sketch/demo/engine.js (arrivalField, compositor) + STYLE.md §8 (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {n2} from '../../core/random';
import {PaperFibreRect, catmull, cl, lerp, polyAt, polyTable, stepFrame, taperPoly, useUid, type Pt} from '../../core/r2-lb3a-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Source = {x: number; y: number; t: number; v?: number; R?: number; sy?: number; path?: [number, number][]; t1?: number};

type Props = {
  lineSrc: string;
  colorSrc: string;
  sources: Source[];
  amp: number;
  creep: number;
  floodAt: number;
  front: number;
  paper: string;
  ink: string;
  accent: string;
  walker: boolean;
  seed: number;
};

const FPS = 30;
const DW = 1000;
const DH = 620;
const CELL = 14;
const X0 = -100;
const Y0 = -100;
const COLS = Math.ceil((DW + 200) / CELL);
const ROWS = Math.ceil((DH + 200) / CELL);

/** hand-wobbled polyline → smooth path (design units) */
const sketch = (pts: Pt[], seed: number, closed = false, wob = 1.5): string => {
  const out: Pt[] = [];
  const n = pts.length + (closed ? 1 : 0);
  for (let i = 0; i < n - 1; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(1, Math.round(L / 22));
    for (let j = 0; j < k; j++) {
      const t = j / k;
      out.push([lerp(a[0], b[0], t) + n2(`sk${seed}x`, i * 3.1 + j, 0.3) * wob, lerp(a[1], b[1], t) + n2(`sk${seed}y`, i * 3.1 + j, 1.7) * wob]);
    }
  }
  out.push(closed ? out[0] : pts[pts.length - 1]);
  // overshoot the end a little
  return 'M' + out.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L');
};

const WashArrival: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const uid = useUid('wsh');
  const now = frame / FPS;
  const f12 = stepFrame(frame, 12);

  // arrival field (deterministic, computed once)
  const field = React.useMemo(() => {
    const T = new Float32Array(COLS * ROWS).fill(1e9);
    const srcs: {x: number; y: number; t: number; v: number; R: number; sy: number}[] = [];
    p.sources.forEach((s) => {
      const v = s.v ?? 220;
      const R = s.R ?? 300;
      const sy = s.sy ?? 1;
      if (s.path && s.path.length > 1) {
        const pts = catmull(s.path as Pt[], 8);
        const tab = polyTable(pts);
        const n = Math.max(6, Math.round(tab[tab.length - 1] / 16));
        for (let i = 0; i <= n; i++) {
          const q = polyAt(pts, tab, i / n);
          srcs.push({x: q.x, y: q.y, t: lerp(s.t, s.t1 ?? s.t + 3, i / n), v, R: Math.min(R, 110), sy});
        }
      } else srcs.push({x: s.x, y: s.y, t: s.t, v, R, sy});
    });
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const x = X0 + c * CELL + CELL / 2;
        const y = Y0 + r * CELL + CELL / 2;
        const off = n2(`wa${p.seed}`, x * 0.005, y * 0.005) * p.amp * 0.5 + n2(`wb${p.seed}`, x * 0.021, y * 0.021) * p.amp * 0.17;
        let t = 1e9;
        for (const s of srcs) {
          const d = Math.max(0, Math.hypot(x - s.x, (y - s.y) * s.sy) + off);
          const tt = s.t + Math.min(d, s.R) / s.v + Math.max(0, d - s.R) * p.creep;
          if (tt < t) t = tt;
        }
        t += n2(`wc${p.seed}`, x * 0.012, y * 0.012) * 0.25 + n2(`wd${p.seed}`, x * 0.06, y * 0.06) * 0.08;
        const flood = p.floodAt + n2(`we${p.seed}`, x * 0.006, y * 0.006) * 0.7;
        T[r * COLS + c] = Math.min(t, flood);
      }
    return T;
  }, [JSON.stringify(p.sources), p.amp, p.creep, p.floodAt, p.seed]); // eslint-disable-line react-hooks/exhaustive-deps

  // layered masks: stacked white paths with increasing opacity so the sum is a smooth ramp
  const LV = 5;
  const runs = (pred: (dt: number) => boolean) => {
    let d = '';
    for (let r = 0; r < ROWS; r++) {
      let c = 0;
      while (c < COLS) {
        if (pred(now - field[r * COLS + c])) {
          let e = c;
          while (e < COLS && pred(now - field[r * COLS + e])) e++;
          d += `M${X0 + c * CELL} ${Y0 + r * CELL}h${(e - c) * CELL}v${CELL}h${-(e - c) * CELL}z`;
          c = e;
        } else c++;
      }
    }
    return d;
  };
  const revPaths = Array.from({length: LV}, (_, j) => {
    const th = ((j + 0.5) / LV) * 0.16; // seconds of wetness needed to reach level j
    return {d: runs((dt) => dt > th), a: 1 / LV / (1 - j / LV)};
  });
  const tide = runs((dt) => dt > 0.02 && dt < 0.02 + p.front);
  const sheen = runs((dt) => dt > 0.0 && dt < 0.5);

  /* ───── the default sketch: a hillside village by a lake ───── */
  const pathC = catmull([[40, 640], [200, 565], [350, 560], [470, 522], [600, 500], [760, 470], [940, 440]], 10);
  const ribbon = taperPoly(pathC, (t) => 17 - t * 8);
  const trees: [number, number, number][] = [[90, 350, 1.15], [160, 372, 0.95], [48, 392, 0.8], [880, 336, 0.9], [940, 360, 1.05], [250, 330, 0.7]];
  const houses: {x: number; y: number; w: number; h: number; wall: string; roof: string}[] = [
    {x: 330, y: 392, w: 76, h: 46, wall: '#D8C6A0', roof: '#C49A7A'},
    {x: 430, y: 372, w: 66, h: 42, wall: '#CFAA72', roof: '#8B93A6'},
    {x: 520, y: 400, w: 84, h: 50, wall: '#D8C6A0', roof: '#B8483E'},
    {x: 610, y: 374, w: 60, h: 40, wall: '#E3D5B5', roof: '#C49A7A'},
    {x: 690, y: 404, w: 70, h: 44, wall: '#CFAA72', roof: '#8B93A6'},
  ];
  const foliage = ['#D6D56F', '#AABF57', '#7FA04A', '#56793C'];
  const wk = (() => {
    const src = p.sources.find((s) => s.path);
    if (!p.walker || !src) return null;
    const k = cl((now - src.t) / ((src.t1 ?? src.t + 3) - src.t));
    const pts = catmull((src.path as Pt[]), 8);
    const q = polyAt(pts, polyTable(pts), k);
    return {x: q.x, y: q.y, k, ang: q.a};
  })();

  const wash = (
    <g>
      <rect x={-100} y={-100} width={DW + 200} height={380} fill="#9FBCD6" opacity={0.42} />
      <circle cx={820} cy={110} r={40} fill="#F0D98C" opacity={0.85} />
      <path d={`M-100 300C100 215 240 232 400 282S690 250 1100 292L1100 400-100 400Z`} fill="#B9C4A0" />
      <path d={`M-100 380C120 300 300 322 480 362S760 340 1100 380L1100 720-100 720Z`} fill="#C3C96F" />
      <path d={`M-100 560C100 520 240 560 380 600L380 720-100 720Z`} fill="#7F9C52" opacity={0.55} />
      <ellipse cx={790} cy={500} rx={210} ry={58} fill="#86A6C8" />
      <path d={ribbon} fill="#D8CCB1" />
      {houses.map((hs, i) => (
        <g key={i}>
          <rect x={hs.x - hs.w / 2} y={hs.y - hs.h} width={hs.w} height={hs.h} fill={hs.wall} />
          <path d={`M${hs.x - hs.w / 2 - 6} ${hs.y - hs.h}L${hs.x} ${hs.y - hs.h - hs.h * 0.7}L${hs.x + hs.w / 2 + 6} ${hs.y - hs.h}Z`} fill={hs.roof} />
          <rect x={hs.x + hs.w * 0.12} y={hs.y - hs.h * 0.62} width={hs.w * 0.18} height={hs.h * 0.4} fill="#98B1C8" />
          <path d={`M${hs.x - hs.w / 2} ${hs.y} h${hs.w} v6 h${-hs.w}Z`} fill="#5A5F82" opacity={0.45} />
        </g>
      ))}
      {trees.map(([x, y, s], i) => (
        <g key={i}>
          <ellipse cx={x + 16 * s} cy={y + 8} rx={26 * s} ry={7 * s} fill="#5A5F82" opacity={0.35} />
          <rect x={x - 3 * s} y={y - 20 * s} width={6 * s} height={26 * s} fill="#8A6A4A" />
          {[0, 1, 2, 3].map((k) => (
            <circle key={k} cx={x + (k % 2 ? 14 : -14) * s * (k > 1 ? 0.5 : 1)} cy={y - (38 + (k > 1 ? 24 : 6)) * s} r={(24 - k * 2) * s} fill={foliage[k]} />
          ))}
        </g>
      ))}
      {wk && (
        <g transform={`translate(${wk.x} ${wk.y})`}>
          <path d="M-9 -4L-6 -36L6 -36L9 -4Z" fill={p.accent} />
          <ellipse cx={0} cy={-52} rx={14} ry={4.5} fill="#D9B26A" />
          <circle cx={0} cy={-46} r={7} fill="#E9C9A8" />
        </g>
      )}
    </g>
  );

  const inkG = (
    <g fill="none" stroke={p.ink} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path d={sketch([[-60, 300], [100, 238], [240, 244], [400, 288], [560, 270], [700, 262], [900, 280], [1060, 296]], 1, false, 2.4)} />
      <path d={sketch([[-60, 380], [120, 314], [300, 332], [480, 366], [660, 350], [780, 346], [1060, 384]], 2, false, 2.4)} strokeWidth={2.4} />
      <path d={sketch([[640, 520], [700, 540], [800, 548], [900, 536], [960, 510], [940, 470], [850, 450], [730, 452], [650, 478], [640, 520]], 3, false, 2.2)} />
      {[0, 1, 2, 3].map((i) => <path key={'rp' + i} d={sketch([[690 + i * 40, 498 + i * 6], [722 + i * 40, 500 + i * 6]], 10 + i, false, 1)} strokeWidth={1.2} />)}
      <path d={sketch(catmull([[40, 640], [200, 565], [350, 560], [470, 522], [600, 500], [760, 470], [940, 440]].map((q, i) => [q[0], q[1] - 17 + (i % 2)] as Pt), 6), 4, false, 1.6)} strokeWidth={1.6} />
      <path d={sketch(catmull([[40, 640], [200, 565], [350, 560], [470, 522], [600, 500], [760, 470], [940, 440]].map((q, i) => [q[0], q[1] + 17 - (i % 2)] as Pt), 6), 5, false, 1.6)} strokeWidth={1.6} />
      {houses.map((hs, i) => (
        <g key={i}>
          <path d={sketch([[hs.x - hs.w / 2, hs.y], [hs.x - hs.w / 2, hs.y - hs.h], [hs.x + hs.w / 2, hs.y - hs.h], [hs.x + hs.w / 2, hs.y]], 20 + i, false, 1.4)} />
          <path d={sketch([[hs.x - hs.w / 2 - 8, hs.y - hs.h + 2], [hs.x, hs.y - hs.h - hs.h * 0.7], [hs.x + hs.w / 2 + 8, hs.y - hs.h + 2]], 30 + i, false, 1.2)} />
          <path d={sketch([[hs.x + hs.w * 0.12, hs.y - hs.h * 0.62], [hs.x + hs.w * 0.3, hs.y - hs.h * 0.62], [hs.x + hs.w * 0.3, hs.y - hs.h * 0.22]], 40 + i, false, 0.8)} strokeWidth={1.3} />
        </g>
      ))}
      {trees.map(([x, y, s], i) => (
        <g key={i}>
          <path d={sketch([[x, y + 6], [x - 1, y - 24 * s]], 50 + i, false, 1)} strokeWidth={2.4} />
          <path d={`M${x - 36 * s} ${y - 46 * s}q${10 * s} ${-22 * s} ${24 * s} ${-14 * s}q${8 * s} ${-22 * s} ${28 * s} ${-6 * s}q${22 * s} ${-6 * s} ${18 * s} ${18 * s}`} strokeWidth={1.8} />
          <path d={`M${x - 30 * s} ${y - 36 * s}q${6 * s} ${12 * s} ${18 * s} ${6 * s}M${x + 4 * s} ${y - 38 * s}q${12 * s} ${10 * s} ${22 * s} ${-2 * s}`} strokeWidth={1.2} opacity={0.7} />
        </g>
      ))}
      <path d={sketch([[760, 92], [790, 82], [830, 84], [850, 98]], 60, false, 1.4)} strokeWidth={1.2} opacity={0.6} />
      <path d={sketch([[120, 100], [170, 88], [230, 92], [280, 102]], 61, false, 1.6)} strokeWidth={1.4} />
      <path d={sketch([[160, 118], [220, 108], [270, 114]], 62, false, 1.6)} strokeWidth={1.2} opacity={0.7} />
      {wk && (
        <g transform={`translate(${wk.x + n2('wkx', f12 * 0.7, 0) * 0.9} ${wk.y + n2('wky', f12 * 0.7, 2) * 0.9})`} strokeWidth={2.2}>
          <path d="M-9 -4L-6 -36L6 -36L9 -4Z" />
          <path d={`M-4 -4L${-8 + Math.sin(f12 * 0.6) * 9} 14M4 -4L${8 - Math.sin(f12 * 0.6) * 9} 14`} />
          <circle cx={0} cy={-46} r={7} />
          <path d="M-15 -52h30" />
        </g>
      )}
    </g>
  );

  const useImg = !!p.colorSrc || !!p.lineSrc;
  const colImg = p.colorSrc || p.lineSrc;
  const colorLayer = useImg ? (
    <image href={resolveSrc(colImg)} x={0} y={0} width={DW} height={DH} preserveAspectRatio="xMidYMid slice" />
  ) : (
    wash
  );
  const inkLayer = p.lineSrc ? (
    <image href={resolveSrc(p.lineSrc)} x={0} y={0} width={DW} height={DH} preserveAspectRatio="xMidYMid slice" style={{mixBlendMode: 'multiply'}} />
  ) : p.colorSrc ? (
    <image href={resolveSrc(p.colorSrc)} x={0} y={0} width={DW} height={DH} preserveAspectRatio="xMidYMid slice" filter={`url(#${uid}-edge)`} />
  ) : (
    inkG
  );

  return (
    <AbsoluteFill style={{background: p.paper, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${uid}-soft`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={8} />
            <feComponentTransfer>
              <feFuncR type="linear" slope={3} intercept={-1} />
              <feFuncG type="linear" slope={3} intercept={-1} />
              <feFuncB type="linear" slope={3} intercept={-1} />
              <feFuncA type="linear" slope={3} intercept={-1} />
            </feComponentTransfer>
          </filter>
          <filter id={`${uid}-rough`} filterUnits="userSpaceOnUse" x={X0} y={Y0} width={DW + 200} height={DH + 200} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={p.seed} result="wob" />
            <feDisplacementMap in="SourceGraphic" in2="wob" scale={7} xChannelSelector="R" yChannelSelector="G" result="rg" />
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={2} seed={p.seed + 3} result="gn" />
            <feColorMatrix in="gn" type="matrix" values="0.4 0 0 0 0.7  0.4 0 0 0 0.7  0.4 0 0 0 0.7  0 0 0 1 0" result="gg" />
            <feBlend in="rg" in2="gg" mode="multiply" result="gr" />
            <feComposite in="gr" in2="rg" operator="in" />
          </filter>
          <filter id={`${uid}-tide`} filterUnits="userSpaceOnUse" x={X0} y={Y0} width={DW + 200} height={DH + 200} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.62 0 0 0 0  0 0.58 0 0 0  0 0 0.6 0 0  0 0 0 1 0" />
          </filter>
          <filter id={`${uid}-edge`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" />
            <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" divisor="1" bias="0" preserveAlpha="true" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.17  0 0 0 0 0.15  0 0 0 0 0.13  -4 0 0 0 0.9" />
          </filter>
          <mask id={`${uid}-rev`} maskUnits="userSpaceOnUse" x={X0} y={Y0} width={DW + 200} height={DH + 200}>
            <g filter={`url(#${uid}-soft)`}>
              {revPaths.map((r, j) => (r.d ? <path key={j} d={r.d} fill="#fff" fillOpacity={r.a} /> : null))}
            </g>
          </mask>
          <mask id={`${uid}-tm`} maskUnits="userSpaceOnUse" x={X0} y={Y0} width={DW + 200} height={DH + 200}>
            <g filter={`url(#${uid}-soft)`}>{tide && <path d={tide} fill="#fff" fillOpacity={0.9} />}</g>
          </mask>
          <mask id={`${uid}-sm`} maskUnits="userSpaceOnUse" x={X0} y={Y0} width={DW + 200} height={DH + 200}>
            <g filter={`url(#${uid}-soft)`}>{sheen && <path d={sheen} fill="#fff" fillOpacity={0.9} />}</g>
          </mask>
        </defs>
        <PaperFibreRect id={uid} w={w} h={h} paper={p.paper} fibre={0.1} seed={p.seed + 1} mottle={0.06} />
        <svg x={0} y={0} width={w} height={h} viewBox={`0 0 ${DW} ${DH}`} preserveAspectRatio="xMidYMid slice" overflow="hidden">
          <g style={{mixBlendMode: 'multiply'}}>
            <g mask={`url(#${uid}-rev)`}>
              <g transform="translate(2.2 2.2)" filter={`url(#${uid}-rough)`}>{colorLayer}</g>
            </g>
          </g>
          <g style={{mixBlendMode: 'multiply'}} opacity={0.75}>
            <g mask={`url(#${uid}-tm)`}>
              <g transform="translate(2.2 2.2)" filter={`url(#${uid}-tide)`}>
                <g filter={`url(#${uid}-rough)`}>{colorLayer}</g>
              </g>
            </g>
          </g>
          <g mask={`url(#${uid}-sm)`} opacity={0.14}>
            <rect x={X0} y={Y0} width={DW + 200} height={DH + 200} fill="#fff" />
          </g>
          <g style={{mixBlendMode: 'multiply'}} opacity={0.96}>{inkLayer}</g>
        </svg>
      </svg>
    </AbsoluteFill>
  );
};

export const washArrival = defineMotion<Props>({
  id: 'wash-arrival',
  title: 'Wash arrival',
  category: 'image',
  description:
    'A hillside village by a lake sits as a pure ink sketch on cream paper; colour then floods outward from a little walker along the path and from the sunrise like watercolour on wet paper — an irregular cauliflower front with a darker pooled tide line just behind it, granulation, a brief wet sheen and a wash slightly off-register from the line. Whatever the sources touch becomes painted; the rest stays line until colour arrives (everything is flooded by floodAt). Give lineSrc / colorSrc to reveal your own picture.',
  source: ['lemo-opuscar styles/urban-sketch/demo/engine.js arrivalField + compositor; STYLE.md §8 (MIT, LemoLab)'],
  useFor: '"Colour follows the product / runner / sunrise" storytelling, sketch → finished-render reveals for architecture and real estate, onboarding illustrations that come alive.',
  durationInFrames: 240,
  defaultProps: {
    lineSrc: '', colorSrc: '',
    sources: [
      {x: 0, y: 0, t: 0.5, v: 200, R: 160, path: [[80, 630], [200, 566], [350, 560], [470, 522], [600, 500], [760, 470], [900, 444]], t1: 4.6},
      {x: 820, y: 110, t: 1.4, v: 220, R: 480, sy: 0.85},
    ],
    amp: 170, creep: 0.01, floodAt: 6.4, front: 0.2, paper: '#F5EEDE', ink: '#2B2520', accent: '#C8553D', walker: true, seed: 4,
  },
  propDocs: {
    lineSrc: 'optional line-art image in public/ (dark lines on white) — used as the ink layer',
    colorSrc: 'optional colour image in public/ — the paint layer (an ink layer is derived from its edges when lineSrc is empty)',
    sources: 'colour sources in a 1000×620 design space: {x,y,t (s), v (units/s), R (reach), sy (vertical stretch), path:[[x,y]…] + t1 for a moving source}',
    amp: 'front irregularity (noise offset in design units)', creep: 'seconds per unit beyond the reach radius', floodAt: 'seconds by which any unpainted area is flooded', front: 'tide-line width in seconds',
    paper: 'paper colour', ink: 'line colour', accent: 'the one coloured thing (walker coat)', walker: 'draw the little walker that rides the path source', seed: 'noise seed',
  },
  component: WashArrival,
  tags: ['watercolor', 'wash', 'colour reveal', 'sketch', 'ink', 'urban sketch', 'pen and wash', 'before after', 'reveal', 'paper', 'bloom', 'architecture', 'illustration', 'image'],
});
