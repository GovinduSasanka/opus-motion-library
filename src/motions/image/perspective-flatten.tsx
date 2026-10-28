// Adapted from lemo-opuscar styles/telestrator/demo/index.html (shotMap, homography flatten) + demo/tools/homography.py (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {fonts} from '../../core/fonts';
import {
  backOut, eio3, fitHomography, lerp, m3apply, m3mul, matrix3dCss, ptsD, seg, sm, TAU, type M3, type Pt,
} from '../../core/r2-lb3a-kit';
import {nz} from '../../core/r2-lb3a-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Marker = {board?: [number, number]; img?: [number, number]; color?: string; at?: number; size?: number; label?: string};

type Props = {
  src: string;
  board: 'pitch' | 'court' | 'floor';
  imagePoints: [number, number][];
  boardPoints: [number, number][];
  at: number;
  dur: number;
  markers: Marker[];
  label: string;
  boardColor: string;
  chalk: string;
  grid: number;
  showPlayers: boolean;
  background: string;
};

const FPS = 30;

type BoardDef = {W: number; H: number; lines: Pt[][]; surface: string; alt: string; label: string};

const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 28): Pt[] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = lerp(a0, a1, i / n);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];

const makeBoard = (kind: Props['board']): BoardDef => {
  if (kind === 'court') {
    const W = 28;
    const H = 15;
    const lines: Pt[][] = [
      rect(0, 0, W, H), [[W / 2, 0], [W / 2, H]], arc(W / 2, H / 2, 1.8, 0, TAU, 36),
      rect(0, H / 2 - 2.45, 5.8, H / 2 + 2.45), rect(W - 5.8, H / 2 - 2.45, W, H / 2 + 2.45),
      arc(1.6, H / 2, 6.75, -1.25, 1.25), arc(W - 1.6, H / 2, 6.75, Math.PI - 1.25, Math.PI + 1.25),
    ];
    return {W, H, lines, surface: '#B98147', alt: '#C48B4F', label: 'COURT'};
  }
  if (kind === 'floor') {
    const W = 12;
    const H = 8;
    const lines: Pt[][] = [rect(0, 0, W, H), rect(0.4, 0.4, W - 0.4, H - 0.4), [[W * 0.35, 0.4], [W * 0.35, H * 0.55]], [[W * 0.35, H * 0.55], [W - 0.4, H * 0.55]], arc(W * 0.35, H * 0.55 - 0.9, 0.9, 0, Math.PI / 2, 10)];
    for (let i = 1; i < W; i++) lines.push([[i, 0], [i, H]]);
    for (let j = 1; j < H; j++) lines.push([[0, j], [W, j]]);
    return {W, H, lines, surface: '#9A8870', alt: '#A5937B', label: 'FLOOR PLAN'};
  }
  const W = 105;
  const H = 68;
  const lines: Pt[][] = [
    rect(0, 0, W, H), [[W / 2, 0], [W / 2, H]], arc(W / 2, H / 2, 9.15, 0, TAU, 40),
    rect(0, H / 2 - 20.16, 16.5, H / 2 + 20.16), rect(W - 16.5, H / 2 - 20.16, W, H / 2 + 20.16),
    rect(0, H / 2 - 9.16, 5.5, H / 2 + 9.16), rect(W - 5.5, H / 2 - 9.16, W, H / 2 + 9.16),
    arc(11, H / 2, 9.15, -0.93, 0.93), arc(W - 11, H / 2, 9.15, Math.PI - 0.93, Math.PI + 0.93),
  ];
  return {W, H, lines, surface: '#2D6B3C', alt: '#337843', label: 'SHOT MAP'};
};

/** default correspondences: corners, mid-points and quarter points of the board */
const defaultBoardPts = (W: number, H: number): Pt[] => [[0, 0], [W, 0], [W, H], [0, H], [W / 2, 0], [W / 2, H], [W * 0.25, H * 0.25], [W * 0.75, H * 0.25], [W * 0.75, H * 0.75], [W * 0.25, H * 0.75]];

const PerspectiveFlatten: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const B = React.useMemo(() => makeBoard(p.board), [p.board]);

  // board → screen (flat) affine, contain-fitted
  // portrait: the board is turned a quarter turn (long side vertical) so it fills the tall frame
  const portrait = h > w;
  const ks = portrait ? Math.min((w * 0.88) / B.H, (h * 0.84) / B.W) : Math.min((w * 0.9) / B.W, (h * 0.84) / B.H);
  const ox = portrait ? w / 2 - (B.H * ks) / 2 : (w - B.W * ks) / 2;
  const oy = portrait ? h / 2 + h * 0.015 - (B.W * ks) / 2 : (h - B.H * ks) / 2 + h * 0.015;
  const B2S: M3 = portrait ? [0, -ks, ox + B.H * ks, ks, 0, oy, 0, 0, 1] : [ks, 0, ox, 0, ks, oy, 0, 0, 1];
  const toS = (b: Pt): Pt => (portrait ? [ox + (B.H - b[1]) * ks, oy + b[0] * ks] : [ox + b[0] * ks, oy + b[1] * ks]);
  const q = portrait ? 1.6 : 1; // portrait: bigger labels

  // oblique camera: board corners → screen trapezoid (the procedural photo)
  const T = React.useMemo(
    () =>
      fitHomography(
        [[0, 0], [B.W, 0], [B.W, B.H], [0, B.H]],
        [[w * 0.2, h * 0.37], [w * 0.8, h * 0.37], [w * 1.04, h * 0.92], [w * -0.04, h * 0.92]],
      ),
    [B.W, B.H, w, h],
  );
  const bPts = p.boardPoints.length >= 4 ? p.boardPoints : defaultBoardPts(B.W, B.H);
  const iPts: Pt[] = p.imagePoints.length >= 4 ? p.imagePoints.map((q) => [q[0] * w, q[1] * h] as Pt) : bPts.map((q) => m3apply(T, q[0], q[1]));
  const G = React.useMemo(() => fitHomography(iPts, bPts), [JSON.stringify(iPts), JSON.stringify(bPts)]); // eslint-disable-line react-hooks/exhaustive-deps

  const f0 = p.at * FPS;
  const f1 = (p.at + p.dur) * FPS;
  const prog = seg(frame, f0, f1);
  const e = eio3(prog);
  const F1 = m3mul(B2S, G);
  const I3: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const Me = I3.map((v, i) => lerp(v, F1[i] / F1[8], e));
  const photoA = 1 - seg(prog, 0.6, 1);
  const boardA = seg(prog, 0.4, 0.9);

  // procedural players: frozen when the flatten starts
  const fm = Math.min(frame, f0);
  const players = React.useMemo(
    () =>
      Array.from({length: 20}, (_, i) => {
        const a = i < 10;
        return {x: ((i % 10) + 0.5 + nz('px' + i, 0.3) * 0.3) * (B.W / 10.5) + B.W * 0.02, y: B.H * (0.12 + 0.76 * ((i * 0.618) % 1)), a, ph: i * 1.7};
      }),
    [B.W, B.H],
  );
  const pos = (pl: (typeof players)[number], f: number): Pt => [pl.x + Math.sin(f * 0.045 + pl.ph) * B.W * 0.018, pl.y + Math.cos(f * 0.038 + pl.ph * 1.3) * B.H * 0.03];

  const PhotoScene = () => {
    if (p.src) return <img src={resolveSrc(p.src)} style={{position: 'absolute', inset: 0, width: w, height: h, objectFit: 'cover'}} />;
    const proj = (b: Pt): Pt => m3apply(T, b[0], b[1]);
    const nStripe = 14;
    const horizon = h * 0.17;
    const farL = proj([0, 0]);
    const farR = proj([B.W, 0]);
    const stands = [0, 1, 2].map((r) => {
      const y0 = farL[1] - h * (0.03 + r * 0.045);
      const y1 = farL[1] - h * (0.0 + r * 0.045);
      return {y0, y1, c: ['#3B3F57', '#4A4262', '#5A4868'][r]};
    });
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7DA6D1" />
            <stop offset="1" stopColor="#E9D7B9" />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill="url(#pf-sky)" />
        <rect x={0} y={horizon} width={w} height={h} fill="#5B7A5A" />
        {stands.map((s, i) => (
          <g key={i}>
            <rect x={farL[0] - w * 0.12} y={s.y0} width={farR[0] - farL[0] + w * 0.24} height={s.y1 - s.y0 + 2} fill={s.c} />
            {Array.from({length: 46}, (_, k) => (
              <circle key={k} cx={farL[0] - w * 0.1 + ((farR[0] - farL[0] + w * 0.2) / 46) * (k + 0.5)} cy={lerp(s.y0, s.y1, 0.5)} r={2.4 * u} fill={['#E4B9A6', '#D9D9E8', '#C7705E', '#E8D08A'][(k + i) % 4]} opacity={0.75} />
            ))}
          </g>
        ))}
        <path d={ptsD([proj([-6, -4]), proj([B.W + 6, -4]), proj([B.W + 20, B.H + 14]), proj([-20, B.H + 14])], true)} fill={B.surface} />
        {Array.from({length: nStripe}, (_, i) => {
          const a = -6 + ((B.W + 12) / nStripe) * i;
          const b = a + (B.W + 12) / nStripe;
          return i % 2 ? <path key={i} d={ptsD([proj([a, -4]), proj([b, -4]), proj([Math.min(b + 4, b * 1.1), B.H + 14]), proj([a - 4, B.H + 14])], true)} fill={B.alt} /> : null;
        })}
        {B.lines.map((l, i) => (
          <path key={i} d={ptsD(l.map(proj))} fill="none" stroke="#F3F1E6" strokeWidth={2.8 * u} strokeOpacity={0.85} strokeLinejoin="round" />
        ))}
        {[...players].sort((a, b) => pos(a, fm)[1] - pos(b, fm)[1]).map((pl, i) => {
          const b = pos(pl, fm);
          const s0 = proj(b);
          const s1 = proj([b[0] + 1, b[1]]);
          const sc = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]);
          const hh = sc * 2.1;
          const ww = sc * 0.75;
          return (
            <g key={i}>
              <ellipse cx={s0[0]} cy={s0[1]} rx={ww * 0.8} ry={ww * 0.25} fill="#000" opacity={0.28} />
              <rect x={s0[0] - ww / 2} y={s0[1] - hh * 0.72} width={ww} height={hh * 0.5} rx={ww * 0.3} fill={pl.a ? '#D2372B' : '#F2F0EA'} />
              <rect x={s0[0] - ww * 0.35} y={s0[1] - hh * 0.26} width={ww * 0.7} height={hh * 0.26} fill="#222" />
              <circle cx={s0[0]} cy={s0[1] - hh * 0.82} r={ww * 0.28} fill="#D9A98C" />
            </g>
          );
        })}
        <rect width={w} height={h} fill="#000" opacity={0.06} />
      </svg>
    );
  };

  const gridStep = p.grid * u;
  const mk = p.markers.map((m, i) => {
    const bp: Pt = m.board ? m.board : m.img ? m3apply(G, m.img[0] * w, m.img[1] * h) : [B.W / 2, B.H / 2];
    const s = toS(bp);
    const at = (m.at ?? p.at + p.dur + 0.3 + i * 0.2) * FPS;
    const k = seg(frame, at, at + 14);
    if (frame < at) return null;
    const drop = (1 - k) * (1 - k) * -150 * u;
    const bounce = k >= 1 ? Math.max(0, Math.sin((frame - at - 14) * 0.6) * Math.exp(-(frame - at - 14) * 0.25)) * -9 * u : 0;
    const r = (m.size ?? 1.5) * ks * 0.9 + 9 * u;
    const rip = seg(frame, at + 12, at + 34);
    const c = m.color ?? '#FF5A4D';
    return (
      <g key={i} opacity={sm(k * 3)}>
        <circle cx={s[0]} cy={s[1]} r={r * (1 + rip * 1.9)} fill="none" stroke={c} strokeWidth={2.4 * u} opacity={(1 - rip) * 0.8 * (k >= 1 ? 1 : 0)} />
        <ellipse cx={s[0]} cy={s[1] + 2 * u} rx={r * 0.9} ry={r * 0.3} fill="#000" opacity={0.35 * k} />
        <circle cx={s[0]} cy={s[1] + drop + bounce} r={r} fill={c} stroke="#0C1411" strokeWidth={2.5 * u} />
        <circle cx={s[0] - r * 0.3} cy={s[1] + drop + bounce - r * 0.3} r={r * 0.28} fill="#fff" opacity={0.55} />
        {m.label && (
          <text x={s[0] + r + 8 * u} y={s[1] + drop + bounce + 5 * u} fontFamily={fonts.mono} fontSize={17 * u * q} fill={p.chalk} opacity={0.9}>
            {m.label}
          </text>
        )}
      </g>
    );
  });

  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: p.boardColor, opacity: 1}}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
          <g opacity={boardA}>
            <g stroke={p.chalk} strokeOpacity={0.07} strokeWidth={1.2 * u}>
              {Array.from({length: Math.ceil(w / gridStep) + 1}, (_, i) => <line key={'v' + i} x1={i * gridStep} y1={0} x2={i * gridStep} y2={h} />)}
              {Array.from({length: Math.ceil(h / gridStep) + 1}, (_, i) => <line key={'h' + i} x1={0} y1={i * gridStep} x2={w} y2={i * gridStep} />)}
            </g>
            {B.lines.map((l, i) => (
              <path key={i} d={ptsD(l.map(toS))} fill="none" stroke={p.chalk} strokeWidth={2.2 * u} strokeLinejoin="round" strokeLinecap="round" strokeOpacity={p.board === 'floor' && i > 4 ? 0.25 : 0.92} />
            ))}
            {p.showPlayers &&
              players.map((pl, i) => {
                const s = toS(pos(pl, f0));
                return <circle key={i} cx={s[0]} cy={s[1]} r={ks * 0.9} fill="none" stroke={p.chalk} strokeOpacity={0.45} strokeWidth={1.8 * u} />;
              })}
            <text x={ox} y={oy - 20 * u} fontFamily={fonts.mono} fontSize={19 * u * q} letterSpacing={3 * u} fill={p.chalk} opacity={0.7}>
              {(p.label || B.label).toUpperCase()}
            </text>
          </g>
          {mk}
        </svg>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: '0 0', transform: matrix3dCss(Me), opacity: photoA, overflow: 'visible'}}>
        <PhotoScene />
      </div>
      {prog > 0 && prog < 1 && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: 0.35}}>
          <rect width={w} height={h} fill="none" />
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const perspectiveFlatten = defineMotion<Props>({
  id: 'perspective-flatten',
  title: 'Perspective flatten',
  category: 'image',
  description:
    'An oblique broadcast-style photo of a pitch un-tilts smoothly (a true homography, ease-in-out) into a straight top-down chalk board — the photo fades as a dark board with chalk lines and a faint grid takes over, the players become ring marks at their real positions, and shot markers drop onto the board one after another. Give it src + imagePoints + boardPoints to flatten your own photo of a pitch, court, floor, desk or whiteboard.',
  source: ['lemo-opuscar styles/telestrator/demo/index.html — shotMap / flatten mesh (MIT, LemoLab)', 'demo/tools/homography.py concept'],
  useFor: 'Turning any oblique photo into a map or plan: sports shot maps, floor plans from a room photo, a whiteboard photo straightened into a clean diagram, real-estate site plans. A strong "how did they do that" moment.',
  durationInFrames: 210,
  defaultProps: {
    src: '',
    board: 'pitch',
    imagePoints: [],
    boardPoints: [],
    at: 0.7,
    dur: 1.2,
    markers: [
      {board: [88, 30], color: '#FF5A4D', size: 1.9, label: 'xG .31'},
      {board: [94, 36], color: '#FF5A4D', size: 1.4, label: 'xG .12'},
      {board: [82, 42], color: '#FFC83D', size: 1.1, label: 'xG .07'},
      {board: [91, 24], color: '#FF5A4D', size: 2.3, label: 'GOAL'},
      {board: [76, 34], color: '#8FD3FF', size: 0.9, label: 'xG .04'},
    ],
    label: '',
    boardColor: '#0C1411',
    chalk: '#F4F1E8',
    grid: 60,
    showPlayers: true,
    background: '#0C1411',
  },
  propDocs: {
    src: 'optional photo in public/ — flattened with the homography from imagePoints → boardPoints (default: the built-in oblique pitch)',
    board: 'chalk board preset: pitch (105×68 m), court (28×15 m) or floor (12×8 m plan)',
    imagePoints: 'photo control points as [x,y] fractions of the frame (≥ 4, same order as boardPoints); empty = built-in camera',
    boardPoints: 'the same points in board units (metres for the presets); empty = corners, mid-line and quarter points',
    at: 'seconds before the flatten starts',
    dur: 'flatten duration in seconds (~0.9–1.4)',
    markers: 'dots that drop on the board: {board:[u,v] | img:[x,y], color, size (m), at (s), label}',
    label: 'board caption (default per preset)',
    boardColor: 'board background',
    chalk: 'chalk line colour',
    grid: 'grid cell in px at 1080p',
    showPlayers: 'ring marks at the photo\'s player positions after the flatten',
    background: 'colour outside the board',
  },
  component: PerspectiveFlatten,
  tags: ['perspective', 'homography', 'flatten', 'top-down', 'map', 'plan', 'shot map', 'sports', 'pitch', 'floor plan', 'whiteboard', 'chalk', 'photo to diagram', 'markers', 'image'],
});
