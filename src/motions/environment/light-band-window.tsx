// Adapted from lemo-opuscar/styles/stained-glass/demo/{comp.js,window.js,scene.js} (backlight band, shafts) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage, Vignette} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {AshlarWall, fx, h1, lancetPath, lerp, lf, mixHex, seg, sstep, track, useUid} from '../../core/r2-lb2b-kit';

/**
 * A tall leaded window (lancets + a rose) in a dark ashlar wall; a soft band of sunlight travels across it. The lit
 * lancet glows jewel-bright with a coloured shaft and floor patch, the others are dark, milky and ghostly — and only the
 * lit pane's figures animate (the rest freeze where the light left them). The sun's colour shifts dawn -> moon.
 */
type Pane = {caption: string; sky: string; sky2: string; sun: string; hill: string; accent: string};
type Key = {at: number; sunU: number; color: string; intensity: number};
type Props = {
  panes: Pane[];
  schedule: Key[];
  bandWidth: number;
  soft: number;
  rose: boolean;
  shafts: boolean;
  dust: number;
  freezeUnlit: boolean;
  title: string;
  wall: string;
  lead: string;
  seed: number;
};

const DEFAULT_PANES: Pane[] = [
  {caption: 'DAWN', sky: '#e0663f', sky2: '#f3b85a', sun: '#fff0b8', hill: '#6b2f66', accent: '#2a7f8f'},
  {caption: 'NOON', sky: '#1f63b5', sky2: '#58b4e0', sun: '#ffd84a', hill: '#2c8a4f', accent: '#c4392d'},
  {caption: 'AFTERNOON', sky: '#d9962a', sky2: '#f1d26a', sun: '#fff3c4', hill: '#3b7a3a', accent: '#8b2f7e'},
  {caption: 'DUSK', sky: '#5a2d86', sky2: '#d05a55', sun: '#ffc27a', hill: '#1f2f63', accent: '#e9a33c'},
];

const sunAt = (frame: number, sched: Key[]) => {
  let i = 0;
  while (i < sched.length - 2 && frame > sched[i + 1].at) i++;
  const a = sched[i];
  const b = sched[Math.min(sched.length - 1, i + 1)];
  const t = b.at > a.at ? seg(frame, a.at, b.at) : 1;
  const e = t * t * (3 - 2 * t);
  return {u: lerp(a.sunU, b.sunU, e), color: mixHex(a.color, b.color, e), k: lerp(a.intensity, b.intensity, e)};
};

const LightBandWindow: React.FC<Props> = ({panes, schedule, bandWidth, soft, rose, shafts, dust, freezeUnlit, title, wall, lead, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait} = useStage();
  const uid = useUid('lbw');
  const n = Math.max(2, Math.min(5, panes.length));
  const ww = portrait ? w * 0.94 : Math.min(w * 0.7, h * 1.05);
  const wx = cx - ww / 2;
  const wy0 = h * (portrait ? 0.12 : 0.1);
  const wy1 = h * (portrait ? 0.66 : 0.7);
  const gap = ww * 0.025;
  const lw = (ww - gap * (n + 1)) / n;
  const rr = rose ? Math.min(ww * 0.09, (wy1 - wy0) * 0.15) : 0;
  const ly0 = wy0 + (rose ? rr * 2 + gap : 0);
  const lh = wy1 - ly0;
  const rise = lw * 0.55;
  const sun = sunAt(frame, schedule);
  const sunX = wx + sun.u * ww;
  const bw = lw / 2 + bandWidth * u;
  const sf = soft * u;
  const lit = (i: number) => {
    const cxl = wx + gap + i * (lw + gap) + lw / 2;
    return {c: cxl, L: 1 - sstep(bw - sf, bw + sf, Math.abs(sunX - cxl))};
  };
  // per-pane animation clock: only advances (8 fps steps) while lit
  const clocks = panes.slice(0, n).map((_, i) => {
    let t = 0;
    for (let f = 0; f <= frame; f++) {
      const li = (() => {
        const s = sunAt(f, schedule);
        const cxl = wx + gap + i * (lw + gap) + lw / 2;
        return 1 - sstep(bw - sf, bw + sf, Math.abs(wx + s.u * ww - cxl));
      })();
      t += freezeUnlit ? li : 1;
    }
    return Math.floor(t / 3.75) * 3.75;
  });
  const floorY = wy1 + h * 0.035;
  const skew = lerp(0.45, 0.06, seg(frame, 0, 30)) + 0.18;
  const fSerif = lf('cormorant');
  const fOut = lf('outfit');
  const dim = 0.18;
  const paneEls = panes.slice(0, n).map((p, i) => {
    const {c, L} = lit(i);
    const x = c - lw / 2;
    const id = `${uid}p${i}`;
    const t = clocks[i];
    const hillY = ly0 + lh * 0.68;
    const sunY = ly0 + lh * (0.52 - 0.12 * Math.sin(t * 0.05 + i));
    return (
      <g key={i}>
        <clipPath id={id}>
          <path d={lancetPath(x, ly0, lw, lh, rise)} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <rect x={x} y={ly0} width={lw} height={lh} fill={p.sky} />
          <rect x={x} y={ly0 + lh * 0.3} width={lw} height={lh * 0.22} fill={p.sky2} />
          <rect x={x} y={ly0 + lh * 0.52} width={lw} height={lh * 0.12} fill={mixHex(p.sky2, p.sun, 0.4)} />
          {/* sun with turning rays */}
          <g transform={`translate(${fx(c)},${fx(sunY)}) rotate(${fx(t * 1.2)})`}>
            {Array.from({length: 12}, (_, k) => (
              <polygon key={k} points={`${fx(-lw * 0.035)},${fx(-lw * 0.2)} 0,${fx(-lw * 0.42)} ${fx(lw * 0.035)},${fx(-lw * 0.2)}`} fill={p.sun} opacity={0.85} transform={`rotate(${k * 30})`} />
            ))}
            <circle r={lw * 0.17} fill={p.sun} />
            <circle r={lw * 0.17} fill="none" stroke={lead} strokeWidth={2 * u} />
          </g>
          {/* hills + swaying tree */}
          <path d={`M${fx(x)},${fx(hillY)} Q${fx(c - lw * 0.2)},${fx(hillY - lh * 0.12)} ${fx(c + lw * 0.1)},${fx(hillY)} T${fx(x + lw)},${fx(hillY - lh * 0.05)} L${fx(x + lw)},${fx(ly0 + lh)} L${fx(x)},${fx(ly0 + lh)} Z`} fill={p.hill} />
          <path d={`M${fx(x)},${fx(hillY + lh * 0.1)} Q${fx(c + lw * 0.2)},${fx(hillY - lh * 0.02)} ${fx(x + lw)},${fx(hillY + lh * 0.12)} L${fx(x + lw)},${fx(ly0 + lh)} L${fx(x)},${fx(ly0 + lh)} Z`} fill={mixHex(p.hill, '#000000', 0.3)} />
          <g transform={`translate(${fx(c - lw * 0.22)},${fx(hillY + lh * 0.03)}) rotate(${fx(Math.sin(t * 0.09 + i * 2) * 3)})`}>
            <rect x={-lw * 0.015} y={-lh * 0.1} width={lw * 0.03} height={lh * 0.1} fill={lead} />
            <circle cy={-lh * 0.13} r={lw * 0.09} fill={p.accent} />
          </g>
          {/* quarry lattice */}
          <g stroke={lead} strokeWidth={1.6 * u} opacity={0.75}>
            {Array.from({length: Math.ceil(lh / (lw * 0.34)) + 2}, (_, k) => (
              <g key={k}>
                <line x1={x} y1={ly0 + k * lw * 0.34} x2={x + lw} y2={ly0 + k * lw * 0.34 + lw * 0.34 * 1.6} />
                <line x1={x + lw} y1={ly0 + k * lw * 0.34} x2={x} y2={ly0 + k * lw * 0.34 + lw * 0.34 * 1.6} />
              </g>
            ))}
          </g>
          {/* light state: unlit panes dark and milky, lit panes bloom with the sun's colour */}
          <rect x={x} y={ly0} width={lw} height={lh} fill="#06050a" opacity={(1 - L) * (1 - dim) * 0.92} />
          <rect x={x} y={ly0} width={lw} height={lh} fill="#aab6c8" opacity={(1 - L) * 0.1} />
          <rect x={x} y={ly0} width={lw} height={lh} fill={sun.color} opacity={L * 0.3 * sun.k} style={{mixBlendMode: 'screen'}} />
          <circle cx={c} cy={sunY} r={lw * 0.7} fill={`url(#${uid}glow)`} opacity={L * sun.k * 0.8} style={{mixBlendMode: 'screen'}} />
        </g>
        <path d={lancetPath(x, ly0, lw, lh, rise)} fill="none" stroke={lead} strokeWidth={7 * u} />
        <path d={lancetPath(x + 9 * u, ly0 + 9 * u, lw - 18 * u, lh - 9 * u, rise)} fill="none" stroke={mixHex('#d9d2c0', sun.color, L * 0.6)} strokeOpacity={0.55} strokeWidth={4 * u} strokeDasharray="0.1 12" strokeLinecap="round" />
        <text x={c} y={wy1 + h * 0.03 + 6 * u} textAnchor="middle" fontFamily={fOut} fontWeight={600} fontSize={Math.max(13, lw * 0.085)} letterSpacing={lw * 0.02} fill={mixHex('#4a4752', sun.color, L * 0.8)}>
          {p.caption}
        </text>
      </g>
    );
  });
  // rose
  const roseK = Math.min(1, sun.k * 1.1);
  const roseEl = rose ? (
    <g>
      <clipPath id={`${uid}rose`}>
        <circle cx={cx} cy={wy0 + rr} r={rr} />
      </clipPath>
      <g clipPath={`url(#${uid}rose)`}>
        {Array.from({length: 12}, (_, k) => {
          const a0 = (k / 12) * Math.PI * 2;
          const a1 = ((k + 1) / 12) * Math.PI * 2;
          const pa = panes[k % n];
          return <path key={k} d={`M${fx(cx)},${fx(wy0 + rr)} L${fx(cx + Math.cos(a0) * rr)},${fx(wy0 + rr + Math.sin(a0) * rr)} A${fx(rr)},${fx(rr)} 0 0 1 ${fx(cx + Math.cos(a1) * rr)},${fx(wy0 + rr + Math.sin(a1) * rr)} Z`} fill={k % 2 ? pa.sky : pa.accent} />;
        })}
        <circle cx={cx} cy={wy0 + rr} r={rr * 0.42} fill={mixHex(panes[0].sun, sun.color, 0.5)} stroke={lead} strokeWidth={5 * u} />
        <circle cx={cx} cy={wy0 + rr} r={rr * 0.7} fill="none" stroke={lead} strokeWidth={4 * u} />
        <rect x={cx - rr} y={wy0} width={rr * 2} height={rr * 2} fill="#06050a" opacity={(1 - roseK) * 0.9} />
        <rect x={cx - rr} y={wy0} width={rr * 2} height={rr * 2} fill={sun.color} opacity={roseK * 0.18} style={{mixBlendMode: 'screen'}} />
      </g>
      <circle cx={cx} cy={wy0 + rr} r={rr} fill="none" stroke={lead} strokeWidth={8 * u} />
      {Array.from({length: 12}, (_, k) => (
        <line key={k} x1={cx} y1={wy0 + rr} x2={cx + Math.cos((k / 12) * Math.PI * 2) * rr} y2={wy0 + rr + Math.sin((k / 12) * Math.PI * 2) * rr} stroke={lead} strokeWidth={3 * u} />
      ))}
    </g>
  ) : null;
  // shafts + floor patches
  const beam = panes.slice(0, n).map((p, i) => {
    const {c, L} = lit(i);
    if (L < 0.02) return null;
    const x0 = c - lw / 2;
    const x1 = c + lw / 2;
    const dx = skew * (h - wy1);
    const poly = `${fx(x0)},${fx(wy1)} ${fx(x1)},${fx(wy1)} ${fx(x1 + dx + lw * 0.2)},${fx(h)} ${fx(x0 + dx - lw * 0.1)},${fx(h)}`;
    const patchCol = mixHex(p.sky, sun.color, 0.4);
    const motes = Array.from({length: Math.round(dust)}, (_, k) => {
      const tt = (h1(k, seed + i) + frame * (0.0025 + 0.002 * h1(k + 7, seed))) % 1;
      const xx = lerp(x0, x1, h1(k + 3, seed + i)) + dx * tt + Math.sin(frame * 0.04 + k) * 6 * u;
      const yy = lerp(wy1, h, tt);
      return <circle key={k} cx={xx} cy={yy} r={(1.2 + 1.8 * h1(k + 5, seed)) * u} fill="#fff" opacity={L * 0.55 * Math.sin(Math.PI * tt)} />;
    });
    return (
      <g key={i}>
        {shafts && <polygon points={poly} fill={`url(#${uid}shaft${i})`} opacity={L * sun.k} style={{mixBlendMode: 'screen'}} />}
        <polygon points={`${fx(x0 + dx * 0.9)},${fx(h * 0.9)} ${fx(x1 + dx * 0.9 + lw * 0.2)},${fx(h * 0.9)} ${fx(x1 + dx + lw * 0.22)},${fx(h)} ${fx(x0 + dx - lw * 0.1)},${fx(h)}`} fill={patchCol} opacity={L * 0.5 * sun.k} style={{mixBlendMode: 'screen'}} filter={`url(#${uid}blur)`} />
        {shafts && motes}
      </g>
    );
  });
  const titleIn = seg(frame, 6, 26);
  return (
    <AbsoluteFill style={{background: '#08070b'}}>
      <Svg>
        <defs>
          <radialGradient id={`${uid}glow`}>
            <stop offset="0" stopColor={sun.color} stopOpacity="0.9" />
            <stop offset="1" stopColor={sun.color} stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}blur`} x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation={10 * u} />
          </filter>
          {panes.slice(0, n).map((_, i) => (
            <linearGradient key={i} id={`${uid}shaft${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={sun.color} stopOpacity="0" />
              <stop offset="0.4" stopColor={sun.color} stopOpacity="0.34" />
              <stop offset="1" stopColor={sun.color} stopOpacity="0.1" />
            </linearGradient>
          ))}
        </defs>
        <g transform={`translate(${fx(0)},${fx(0)})`}>
          <AshlarWall w={w} h={floorY} course={Math.max(46, h * 0.06)} base={wall} seed={seed} lit={sun.k} />
          {/* sill + floor */}
          <rect x={0} y={floorY} width={w} height={h - floorY} fill="#15131a" />
          <rect x={0} y={floorY} width={w} height={4 * u} fill="#2d2a35" />
          {Array.from({length: 9}, (_, k) => (
            <line key={k} x1={0} y1={floorY + (h - floorY) * (k / 9) ** 1.5} x2={w} y2={floorY + (h - floorY) * (k / 9) ** 1.5} stroke="#0a090d" strokeWidth={2 * u} />
          ))}
          {/* window recess */}
          <rect x={wx - 14 * u} y={wy0 - 14 * u} width={ww + 28 * u} height={wy1 - wy0 + 28 * u} fill="#07060a" stroke="#34313c" strokeWidth={5 * u} rx={6 * u} />
          {roseEl}
          {paneEls}
          {beam}
          {title && (
            <g opacity={titleIn}>
              <text x={cx} y={h * (portrait ? 0.068 : 0.055) + 2 * u} textAnchor="middle" fontFamily={fSerif} fontWeight={600} fontSize={Math.max(18, h * 0.034)} letterSpacing={h * 0.012} fill="#000" opacity={0.7}>
                {title}
              </text>
              <text x={cx} y={h * (portrait ? 0.068 : 0.055)} textAnchor="middle" fontFamily={fSerif} fontWeight={600} fontSize={Math.max(18, h * 0.034)} letterSpacing={h * 0.012} fill={mixHex('#55525e', sun.color, 0.35)}>
                {title}
              </text>
            </g>
          )}
        </g>
      </Svg>
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};

export const lightBandWindow = defineMotion<Props>({
  id: 'light-band-window',
  title: 'Light-band stained-glass window',
  category: 'environment',
  description:
    'A tall leaded window with four lancets and a rose in a dark ashlar wall: a soft band of coloured sunlight travels across it (dawn, noon, afternoon, dusk, moon) so the lit lancet glows jewel-bright with a shaft, dust and a floor patch while the others go dark and milky and freeze their figures.',
  source: ['lemo-opuscar styles/stained-glass demo/comp.js, window.js, scene.js (MIT, LemoLab)'],
  useFor: 'Light as time: recipe steps, the seasons of a farm, factory shifts, chapters of a biography, a product line-up lit in turn; strong heritage or holiday look.',
  durationInFrames: 240,
  defaultProps: {
    panes: DEFAULT_PANES,
    schedule: [
      {at: 0, sunU: 0.06, color: '#ff9a62', intensity: 0.75},
      {at: 14, sunU: 0.12, color: '#ffa86c', intensity: 0.85},
      {at: 74, sunU: 0.37, color: '#fff4d2', intensity: 1},
      {at: 134, sunU: 0.63, color: '#ffd37e', intensity: 1},
      {at: 192, sunU: 0.88, color: '#ff7a4a', intensity: 0.8},
      {at: 240, sunU: 0.93, color: '#a9c4ff', intensity: 0.45},
    ],
    bandWidth: 10,
    soft: 28,
    rose: true,
    shafts: true,
    dust: 28,
    freezeUnlit: true,
    title: 'HOURS OF THE DAY',
    wall: '#3a3942',
    lead: '#14131a',
    seed: 4,
  },
  propDocs: {
    panes: 'one object per lancet: caption, sky, sky2, sun, hill, accent colours (2-5 lancets)',
    schedule: 'sun path keys: at (frame), sunU (0..1 across the window), colour, intensity',
    bandWidth: 'extra band width beyond a lancet, in u',
    soft: 'band edge softness in u',
    rose: 'show the rose window (dark at night)',
    shafts: 'light shafts, dust and floor patch',
    dust: 'number of dust motes in each shaft',
    freezeUnlit: 'only the lit pane animates',
    title: 'carved string-course text (empty = none)',
    wall: 'stone colour',
    lead: 'lead came colour',
    seed: 'wall and dust seed',
  },
  component: LightBandWindow,
  tags: ['stained glass', 'window', 'sunlight', 'light shaft', 'time of day', 'gothic', 'lancet', 'rose window', 'chapters', 'seasons', 'heritage', 'dawn', 'dusk', 'god rays'],
});
