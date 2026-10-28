// Adapted from lemo-opuscar/styles/backrooms/demo/story.js focus curve (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {resolveSrc} from '../../core/asset';
import {useSafeId} from '../../core/image-kit';
import {hh, lf, mixC} from '../../core/r2-la1-kit';
import {FilmGrain, Svg, Vignette, useStage} from '../../core/stage';
import {monotone} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Camcorder autofocus hunt: the picture blurs → snaps sharp → slips → locks, then the lens zooms in
 * (FOV 52° → 27°) and hunts again. Blur radius ∝ |1/focus − 1/subject| from a keyed focus-distance curve.
 * Something (a far figure) is visible only inside the first sharp window.
 */
type Props = {
  src: string;
  focusKeys: number[][];
  zoomAt: number;
  zoomFrames: number;
  fovFrom: number;
  fovTo: number;
  zoomFocus: number[];
  maxBlur: number;
  reveal: boolean;
  revealFrom: number;
  revealTo: number;
  notice: string[];
  wallpaper: string;
  carpet: string;
  signal: string;
  osd: boolean;
  osdLabel: string;
};

/** procedural liminal office corridor in one-point perspective */
const Corridor: React.FC<{w: number; h: number; u: number; id: string; wall: string; carpet: string; signal: string; notice: string[]; figure: number}> = ({w, h, u, id, wall, carpet, signal, notice, figure}) => {
  const vx = w * 0.5;
  const vy = h * 0.47;
  const L = Math.min(w, h * 1.4) * 0.11; // end-wall half width
  const ex0 = vx - L;
  const ex1 = vx + L;
  const ey0 = vy - L * 0.62;
  const ey1 = vy + L * 0.58;
  const lights = useMemo(() => Array.from({length: 9}, (_, i) => i), []);
  // depth t: 0 = frame edge, 1 = end wall
  const lerpPt = (a: [number, number], b: [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const TL: [number, number] = [-w * 0.05, -h * 0.05];
  const TR: [number, number] = [w * 1.05, -h * 0.05];
  const BL: [number, number] = [-w * 0.05, h * 1.05];
  const BR: [number, number] = [w * 1.05, h * 1.05];
  const depthT = (k: number) => 1 - 1 / (1 + k * 0.42);
  const p = (pts: [number, number][]) => pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
  // notice on the right wall
  const nt0 = depthT(1.3);
  const nt1 = depthT(2.0);
  const yTop = (t: number) => lerp(TR[1], ey0, t);
  const yBot = (t: number) => lerp(BR[1], ey1, t);
  const xR = (t: number) => lerp(TR[0], ex1, t);
  const nA: [number, number] = [xR(nt0), lerp(yTop(nt0), yBot(nt0), 0.36)];
  const nB: [number, number] = [xR(nt1), lerp(yTop(nt1), yBot(nt1), 0.36)];
  const nC: [number, number] = [xR(nt1), lerp(yTop(nt1), yBot(nt1), 0.56)];
  const nD: [number, number] = [xR(nt0), lerp(yTop(nt0), yBot(nt0), 0.56)];
  const nw = nB[0] - nA[0];
  const nh = nD[1] - nA[1];
  const skew = Math.atan2(nB[1] - nA[1], nw);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fog`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.6} />
        </linearGradient>
        <pattern id={`${id}-wp`} width={18 * u} height={18 * u} patternUnits="userSpaceOnUse">
          <rect width={18 * u} height={18 * u} fill={wall} />
          <rect width={2 * u} height={18 * u} fill={mixC(wall, '#6b5a20', 0.25)} />
        </pattern>
        <radialGradient id={`${id}-vg`} cx={vx} cy={vy} r={Math.max(w, h) * 0.7} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity={0.55} />
          <stop offset="0.25" stopColor="#000" stopOpacity={0.25} />
          <stop offset="0.6" stopColor="#000" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* ceiling */}
      <polygon points={p([TL, TR, [ex1, ey0], [ex0, ey0]])} fill="#d9d3b8" />
      {lights.map((i) => {
        const t0 = depthT(i * 1.1 + 0.2);
        const t1 = depthT(i * 1.1 + 0.55);
        const a = lerpPt(TL, [ex0, ey0], t0);
        const b = lerpPt(TR, [ex1, ey0], t0);
        const c = lerpPt(TR, [ex1, ey0], t1);
        const d = lerpPt(TL, [ex0, ey0], t1);
        const sx = 0.32;
        const dead = i === 5;
        return (
          <polygon key={i} points={p([lerpPt(a, b, sx), lerpPt(a, b, 1 - sx), lerpPt(d, c, 1 - sx), lerpPt(d, c, sx)])} fill={dead ? '#9a9478' : '#fbfaf0'} stroke="#e6e1cf" strokeWidth={2 * u} />
        );
      })}
      {/* walls */}
      <polygon points={p([TL, [ex0, ey0], [ex0, ey1], BL])} fill={`url(#${id}-wp)`} />
      <polygon points={p([TR, [ex1, ey0], [ex1, ey1], BR])} fill={`url(#${id}-wp)`} />
      <polygon points={p([TL, [ex0, ey0], [ex0, ey1], BL])} fill="#000" opacity={0.08} />
      {/* baseboards */}
      <polygon points={p([lerpPt(BL, [ex0, ey1], 0), [ex0, ey1], [ex0, ey1 - 6 * u], [BL[0], BL[1] - 70 * u]])} fill="#4d3d26" />
      <polygon points={p([BR, [ex1, ey1], [ex1, ey1 - 6 * u], [BR[0], BR[1] - 70 * u]])} fill="#4d3d26" />
      {/* carpet */}
      <polygon points={p([BL, BR, [ex1, ey1], [ex0, ey1]])} fill={carpet} />
      <ellipse cx={w * 0.38} cy={h * 0.86} rx={w * 0.12} ry={h * 0.05} fill="#000" opacity={0.12} />
      {/* end wall + door + exit sign */}
      <rect x={ex0} y={ey0} width={ex1 - ex0} height={ey1 - ey0} fill={mixC(wall, '#000', 0.35)} />
      <rect x={vx - L * 0.28} y={ey1 - L * 0.95} width={L * 0.56} height={L * 0.95} fill="#2a2414" />
      <rect x={vx - L * 0.14} y={ey1 - L * 1.14} width={L * 0.28} height={L * 0.11} fill={signal} />
      <circle cx={vx} cy={ey1 - L * 1.09} r={L * 0.4} fill={signal} opacity={0.12} />
      {figure > 0 && (
        <g opacity={figure} fill="#120f08">
          <ellipse cx={vx + L * 0.02} cy={ey1 - L * 0.78} rx={L * 0.07} ry={L * 0.085} />
          <path d={`M${vx - L * 0.12} ${ey1} L${vx - L * 0.1} ${ey1 - L * 0.66} Q${vx} ${ey1 - L * 0.74} ${vx + L * 0.12} ${ey1 - L * 0.66} L${vx + L * 0.13} ${ey1} Z`} />
        </g>
      )}
      <rect width={w} height={h} fill={`url(#${id}-vg)`} />
      {/* notice taped to the right wall */}
      <g transform={`translate(${nA[0]} ${nA[1]}) skewY(${(skew * 180) / Math.PI})`}>
        <rect width={nw} height={nh} fill="#efe7cf" />
        <rect width={nw} height={nh * 0.07} y={-nh * 0.02} x={nw * 0.38} fill="#d8d2b8" opacity={0.7} />
        <text x={w < h ? -nw * 0.02 : nw * 0.08} textAnchor={w < h ? 'end' : undefined} y={nh * 0.2} fontFamily={lf.plexSans} fontWeight={700} fontSize={nh * 0.12} fill="#222">
          {notice[0] ?? ''}
        </text>
        {notice.slice(1).map((ln, i) => (
          <text key={i} x={w < h ? -nw * 0.02 : nw * 0.08} textAnchor={w < h ? 'end' : undefined} y={nh * (0.36 + i * 0.13)} fontFamily={lf.plexSans} fontWeight={600} fontSize={nh * 0.075} fill="#333">
            {ln}
          </text>
        ))}
      </g>
    </g>
  );
};

const AutofocusHunt: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('afhunt');
  const keys = (p.focusKeys.length ? p.focusKeys : [[0, 1]]).map(([a, b]) => [a, b] as [number, number]);
  const fd = Math.max(0.05, monotone(keys, frame));
  const blur = Math.min(p.maxBlur * u, 14 * u * Math.abs(1 / fd - 1));
  const sharp = clamp(1 - blur / (4 * u));
  // zoom: FOV 52° → 27°
  const zk = prog(frame, p.zoomAt, p.zoomAt + p.zoomFrames, ease.inOut);
  const fov = lerp(p.fovFrom, p.fovTo, zk);
  const Z = Math.tan((p.fovFrom * Math.PI) / 360) / Math.tan((fov * Math.PI) / 360);
  const fx = w * p.zoomFocus[0];
  const fy = h * p.zoomFocus[1];
  const figure = p.reveal && frame >= p.revealFrom && frame <= p.revealTo ? sharp : 0;
  // handheld micro shake
  const sx = (hh(Math.floor(frame / 2), 1) - 0.5) * 2.4 * u + Math.sin(frame / 11) * 3 * u;
  const sy = (hh(Math.floor(frame / 2), 2) - 0.5) * 2.4 * u + Math.sin(frame / 17) * 2 * u;
  const locked = sharp > 0.95;
  const br = (portrait ? 150 : 170) * u;
  const rec = Math.floor(frame / 15) % 2 === 0;
  const os = (portrait ? 62 : 52) * u;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${Z * 1.03})`, transformOrigin: `${fx}px ${fy}px`, filter: `blur(${blur.toFixed(2)}px) saturate(0.9)`}}>
        {p.src ? (
          <Img src={resolveSrc(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <Svg>
            <Corridor w={w} h={h} u={u} id={id} wall={p.wallpaper} carpet={p.carpet} signal={p.signal} notice={p.notice} figure={figure} />
          </Svg>
        )}
      </AbsoluteFill>
      <Vignette strength={0.42} />
      <FilmGrain opacity={0.12} every={1} />
      {p.osd && (
        <Svg>
          <g fontFamily={lf.vt} fontSize={os} fill="#fff" stroke="#000" strokeWidth={os * 0.08} paintOrder="stroke">
            {rec && <circle cx={70 * u} cy={70 * u + os * 0.32} r={os * 0.24} fill="#ff2a1a" />}
            <text x={70 * u + os * 0.45} y={70 * u + os * 0.62}>
              {p.osdLabel}
            </text>
            <text x={w - 70 * u} y={70 * u + os * 0.62} textAnchor="end">
              {locked ? 'AF ■' : 'AF □'}
            </text>
            <text x={w - 70 * u} y={h - 70 * u} textAnchor="end">
              {`W ${'|'.repeat(Math.round(1 + zk * 9))}${'.'.repeat(Math.round(9 - zk * 9))} T`}
            </text>
          </g>
          {/* focus brackets: white while hunting, flash on lock */}
          <g fill="none" stroke={locked ? '#9dff8a' : '#ffffff'} strokeWidth={3.5 * u} opacity={0.9}>
            {[
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ].map(([a, b], i) => {
              const bw = br * (locked ? 0.9 : 1 + (1 - sharp) * 0.15);
              const bh = bw * 0.7;
              const x = w / 2 + a * bw;
              const y = h / 2 + b * bh;
              const arm = 34 * u;
              return <path key={i} d={`M${x} ${y - b * arm} L${x} ${y} L${x - a * arm} ${y}`} />;
            })}
          </g>
        </Svg>
      )}
    </AbsoluteFill>
  );
};

export const autofocusHunt = defineMotion<Props>({
  id: 'autofocus-hunt',
  title: 'Autofocus hunt',
  category: 'image',
  description:
    'Camcorder autofocus hunting on a liminal office corridor (or any image): blur → snaps sharp → slips → locks, then a zoom from 52° to 27° and a second hunt; a far figure is visible only inside the first sharp window. REC / AF / zoom OSD and focus brackets.',
  source: ['lemo-opuscar styles/backrooms demo/story.js focus curve + core/three/post.js CoC (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §4 autofocus-hunt'],
  useFor: 'Suspense reveals, "did you see that?" beats, found-footage openers, product reveals with a lens feel.',
  durationInFrames: 165,
  defaultProps: {
    src: '',
    focusKeys: [
      [0, 0.28],
      [14, 0.3],
      [26, 1.7],
      [36, 0.72],
      [46, 1.3],
      [56, 0.94],
      [64, 1.0],
      [96, 1.0],
      [104, 0.6],
      [116, 1.25],
      [126, 0.97],
      [134, 1.0],
    ],
    zoomAt: 92,
    zoomFrames: 34,
    fovFrom: 52,
    fovTo: 27,
    zoomFocus: [0.66, 0.46],
    maxBlur: 26,
    reveal: true,
    revealFrom: 58,
    revealTo: 92,
    notice: ['NOTICE', 'Lights stay on after 6 PM.', 'Keep to the marked route.', 'Report any closed doors.'],
    wallpaper: '#d5bd66',
    carpet: '#8c763c',
    signal: '#ff2a1a',
    osd: true,
    osdLabel: 'REC',
  },
  propDocs: {
    src: 'public/ image to focus-hunt (empty = procedural corridor)',
    focusKeys: '[[frame, focusDistance]] with 1 = the subject in focus; overshoot past 1 and back for a hunt',
    zoomAt: 'frame the optical zoom starts',
    zoomFrames: 'zoom duration',
    fovFrom: 'start field of view in degrees',
    fovTo: 'end field of view in degrees (zoom = tan(from/2)/tan(to/2))',
    zoomFocus: '[x, y] 0..1 the zoom centres on',
    maxBlur: 'maximum blur radius (px at 1080)',
    reveal: 'show the far figure only while sharp between revealFrom and revealTo',
    revealFrom: 'first frame the hidden figure may appear',
    revealTo: 'last frame the hidden figure may appear',
    notice: 'printed notice on the wall: title line then rules',
    wallpaper: 'corridor wallpaper colour',
    carpet: 'carpet colour',
    signal: 'EXIT sign colour (the only signal colour)',
    osd: 'camcorder REC / AF / zoom overlay and focus brackets',
    osdLabel: 'camcorder on-screen-display label next to the red dot',
  },
  component: AutofocusHunt,
  tags: ['autofocus', 'focus', 'blur', 'rack focus', 'camcorder', 'found footage', 'liminal', 'suspense', 'reveal', 'zoom', 'vhs', 'horror lite', 'mystery', 'lens'],
});
