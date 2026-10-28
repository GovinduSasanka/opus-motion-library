// Adapted from lemo-opuscar/styles/telestrator/demo/index.html (ring, marker, tag, grade, spot, flash) + STYLE.md §6, §9.1–9.2 (MIT / CC BY 4.0, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {alongPoly, back, eo3, fx, h1, lerp, lf, polyD, seg, useUid} from '../../core/r2-lb2b-kit';

/**
 * Pundit's analysis board over footage (or a still / a built-in demo pitch): the picture freezes with a white flash and
 * a small zoom punch, colour drains and cools, everything outside a focus ellipse darkens; a ring draws clockwise under
 * the subject with a rotating dashed outer ring and a faint light beam, a glowing marker arrow draws along a path and its
 * head pops, a red translucent "space" patch fades in with a dashed edge, a black label card wipes open — then play resumes.
 */
type Ring = {x: number; y: number; r: number; color: string; at: number; beam?: boolean};
type Arrow = {pts: number[][]; color: string; at: number; dash?: boolean; arrow?: boolean};
type Area = {poly: number[][]; at: number; color?: string};
type LabelCard = {x: number; y: number; title: string; sub: string; color: string; at: number};
type Props = {
  src: string;
  videoSrc: string;
  freezeAt: number;
  holdFrames: number;
  focus: {cx: number; cy: number; rx: number; ry: number};
  rings: Ring[];
  arrows: Arrow[];
  areas: Area[];
  labels: LabelCard[];
  flash: number;
  seed: number;
  background: string;
  flashColor: string;
  cardColor: string;
  cardInk: string;
  teamAColor: string;
  teamBColor: string;
};

const A_COL = '#f4f1e8';
const B_COL = '#27407f';

// ------------------------------------------------------------------ built-in demo pitch (used when no src / videoSrc)
type Pl = {x: number; y: number; vx: number; vy: number; team: 0 | 1; ph: number};
const players = (seed: number): Pl[] => {
  const out: Pl[] = [
    {x: 0.3, y: 0.66, vx: 0.0053, vy: 0, team: 0, ph: 0}, // the subject (carries the ball)
    {x: 0.52, y: 0.6, vx: 0.0016, vy: 0.0004, team: 1, ph: 1},
    {x: 0.6, y: 0.7, vx: 0.0012, vy: -0.0004, team: 1, ph: 2},
  ];
  for (let i = 0; i < 9; i++) {
    const team = (i % 2) as 0 | 1;
    out.push({x: 0.12 + h1(i, seed) * 0.78, y: 0.43 + h1(i + 20, seed) * 0.34, vx: (h1(i + 40, seed) - 0.4) * 0.004, vy: (h1(i + 60, seed) - 0.5) * 0.002, team, ph: i * 1.3});
  }
  return out;
};

const Pitch: React.FC<{tt: number; seed: number; teamA: string; teamB: string}> = ({tt, seed, teamA, teamB}) => {
  const {w, h, u} = useStage();
  const hor = h * 0.22;
  const bands = 9;
  const pl = players(seed).map((p) => ({...p, px: (p.x + p.vx * tt) * w, py: (p.y + p.vy * tt) * h})).sort((a, b) => a.py - b.py);
  return (
    <g>
      <rect width={w} height={h} fill="#2b371a" />
      {Array.from({length: bands}, (_, i) => {
        const y0 = hor + (h - hor) * Math.pow(i / bands, 1.5);
        const y1 = hor + (h - hor) * Math.pow((i + 1) / bands, 1.5);
        return <rect key={i} x={0} y={y0} width={w} height={y1 - y0 + 1} fill={i % 2 ? '#36431f' : '#3d4b25'} />;
      })}
      <rect x={0} y={0} width={w} height={hor} fill="#161c10" />
      {Array.from({length: 120}, (_, i) => (
        <circle key={i} cx={h1(i, seed + 3) * w} cy={h1(i + 9, seed + 3) * hor * 0.9 + 4} r={(2 + h1(i + 3, seed) * 2.5) * u} fill={['#3a4330', '#524436', '#2b3140', '#5a5a4e'][i % 4]} opacity={0.7} />
      ))}
      <rect x={0} y={hor - 6 * u} width={w} height={8 * u} fill="#0b0d08" />
      <g stroke="#f4f1e8" strokeOpacity={0.55} strokeWidth={3 * u} fill="none">
        <line x1={w * 0.5} y1={hor + 4} x2={w * 0.5} y2={h} />
        <ellipse cx={w * 0.5} cy={h * 0.62} rx={w * 0.13} ry={h * 0.11} />
        <path d={`M${fx(w * 0.62)},${fx(h * 0.38)} L${fx(w * 0.86)},${fx(h * 0.38)} L${fx(w * 0.98)},${fx(h * 0.98)} L${fx(w * 0.7)},${fx(h * 0.98)}`} />
      </g>
      {pl.map((p, i) => {
        const s = (0.12 + 0.2 * p.py / h) * h;
        const col = p.team === 0 ? teamA : teamB;
        const sw = Math.sin(tt * 0.5 + p.ph) * s * 0.07;
        return (
          <g key={i} transform={`translate(${fx(p.px)},${fx(p.py)})`}>
            <ellipse cx={0} cy={0} rx={s * 0.2} ry={s * 0.05} fill="#000" opacity={0.3} />
            <rect x={-s * 0.05 + sw} y={-s * 0.28} width={s * 0.07} height={s * 0.28} fill="#e3b89a" />
            <rect x={-s * 0.02 - sw} y={-s * 0.28} width={s * 0.07} height={s * 0.28} fill="#d6a888" />
            <rect x={-s * 0.075} y={-s * 0.4} width={s * 0.15} height={s * 0.14} fill={p.team === 0 ? '#202225' : '#f4f1e8'} />
            <rect x={-s * 0.085} y={-s * 0.66} width={s * 0.17} height={s * 0.28} rx={s * 0.04} fill={col} />
            <circle cx={0} cy={-s * 0.74} r={s * 0.055} fill="#e3b89a" />
            {i >= 0 && p.vx === 0.0053 && <circle cx={s * 0.16} cy={-s * 0.02} r={s * 0.04} fill="#fff" stroke="#111" strokeWidth={1.5 * u} />}
          </g>
        );
      })}
    </g>
  );
};

const TelestratorFreeze: React.FC<Props> = ({src, videoSrc, freezeAt, holdFrames, focus, rings, arrows, areas, labels, flash, seed, background, flashColor, cardColor, cardInk, teamAColor, teamBColor}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useUid('tele');
  const fa = freezeAt;
  const rel = frame - fa;
  const holdOn = frame >= fa && frame < fa + holdFrames ? 1 : frame >= fa + holdFrames ? 1 - seg(frame, fa + holdFrames, fa + holdFrames + 6) : 0;
  const freezeK = seg(frame, fa, fa + 6) * (frame >= fa + holdFrames ? 1 - seg(frame, fa + holdFrames - 6, fa + holdFrames) : 1);
  const tt = frame < fa ? frame : frame < fa + holdFrames ? fa : fa + (frame - fa - holdFrames);
  const punch = holdOn * (0.035 * (1 - eo3(seg(frame, fa, fa + 10))) + 0.012 * seg(frame, fa + 10, fa + holdFrames));
  const sc = 1 + punch;
  const flashA = frame >= fa ? flash * (1 - seg(frame, fa, fa + 3.3)) : 0;
  const F = {cx: focus.cx * w, cy: focus.cy * h, rx: focus.rx * w, ry: focus.ry * h};
  const spot = 0.42 * seg(rel, 2, 11) * freezeK;
  const fArch = lf('archivo');
  const fBar = lf('barlow');
  const card = (c: LabelCard, i: number) => {
    const p = eo3(seg(rel, c.at, c.at + 12));
    if (p <= 0) return null;
    const ts = (portrait ? 30 : 40) * u;
    const ss = (portrait ? 17 : 21) * u;
    const cwid = Math.max(c.title.length * ts * 0.66, c.sub.length * ss * 0.62 + c.sub.length * 2 * u) + 44 * u;
    const chh = ts + ss + 34 * u;
    const x = c.x * w;
    const y = c.y * h;
    return (
      <g key={i}>
        <clipPath id={`${uid}lc${i}`}>
          <rect x={x} y={y} width={cwid * p} height={chh} />
        </clipPath>
        <g clipPath={`url(#${uid}lc${i})`}>
          <rect x={x} y={y} width={cwid} height={chh} fill={cardColor} />
          <rect x={x} y={y} width={8 * u} height={chh} fill={c.color} />
          <text x={x + 24 * u} y={y + ts * 0.95 + 8 * u} fontFamily={fArch} fontWeight={800} fontSize={ts} fill={cardInk}>
            {c.title}
          </text>
          <text x={x + 24 * u} y={y + ts + ss + 14 * u} fontFamily={fBar} fontWeight={600} fontSize={ss} letterSpacing={2 * u} fill={c.color}>
            {c.sub}
          </text>
        </g>
      </g>
    );
  };
  const ring = (r: Ring, i: number) => {
    const p = eo3(seg(rel, r.at, r.at + 14));
    if (p <= 0) return null;
    const rx = r.r * h;
    const ry = rx * 0.36;
    const x = r.x * w;
    const y = r.y * h;
    const d = `M${fx(x)},${fx(y - ry)} A${fx(rx)},${fx(ry)} 0 1 1 ${fx(x)},${fx(y + ry)} A${fx(rx)},${fx(ry)} 0 1 1 ${fx(x)},${fx(y - ry)}`;
    const t = (frame - fa - r.at) / 30;
    return (
      <g key={i}>
        {r.beam && (
          <polygon points={`${fx(x - rx * 0.7)},${fx(y)} ${fx(x + rx * 0.7)},${fx(y)} ${fx(x + rx * 1.05)},${fx(y - 3.2 * rx)} ${fx(x - rx * 1.05)},${fx(y - 3.2 * rx)}`} fill={`url(#${uid}beam${i})`} opacity={p} />
        )}
        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={r.color} opacity={0.19 * p} />
        <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={11 * u} />
        <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} fill="none" stroke={r.color} strokeWidth={6 * u} filter={`url(#${uid}glow)`} />
        <ellipse cx={x} cy={y} rx={rx * 1.32} ry={ry * 1.32} fill="none" stroke={r.color} strokeWidth={3 * u} strokeDasharray={`${16 * u} ${14 * u}`} strokeDashoffset={-60 * u * t} opacity={0.85 * p} />
      </g>
    );
  };
  const arrow = (a: Arrow, i: number) => {
    const p = eo3(seg(rel, a.at, a.at + 20));
    if (p <= 0) return null;
    const P = a.pts.map(([x, y]) => [x * w, y * h] as [number, number]);
    const N = 28;
    const samp = Array.from({length: N + 1}, (_, k) => alongPoly(P, (k / N) * p));
    const pl = samp.map((s) => [s.x, s.y] as [number, number]);
    const dd = polyD(pl);
    const tip = samp[N];
    const hs = 3.2 * 7 * u;
    const head = a.arrow !== false ? seg(p, 0.9, 1) : 0;
    const da = a.dash ? `${16 * u} ${12 * u}` : undefined;
    return (
      <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={dd} stroke="#000" strokeOpacity={0.55} strokeWidth={13 * u} strokeDasharray={da} />
        <path d={dd} stroke={a.color} strokeWidth={7 * u} strokeDasharray={da} filter={`url(#${uid}glow)`} />
        <path d={dd} stroke="#fff" strokeOpacity={0.55} strokeWidth={7 * u * 0.28} strokeDasharray={da} />
        {head > 0 && (
          <g transform={`translate(${fx(tip.x)},${fx(tip.y)}) rotate(${fx((tip.a * 180) / Math.PI)}) scale(${fx(back(head, 2))})`}>
            <polygon points={`${fx(hs * 0.5)},0 ${fx(-hs * 0.6)},${fx(-hs * 0.62)} ${fx(-hs * 0.3)},0 ${fx(-hs * 0.6)},${fx(hs * 0.62)}`} fill={a.color} stroke="#000" strokeOpacity={0.55} strokeWidth={3 * u} />
          </g>
        )}
      </g>
    );
  };
  const area = (a: Area, i: number) => {
    const p = seg(rel, a.at, a.at + 12);
    if (p <= 0) return null;
    const col = a.color ?? '#FF3B30';
    const dd = polyD(a.poly.map(([x, y]) => [x * w, y * h] as [number, number])) + ' Z';
    return (
      <g key={i}>
        <path d={dd} fill={col} fillOpacity={0.36 * p} />
        <path d={dd} fill="none" stroke={col} strokeWidth={3 * u} strokeDasharray={`${12 * u} ${9 * u}`} opacity={0.9 * p} />
      </g>
    );
  };
  const picture = videoSrc ? (
    <>
      <Sequence from={0} durationInFrames={fa}>
        <OffthreadVideo src={resolveSrc(videoSrc)} style={{width: '100%', height: '100%', objectFit: 'cover'}} muted />
      </Sequence>
      <Sequence from={fa} durationInFrames={holdFrames}>
        <Freeze frame={0}>
          <OffthreadVideo src={resolveSrc(videoSrc)} trimBefore={fa} style={{width: '100%', height: '100%', objectFit: 'cover'}} muted />
        </Freeze>
      </Sequence>
      <Sequence from={fa + holdFrames}>
        <OffthreadVideo src={resolveSrc(videoSrc)} trimBefore={fa} style={{width: '100%', height: '100%', objectFit: 'cover'}} muted />
      </Sequence>
    </>
  ) : src ? (
    <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  ) : (
    <Svg>
      <Pitch tt={tt} seed={seed} teamA={teamAColor} teamB={teamBColor} />
    </Svg>
  );
  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill style={{transform: `scale(${fx(sc)})`, transformOrigin: `${fx(F.cx)}px ${fx(F.cy)}px`}}>
        <AbsoluteFill style={{filter: `saturate(${fx(1 - 0.42 * freezeK)}) contrast(${fx(1.04)}) brightness(${fx(0.97 - 0.03 * freezeK)})`}}>{picture}</AbsoluteFill>
        <Svg>
          <defs>
            <filter id={`${uid}glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={7 * u} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {rings.map((r, i) => (
              <linearGradient key={i} id={`${uid}beam${i}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor={r.color} stopOpacity="0.33" />
                <stop offset="1" stopColor={r.color} stopOpacity="0" />
              </linearGradient>
            ))}
            <radialGradient id={`${uid}vig`} cx="50%" cy="50%" r="75%">
              <stop offset="0.55" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="1" />
            </radialGradient>
          </defs>
          {/* grade: cool tint + vignette (0.38 -> 0.58) */}
          <rect width={w} height={h} fill="rgb(10,22,30)" opacity={0.16 * freezeK} />
          <rect width={w} height={h} fill={`url(#${uid}vig)`} opacity={0.38 + 0.2 * freezeK} />
          {/* spotlight: everything outside the focus ellipse darkens (even-odd hole) */}
          <path d={`M-20,-20 H${w + 20} V${h + 20} H-20 Z M${fx(F.cx - F.rx)},${fx(F.cy)} a${fx(F.rx)},${fx(F.ry)} 0 1 0 ${fx(F.rx * 2)},0 a${fx(F.rx)},${fx(F.ry)} 0 1 0 ${fx(-F.rx * 2)},0 Z`} fillRule="evenodd" fill="#000" opacity={spot} />
          {freezeK > 0 && (
            <g>
              {areas.map(area)}
              {rings.map(ring)}
              {arrows.map(arrow)}
              {labels.map(card)}
            </g>
          )}
        </Svg>
      </AbsoluteFill>
      <AbsoluteFill style={{background: flashColor, opacity: flashA, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const telestratorFreeze = defineMotion<Props>({
  id: 'telestrator-freeze',
  title: 'Telestrator freeze (analysis board)',
  category: 'image',
  description:
    'Footage, a still or the built-in demo pitch freezes with a white flash and a small zoom punch, colour drains and cools and everything outside a focus ellipse darkens; a yellow ring draws clockwise under the subject with a rotating dashed outer ring and light beam, a glowing marker arrow draws along a path, a red space patch fades in and a black label card wipes open; then play resumes.',
  source: ['lemo-opuscar styles/telestrator demo/index.html (ring, marker, tag, grade, spot, flash) + STYLE.md §6, §9.1–9.2 (MIT / CC BY 4.0, LemoLab)'],
  useFor: 'Sports and gameplay analysis, UX screen-recording teardowns ("freeze the recording and circle the button"), product demos, coaching, CCTV-style explainers over any footage or screenshot.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    videoSrc: '',
    freezeAt: 30,
    holdFrames: 70,
    focus: {cx: 0.52, cy: 0.62, rx: 0.3, ry: 0.28},
    rings: [{x: 0.459, y: 0.675, r: 0.06, color: '#FFD400', at: 6, beam: true}],
    arrows: [{pts: [[0.48, 0.64], [0.6, 0.55], [0.74, 0.51]], color: '#FFD400', at: 18, arrow: true}],
    areas: [{poly: [[0.62, 0.46], [0.8, 0.46], [0.86, 0.6], [0.66, 0.62]], at: 26, color: '#FF3B30'}],
    labels: [{x: 0.06, y: 0.09, title: 'OVERLAP RUN', sub: 'SPACE BEHIND THE LINE', color: '#FFD400', at: 36}],
    flash: 0.6,
    seed: 5,
    background: '#0b0d0f',
    flashColor: '#ffffff',
    cardColor: 'rgba(8,12,14,0.9)',
    cardInk: '#ffffff',
    teamAColor: A_COL,
    teamBColor: B_COL,
  },
  propDocs: {
    src: 'optional still image (public path) to freeze on; empty = demo pitch',
    videoSrc: 'optional video (public path): plays, freezes at freezeAt for holdFrames, then resumes',
    freezeAt: 'frame the picture freezes',
    holdFrames: 'frames the freeze lasts (1.8-2.4 s typical)',
    focus: 'focus ellipse as 0..1 of the frame: cx, cy, rx, ry — outside it darkens',
    rings: 'rings under subjects: x, y (0..1), r (fraction of height), color, at (frames after freeze), beam',
    arrows: 'marker arrows: pts [[x,y]...] 0..1, color, at, dash, arrow',
    areas: 'translucent space patches: poly [[x,y]...], at, color',
    labels: 'label cards: x, y (0..1 top-left), title, sub, color, at',
    flash: 'white flash strength 0..1',
    seed: 'demo pitch seed',
    background: 'colour behind the picture (normally covered)',
    flashColor: 'freeze flash colour',
    cardColor: 'label card background (any CSS colour)',
    cardInk: 'label card title colour',
    teamAColor: 'demo pitch: team A shirt colour',
    teamBColor: 'demo pitch: team B shirt colour',
  },
  component: TelestratorFreeze,
  tags: ['telestrator', 'sports', 'analysis', 'freeze frame', 'annotation', 'ring', 'marker arrow', 'spotlight', 'screen recording', 'ux teardown', 'coaching', 'highlight', 'video overlay', 'football'],
});
