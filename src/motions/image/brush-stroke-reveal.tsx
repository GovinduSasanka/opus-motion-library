import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {hash01, mixHex, shade} from '../../core/r2-pr2-kit';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * An image (or a procedural sunrise painting) is revealed by thick textured brush strokes sweeping across: a wet ink
 * fringe leads each stroke, bristle streaks break the edge into dry brush, ink pools at the stroke ends.
 */
type StrokeDef = {pts: number[][]; width?: number; at?: number; frames?: number};
type Props = {
  src: string;
  mode: string;
  strokes: StrokeDef[];
  title: string;
  subtitle: string;
  inkColor: string;
  paper: string;
  strokeFrames: number;
  stagger: number;
  width: number;
  bristle: number;
  roughness: number;
  zoom: number;
  palette: string[];
  textColor: string;
};

type S = {pts: [number, number][]; width: number; at: number; frames: number};

const buildStrokes = (mode: string, W: number, H: number, u: number, P: Props): S[] => {
  const m = Math.min(W, H);
  if (P.strokes.length)
    return P.strokes.map((s, i) => ({
      pts: s.pts.map(([x, y]) => [x * W, y * H] as [number, number]),
      width: (s.width ?? P.width) * m,
      at: s.at ?? 6 + i * P.stagger,
      frames: s.frames ?? P.strokeFrames,
    }));
  const out: S[] = [];
  if (mode === 'spiral') {
    const pts: [number, number][] = [];
    const turns = 2.6;
    const R = Math.hypot(W, H) * 0.52;
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const r = R * (1 - t) + m * 0.04;
      const a = -Math.PI / 2 + t * turns * Math.PI * 2;
      pts.push([W / 2 + Math.cos(a) * r * (W > H ? 1.1 : 0.9), H / 2 + Math.sin(a) * r * (W > H ? 0.8 : 1.0)]);
    }
    out.push({pts, width: P.width * m * 1.9, at: 6, frames: P.strokeFrames * 5});
    return out;
  }
  if (mode === 'diagonal') {
    const n = 5;
    const span = Math.hypot(W, H);
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n;
      const x0 = -0.2 * W + k * 1.4 * W;
      const dir = i % 2 ? -1 : 1;
      const a: [number, number] = [x0 - 0.35 * W, dir > 0 ? -0.15 * H : 1.15 * H];
      const b: [number, number] = [x0 + 0.35 * W, dir > 0 ? 1.15 * H : -0.15 * H];
      out.push({pts: [a, [(a[0] + b[0]) / 2 + (hash01(i, 2) - 0.5) * 0.06 * W, (a[1] + b[1]) / 2], b], width: (span / n) * 0.62, at: 6 + i * P.stagger, frames: P.strokeFrames});
    }
    return out;
  }
  // zigzag (default): horizontal passes stacked top to bottom, alternating direction
  const n = W > H ? 5 : 7;
  const bw = (H / n) * 1.5;
  for (let i = 0; i < n; i++) {
    const y = ((i + 0.5) / n) * H;
    const dir = i % 2 ? -1 : 1;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const x = dir > 0 ? -0.08 * W + t * 1.16 * W : 1.08 * W - t * 1.16 * W;
      pts.push([x, y + Math.sin(t * 3 + i) * H * 0.018 + (hash01(i, k) - 0.5) * H * 0.012]);
    }
    out.push({pts, width: bw * (P.width / 0.12) * 0.98, at: 6 + i * P.stagger, frames: P.strokeFrames});
  }
  return out;
};

const pathOf = (pts: [number, number][]) => {
  if (pts.length < 3) return `M${pts.map((p) => p.join(',')).join(' L')}`;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  const l = pts[pts.length - 1];
  return d + ` L${l[0].toFixed(1)},${l[1].toFixed(1)}`;
};

/** procedural sunrise painting used when no `src` is given */
const Painting: React.FC<{W: number; H: number; pal: string[]; frame: number}> = ({W, H, pal, frame}) => {
  const [sky1, sky2, sun, m1, m2, m3] = [pal[0], pal[1], pal[2], pal[3], pal[4], pal[5]];
  const hz = H * 0.62;
  const ridge = (base: number, amp: number, seed: number, f: number) => {
    let d = `M0,${H}`;
    for (let i = 0; i <= 40; i++) {
      const x = (i / 40) * W;
      const y = base + Math.sin(i * f + seed) * amp + Math.sin(i * f * 2.3 + seed * 3) * amp * 0.45;
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d + ` L${W},${H} Z`;
  };
  const sunY = hz - H * 0.1 - Math.min(1, frame / 150) * H * 0.05;
  return (
    <g>
      <defs>
        <linearGradient id="brsr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky1} />
          <stop offset="1" stopColor={sky2} />
        </linearGradient>
        <linearGradient id="brsr-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixHex(sky2, m3, 0.35)} />
          <stop offset="1" stopColor={m3} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#brsr-sky)" />
      <circle cx={W * 0.62} cy={sunY} r={Math.min(W, H) * 0.17} fill={sun} opacity={0.35} />
      <circle cx={W * 0.62} cy={sunY} r={Math.min(W, H) * 0.115} fill={sun} />
      <path d={ridge(hz - H * 0.08, H * 0.05, 1, 0.45)} fill={m1} />
      <path d={ridge(hz - H * 0.02, H * 0.045, 4, 0.62)} fill={m2} />
      <rect x={0} y={hz} width={W} height={H - hz} fill="url(#brsr-lake)" />
      <ellipse cx={W * 0.62} cy={hz + H * 0.08} rx={Math.min(W, H) * 0.09} ry={H * 0.07} fill={sun} opacity={0.35} />
      <rect x={W * 0.62 - Math.min(W, H) * 0.12} y={hz + H * 0.05} width={Math.min(W, H) * 0.24} height={H * 0.012} fill={sun} opacity={0.5} />
      <path d={ridge(hz + H * 0.2, H * 0.03, 7, 0.9)} fill={shade(m3, -0.25)} opacity={0.85} />
    </g>
  );
};

const BrushStrokeReveal: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w: W, h: H, u, portrait} = useStage();
  const strokes = useMemo(() => buildStrokes(P.mode, W, H, u, P), [P.mode, P.strokes, P.width, P.strokeFrames, P.stagger, W, H, u]); // eslint-disable-line react-hooks/exhaustive-deps
  const zoom = 1 + (P.zoom - 1) * ease.sine(clamp(frame / 150));
  const dis = 30 * u * P.roughness;
  const bristleF = 0.006 + 0.0 * P.bristle;
  const lastEnd = Math.max(...strokes.map((s) => s.at + s.frames));
  const titleA = ease.out(prog(frame, lastEnd - 8, lastEnd + 16, (t) => t));
  const fs = (portrait ? 74 : 64) * u;
  const layers = strokes.map((s, i) => {
    const p = prog(frame, s.at, s.at + s.frames, ease.sine);
    return {s, p, d: pathOf(s.pts), pDry: clamp(p * 1.14), i};
  });
  const draw = (pOf: (l: (typeof layers)[0]) => number, wk: number, color: string, op = 1) =>
    layers.map((l) => (pOf(l) > 0 ? <path key={l.i} d={l.d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pOf(l)} fill="none" stroke={color} strokeWidth={l.s.width * wk} strokeLinecap="round" strokeLinejoin="round" opacity={op} /> : null));
  const pools = layers.map((l) => {
    if (l.p < 0.995) return null;
    const e = l.s.pts[l.s.pts.length - 1];
    const k = ease.out(prog(frame, l.s.at + l.s.frames, l.s.at + l.s.frames + 8, (t) => t));
    return <circle key={l.i} cx={e[0]} cy={e[1]} r={l.s.width * 0.5 * (1 + 0.1 * k)} fill="#fff" />;
  });
  return (
    <AbsoluteFill style={{background: P.paper}}>
      <Svg>
        <defs>
          <filter id="brsr-rough" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves={3} seed={4} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={dis} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="brsr-dry" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves={3} seed={4} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={dis * 1.3} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency={`${bristleF} ${0.5 * P.bristle}`} numOctaves={2} seed={9} result="s" />
            <feColorMatrix in="s" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  7 0 0 0 -2.9" result="sa" />
            <feComposite in="d" in2="sa" operator="in" />
          </filter>
          <filter id="brsr-ink" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} seed={12} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={dis * 1.15} xChannelSelector="G" yChannelSelector="R" />
          </filter>
          <mask id="brsr-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <rect width={W} height={H} fill="#000" />
            <g filter="url(#brsr-rough)">
              {draw((l) => l.p, 1, '#fff')}
              {pools}
            </g>
            <g filter="url(#brsr-dry)">{draw((l) => l.pDry, 1.2, '#fff', 0.9)}</g>
          </mask>
        </defs>
        {/* wet ink fringe under the image */}
        <g filter="url(#brsr-ink)" opacity={0.92}>
          {draw((l) => clamp(l.p * 1.05), 1.1, P.inkColor)}
        </g>
        <g mask="url(#brsr-mask)">
          <g transform={`translate(${W / 2},${H / 2}) scale(${zoom}) translate(${-W / 2},${-H / 2})`}>
            {P.src ? <image href={resolveSrc(P.src)} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" /> : <Painting W={W} H={H} pal={P.palette} frame={frame} />}
          </g>
          {(P.title || P.subtitle) && (
            <g opacity={titleA} transform={`translate(${W * 0.07},${H * (portrait ? 0.86 : 0.84) + (1 - titleA) * 14 * u})`}>
              {P.subtitle && (
                <text x={0} y={-fs * 1.05} fontFamily={fonts.mono} fontSize={fs * 0.26} letterSpacing={fs * 0.08} fill={P.textColor} opacity={0.85}>
                  {P.subtitle.toUpperCase()}
                </text>
              )}
              <text x={0} y={0} fontFamily={fonts.serif} fontWeight={700} fontSize={fs} fill={P.textColor} style={{textShadow: '0 2px 10px rgba(0,0,0,0.3)'}}>
                {P.title}
              </text>
            </g>
          )}
        </g>
      </Svg>
      <PaperTexture opacity={0.18} />
    </AbsoluteFill>
  );
};

export const brushStrokeReveal = defineMotion<Props>({
  id: 'brush-stroke-reveal',
  title: 'Brush-stroke reveal',
  category: 'image',
  description:
    'A picture is uncovered by thick brush strokes sweeping across the frame (zigzag rows, a spiral or diagonal passes): each stroke leads with a wet ink fringe, its edge breaks into dry-brush bristle streaks, and ink pools at the stroke ends; the revealed image (or a painted sunrise) drifts in slowly and a title lands when the last stroke ends.',
  source: ['prompt corpus x24 (brush strokes reveal shapes and images, ink pooling)'],
  useFor: 'Ink / painterly titles, heritage and cultural stories, festival greetings, art-brand reveals: pass `src` and `title`, or your own `strokes` as 0-1 coordinates.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    mode: 'zigzag',
    strokes: [],
    title: 'Morning Light',
    subtitle: 'A new season',
    inkColor: '#1d2230',
    paper: '#efe6d3',
    strokeFrames: 12,
    stagger: 9,
    width: 0.12,
    bristle: 1,
    roughness: 1,
    zoom: 1.05,
    palette: ['#f6c28b', '#f2e0c0', '#fff4d4', '#6f8f94', '#3f6a73', '#2c4f5a'],
    textColor: '#fff6e6',
  },
  propDocs: {
    src: 'image to reveal (public/ path or URL); empty = painted sunrise',
    mode: "auto strokes: 'zigzag' | 'spiral' | 'diagonal' (ignored when `strokes` is given)",
    strokes: '[{pts:[[x,y]...] (0-1 of frame), width? (fraction of short side), at?, frames?}] custom stroke paths',
    title: 'title revealed with the picture ("" = none)',
    subtitle: 'small caps line above the title',
    inkColor: 'wet ink fringe colour',
    paper: 'paper colour behind the strokes',
    strokeFrames: 'frames one stroke takes to sweep (8-14 feels like a real stroke)',
    stagger: 'frames between consecutive strokes',
    width: 'stroke width as a fraction of the short side (0.06-0.18)',
    bristle: 'dry-brush streak density (0 = clean edge)',
    roughness: 'edge displacement multiplier',
    zoom: 'slow push-in scale applied to the revealed image',
    palette: 'painted-sunrise colours: [sky top, sky low, sun, ridge 1, ridge 2, lake]',
    textColor: 'title colour',
  },
  component: BrushStrokeReveal,
  tags: ['brush', 'stroke', 'reveal', 'ink', 'sumi', 'paint', 'dry brush', 'mask', 'wipe', 'painterly', 'heritage', 'festival', 'image', 'title', 'zigzag', 'spiral', 'art'],
});
