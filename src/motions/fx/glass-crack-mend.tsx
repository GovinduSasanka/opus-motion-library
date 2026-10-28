// Adapted from lemo-opuscar/styles/stained-glass/demo/story.js (CRACKS, WELDS, crackAfter) + STYLE.md §5/§8 (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {back, crackSet, eio3, fx, h1, lerp, mixHex, polyD, seg, useUid, WeldSpark} from '../../core/r2-lb2b-kit';

/**
 * A blow hits a leaded glass pane: nine jagged white-hot cracks race out from the impact in a quarter second, a white
 * flash and a 2-frame shake, silence; then groups of glass slide along the leads into a new arrangement (one group per
 * beat, each ending in a weld spark) and the cracks turn into dark mending lead lines — the scars of the change.
 */
type Props = {
  impact: {x: number; y: number};
  cols: number;
  rows: number;
  cracks: number;
  crackAt: number;
  groupAt: number[];
  slideFrames: number;
  mend: boolean;
  flash: number;
  colors: string[];
  lead: string;
  background: string;
  src: string;
  seed: number;
};

const GlassCrackMend: React.FC<Props> = ({impact, cols, rows, cracks, crackAt, groupAt, slideFrames, mend, flash, colors, lead, background, src, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const uid = useUid('gcm');
  const WH = portrait ? Math.min(w * 0.88, h * 0.5) : Math.min(h * 0.82, w * 0.55);
  const cw = (portrait ? w * 0.88 : Math.min(w * 0.78, h * 0.82 * 1.4)) / cols;
  const ch = (portrait ? WH * 1.05 : h * 0.82) / rows;
  const W = cw * cols;
  const H = ch * rows;
  void WH;
  const x0 = cx - W / 2;
  const y0 = cy - H / 2;
  const n = cols * rows;
  const colOf = (m: number) => colors[Math.floor(h1(m * 3 + 1, seed) * colors.length) % colors.length];
  const pos = (m: number): [number, number] => [x0 + (m % cols) * cw, y0 + Math.floor(m / cols) * ch];
  // groups: cells clustered by region, cyclic shifts inside a group
  const G = Math.max(1, groupAt.length);
  const groups: number[][] = Array.from({length: G}, () => []);
  for (let m = 0; m < n; m++) {
    const c = m % cols;
    const r = Math.floor(m / cols);
    const gi = Math.floor((((c * 0.6 + r * 1.1 + h1(m, seed + 2) * 1.2) % G) + G) % G);
    groups[gi].push(m);
  }
  const target: Record<number, {to: number; g: number}> = {};
  groups.forEach((gm, g) => gm.forEach((m, i) => (target[m] = {to: gm[(i + 1) % gm.length], g})));
  // cracks
  const ix = x0 + impact.x * W;
  const iy = y0 + impact.y * H;
  const set = React.useMemo(() => crackSet(ix, iy, cracks, seed, u * 2.2), [ix, iy, cracks, seed, u]);
  const sinceCrack = frame - crackAt;
  const mendK = mend ? seg(frame, (groupAt[0] ?? crackAt + 28) - 4, (groupAt[G - 1] ?? crackAt + 80) + slideFrames) : 0;
  const shake = sinceCrack >= 0 && sinceCrack < 2 ? 1 : 0;
  const sx = shake * (sinceCrack === 0 ? 6 : -5) * u;
  const sy = shake * (sinceCrack === 0 ? -4 : 3) * u;
  const flashA = flash * Math.max(0, 1 - seg(sinceCrack, 0, 14)) * (sinceCrack >= 0 ? 1 : 0);
  const leadW = 9 * u;
  const glow = 1 - seg(frame, crackAt + 10, crackAt + 40);
  const sparks: React.ReactNode[] = [];
  const tiles: React.ReactNode[] = [];
  const moving: React.ReactNode[] = [];
  for (let m = 0; m < n; m++) {
    const [hx, hy] = pos(m);
    const t = target[m];
    const [tx, ty] = pos(t.to);
    const at = groupAt[t.g] ?? crackAt + 30 + t.g * 18;
    const p = seg(frame, at, at + slideFrames);
    const e = eio3(p);
    const bump = Math.sin(Math.PI * p);
    const px = lerp(hx, tx, e);
    const py = lerp(hy, ty, e);
    const dirx = tx - hx;
    const diry = ty - hy;
    const dl = Math.hypot(dirx, diry) || 1;
    const ox = (-diry / dl) * bump * 10 * u;
    const oy = (dirx / dl) * bump * 10 * u;
    const rot = bump * (h1(m, seed + 9) - 0.5) * 7;
    const sc = 1 + 0.05 * back(p) * bump;
    const col = colOf(m);
    const pad = leadW / 2;
    const cid = `${uid}t${m}`;
    const body = (
      <g key={m} transform={`translate(${fx(px + ox)},${fx(py + oy)}) rotate(${fx(rot)} ${fx(cw / 2)} ${fx(ch / 2)}) translate(${fx(cw / 2)},${fx(ch / 2)}) scale(${fx(sc)}) translate(${fx(-cw / 2)},${fx(-ch / 2)})`}>
        <clipPath id={cid}>
          <rect x={pad} y={pad} width={cw - leadW} height={ch - leadW} />
        </clipPath>
        <g clipPath={`url(#${cid})`}>
          {src ? (
            <image href={resolveSrc(src)} x={-(hx - x0)} y={-(hy - y0)} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
          ) : (
            <>
              <rect width={cw} height={ch} fill={col} />
              <rect width={cw} height={ch} fill={`url(#${uid}g)`} />
              <polygon points={`0,0 ${fx(cw * 0.5)},0 0,${fx(ch * 0.5)}`} fill="#fff" opacity={0.1 + 0.1 * h1(m, seed + 4)} />
              <circle cx={cw * (0.3 + 0.4 * h1(m, 5))} cy={ch * (0.3 + 0.4 * h1(m, 6))} r={cw * 0.25} fill={mixHex(col, '#ffffff', 0.35)} opacity={0.35} />
            </>
          )}
        </g>
      </g>
    );
    (p > 0 && p < 1 ? moving : tiles).push(body);
    if (p >= 1) {
      const sp = seg(frame, at + slideFrames, at + slideFrames + 9);
      if (sp > 0 && sp < 1 && h1(m, seed + 11) < 0.6) sparks.push(<WeldSpark key={m} x={tx} y={ty} p={sp} size={26 * u} seed={m} />);
    }
  }
  const grid: React.ReactNode[] = [];
  for (let c = 0; c <= cols; c++) grid.push(<line key={'v' + c} x1={x0 + c * cw} y1={y0} x2={x0 + c * cw} y2={y0 + H} />);
  for (let r = 0; r <= rows; r++) grid.push(<line key={'h' + r} x1={x0} y1={y0 + r * ch} x2={x0 + W} y2={y0 + r * ch} />);
  const crackCol = (k: number) => mixHex('#fff8e8', lead, k);
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <defs>
          <radialGradient id={`${uid}bg`} cx="50%" cy="46%" r="70%">
            <stop offset="0" stopColor="#3a2e3d" />
            <stop offset="1" stopColor={background} />
          </radialGradient>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.28" />
          </linearGradient>
          <filter id={`${uid}glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={5 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`${uid}win`}>
            <rect x={x0} y={y0} width={W} height={H} />
          </clipPath>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}bg)`} />
        <g transform={`translate(${fx(sx)},${fx(sy)})`}>
          <rect x={x0 - 24 * u} y={y0 - 24 * u} width={W + 48 * u} height={H + 48 * u} fill="#17151c" stroke="#2b2833" strokeWidth={6 * u} />
          <rect x={x0} y={y0} width={W} height={H} fill="#0c0b10" />
          <g clipPath={`url(#${uid}win)`}>
            {tiles}
            {moving}
            <g stroke={lead} strokeWidth={leadW} strokeLinecap="square">
              {grid}
            </g>
            {/* cracks: white-hot, then mending lead */}
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {set.map((cr, i) => {
                const p = eio3(seg(sinceCrack, cr.delay * 30, cr.delay * 30 + 8));
                if (p <= 0) return null;
                const sw = (cr.branch ? 3.4 : 5.4) * u;
                const k = mendK;
                return (
                  <path
                    key={i}
                    d={polyD(cr.pts)}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - p}
                    stroke={crackCol(k)}
                    strokeWidth={lerp(sw, leadW * (cr.branch ? 0.6 : 0.8), k)}
                    opacity={0.96}
                    filter={k < 0.5 && glow > 0.05 ? `url(#${uid}glow)` : undefined}
                  />
                );
              })}
            </g>
            {sparks}
          </g>
        </g>
        <rect width={w} height={h} fill="#fff" opacity={flashA} />
      </Svg>
    </AbsoluteFill>
  );
};

export const glassCrackMend = defineMotion<Props>({
  id: 'glass-crack-mend',
  title: 'Glass crack and mend (re-leading)',
  category: 'fx',
  description:
    'A leaded stained-glass pane takes a blow: nine white-hot jagged cracks race out from the impact in a quarter second with a flash and a 2-frame shake, then groups of glass slide along the leads into a new arrangement, one group per beat with a weld spark, and the cracks turn into dark mending lead lines.',
  source: ['lemo-opuscar styles/stained-glass demo/story.js (CRACKS, WELDS, crackAfter) + STYLE.md (MIT, LemoLab)'],
  useFor: 'Turning points: reinvention, injury and recovery, a restored building, a before/after pivot; works over any image via `src`.',
  durationInFrames: 180,
  defaultProps: {
    impact: {x: 0.46, y: 0.42},
    cols: 6,
    rows: 4,
    cracks: 9,
    crackAt: 30,
    groupAt: [58, 76, 94, 112],
    slideFrames: 15,
    mend: true,
    flash: 0.85,
    colors: ['#1f5f9e', '#b3262f', '#d9a22b', '#2e7d4f', '#6b3a8c', '#e0763a', '#2aa2a8'],
    lead: '#1d1f23',
    background: '#14121a',
    src: '',
    seed: 5,
  },
  propDocs: {
    impact: 'impact point as 0..1 of the window',
    cols: 'glass columns',
    rows: 'glass rows',
    cracks: 'number of primary cracks',
    crackAt: 'frame of the blow',
    groupAt: 'start frame of each re-lead group (one slide per entry)',
    slideFrames: 'frames each slide takes',
    mend: 'turn the cracks into lead lines',
    flash: 'white flash strength 0..1',
    colors: 'jewel glass colours',
    lead: 'lead came colour',
    background: 'wall behind the window',
    src: 'optional image shown through the glass (public path); empty = coloured glass',
    seed: 'seed for colours and cracks',
  },
  component: GlassCrackMend,
  tags: ['stained glass', 'crack', 'shatter', 'mend', 'repair', 'kintsugi', 'turning point', 'before after', 'flash', 'lead', 'weld', 'pivot', 'reinvention'],
});
