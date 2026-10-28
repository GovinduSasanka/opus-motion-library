// Adapted from mg-styles-15/demos/08-morph/index.html (sampleD, resamplePoly, bestShift, alignTo) (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {mg1Fonts, mixHex} from '../../core/r2-mg1-kit';
import {P2, alignTo, bez, centroid, cl, flattenPath, mix, orient, ptsToD, resampleN} from '../../core/r2-mg1b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Shape = {name: string; fill: string; partFill: string; bg: string; body: string; hole?: string; parts?: string[]};
type Props = {
  shapes: Shape[];
  via: 'circle' | 'capsule' | 'none';
  holdFrames: number;
  morphFrames: number;
  startAt: number;
  squash: number;
  rotate: number;
  points: number;
  showLabels: boolean;
};

// ---- default icon set (200 x 200 box, centred) ----------------------------------------------------------------
const rays = (): string[] => {
  const o: string[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const P = (r: number, hw: number): string => `${(c * r - s * hw).toFixed(1)} ${(s * r + c * hw).toFixed(1)}`;
    const Q = (r: number, hw: number): string => `${(c * r + s * hw).toFixed(1)} ${(s * r - c * hw).toFixed(1)}`;
    o.push(`M${P(56, 8)}L${P(84, 4)}L${Q(84, 4)}L${Q(56, 8)}Z`);
  }
  return o;
};
const star = (): string => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 78 : 34;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    p.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r + 4).toFixed(1)}`);
  }
  return `M${p.join('L')}Z`;
};
const steam = (x: number) => `M${x - 4} -42C${x - 14} -52 ${x + 4} -60 ${x - 4} -74L${x + 5} -74C${x + 13} -60 ${x - 5} -52 ${x + 4} -42Z`;
const CIRCLE = (r: number, cy = 0) => `M${r} ${cy}C${r} ${cy + r * 0.552} ${r * 0.552} ${cy + r} 0 ${cy + r}C${-r * 0.552} ${cy + r} ${-r} ${cy + r * 0.552} ${-r} ${cy}C${-r} ${cy - r * 0.552} ${-r * 0.552} ${cy - r} 0 ${cy - r}C${r * 0.552} ${cy - r} ${r} ${cy - r * 0.552} ${r} ${cy}Z`;

const DEFAULT_SHAPES: Shape[] = [
  {
    name: 'Mug',
    fill: '#FF7A59',
    partFill: '#FFB199',
    bg: '#FFE9D6',
    body: 'M-60 -30L40 -30L40 40C40 54 30 62 16 62L-36 62C-50 62 -60 54 -60 40Z',
    parts: ['M40 -14C84 -14 84 40 40 40L40 25C64 25 64 0 40 0Z', steam(-30), steam(-5), steam(20)],
  },
  {name: 'Sun', fill: '#FFB627', partFill: '#FFD66B', bg: '#FFF1C9', body: CIRCLE(40), parts: rays()},
  {
    name: 'Plane',
    fill: '#3C8DFF',
    partFill: '#9CC7FF',
    bg: '#DDEBFF',
    body: 'M-84 -4L84 -52L-12 22Z',
    parts: ['M-12 22L84 -52L30 60Z', 'M-84 -4L-12 22L-40 44Z'],
  },
  {
    name: 'Pin',
    fill: '#E94F6B',
    partFill: '#FFB3C0',
    bg: '#FFE0E6',
    body: 'M0 72C-10 52 -52 16 -52 -20C-52 -50 -28 -70 0 -70C28 -70 52 -50 52 -20C52 16 10 52 0 72Z',
    hole: CIRCLE(20, -22),
  },
  {
    name: 'Heart',
    fill: '#B84DFF',
    partFill: '#E4B5FF',
    bg: '#F1E1FF',
    body: 'M0 62C-86 6 -66 -58 -30 -58C-12 -58 0 -44 0 -36C0 -44 12 -58 30 -58C66 -58 86 6 0 62Z',
    parts: ['M-48 -30C-48 -42 -36 -46 -26 -43C-36 -40 -40 -34 -40 -22Z'],
  },
  {name: 'Star', fill: '#2EC4A0', partFill: '#9BEBD5', bg: '#D5F6EB', body: star()},
];

const NH = 56;
const NP = 40;
const SLOTS = 10; // body, hole, 8 parts

type Slot = {a: P2[]; present: boolean};
const polyOf = (d: string | undefined, n: number): P2[] | null => {
  if (!d) return null;
  const sp = flattenPath(d, 16)[0];
  if (!sp) return null;
  return orient(resampleN(sp.pts, n, true));
};
const collapsed = (c: P2, n: number): P2[] => Array.from({length: n}, () => [c[0], c[1]] as P2);
const circlePoly = (r: number, n: number): P2[] => Array.from({length: n}, (_, i) => [r * Math.cos((i / n) * Math.PI * 2), r * Math.sin((i / n) * Math.PI * 2)] as P2);
const capsulePoly = (n: number): P2[] => {
  const hw = 62;
  const r = 30;
  const raw: P2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = -Math.PI / 2 + (i / 24) * Math.PI;
    raw.push([hw - r + r * Math.cos(t), r * Math.sin(t)]);
  }
  for (let i = 0; i <= 24; i++) {
    const t = Math.PI / 2 + (i / 24) * Math.PI;
    raw.push([-(hw - r) + r * Math.cos(t), r * Math.sin(t)]);
  }
  return orient(resampleN(raw, n, true));
};

type Proc = {body: P2[]; slots: (P2[] | null)[]; c: P2};

const ShapeMorphChain: React.FC<Props> = ({shapes, via, holdFrames, morphFrames, startAt, squash, rotate, points, showLabels}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const key = JSON.stringify([shapes, via, points]);
  const D = useMemo(() => {
    const procs: Proc[] = shapes.map((s) => {
      const body = polyOf(s.body, points) ?? circlePoly(40, points);
      const c = centroid(body);
      const slots: (P2[] | null)[] = [];
      slots.push(polyOf(s.hole, NH));
      for (let k = 0; k < SLOTS - 2; k++) slots.push(polyOf(s.parts?.[k], NP));
      return {body, slots, c};
    });
    const mid = via === 'capsule' ? capsulePoly(points) : circlePoly(46, points);
    const nS = SLOTS - 1; // slots after body
    const trans = procs.slice(0, -1).map((A, i) => {
      const B = procs[i + 1];
      const bodyA = A.body;
      const bodyB = B.body;
      const m1 = via === 'none' ? bodyB : alignTo(bodyA, mid);
      const b2 = via === 'none' ? alignTo(bodyA, bodyB) : alignTo(m1, bodyB);
      const sl = [] as {a: P2[]; mid: P2[]; b: P2[]}[];
      for (let k = 0; k < nS; k++) {
        const n = k === 0 ? NH : NP;
        const sa = A.slots[k];
        const sb = B.slots[k];
        const ca = collapsed(A.c, n);
        const cb = collapsed(B.c, n);
        const cm = collapsed([0, 0], n);
        const a = sa ?? ca;
        let b = sb ?? cb;
        if (sa && sb) b = alignTo(sa, sb, 1);
        sl.push({a, mid: via === 'none' ? b : cm, b});
      }
      return {bodyA, mid: via === 'none' ? bodyA : m1, bodyB: b2, sl};
    });
    return {procs, trans};
  }, [key]);
  const {procs, trans} = D;
  const n = shapes.length;
  const seg = holdFrames + morphFrames;
  const f = Math.max(0, frame - startAt);
  const idx = Math.min(n - 1, Math.floor(f / seg));
  const local = idx >= n - 1 ? holdFrames + 100 : f - idx * seg;
  const morphing = local >= holdFrames && idx < n - 1;
  const qLin = morphing ? cl((local - holdFrames) / morphFrames) : 0;
  const q = bez(0.7, 0, 0.3, 1)(qLin);
  const S = shapes[idx];
  const S2 = shapes[Math.min(n - 1, idx + 1)];
  const fill = morphing ? mixHex(S.fill, S2.fill, q) : S.fill;
  const partFill = morphing ? mixHex(S.partFill, S2.partFill, q) : S.partFill;
  const bg = morphing ? mixHex(S.bg, S2.bg, q) : S.bg;
  const lerpPts = (a: P2[], b: P2[], t: number): P2[] => a.map((p, i) => [mix(p[0], b[i][0], t), mix(p[1], b[i][1], t)]);
  let bodyPts: P2[];
  const partDs: string[] = [];
  let holeD = '';
  if (!morphing) {
    const P = procs[idx];
    bodyPts = P.body;
    if (P.slots[0]) holeD = ptsToD(P.slots[0]!);
    for (let k = 1; k < SLOTS - 1; k++) if (P.slots[k]) partDs.push(ptsToD(P.slots[k]!));
  } else {
    const T = trans[idx];
    const first = q < 0.5;
    const t = first ? q * 2 : (q - 0.5) * 2;
    if (via === 'none') {
      bodyPts = lerpPts(T.bodyA, T.bodyB, q);
      T.sl.forEach((s, k) => {
        const p = lerpPts(s.a, s.b, q);
        const d = ptsToD(p);
        if (k === 0) holeD = d;
        else partDs.push(d);
      });
    } else {
      bodyPts = first ? lerpPts(T.bodyA, T.mid, t) : lerpPts(T.mid, T.bodyB, t);
      T.sl.forEach((s, k) => {
        const p = first ? lerpPts(s.a, s.mid, t) : lerpPts(s.mid, s.b, t);
        const d = ptsToD(p);
        if (k === 0) holeD = d;
        else partDs.push(d);
      });
    }
  }
  const sinq = Math.sin(Math.PI * q);
  const dir = idx % 2 === 0 ? 1 : -1;
  const rot = morphing ? dir * rotate * sinq : 0;
  const stretchAng = dir * 28;
  const sq = morphing ? squash * sinq : 0;
  // arrival pop + idle breathing
  const arrive = !morphing && idx > 0 ? Math.exp(-(local * 0.34)) * Math.cos(local * 0.9) * 0.1 : 0;
  const idle = !morphing ? Math.sin(frame * 0.12) * 0.012 : 0;
  const intro = idx === 0 && !morphing ? Math.max(0, ease.back(prog(frame, 0, startAt + 10, ease.linear))) : 1;
  const lift = morphing ? -sinq * 46 : 0;
  const size = 2.5 * u;
  const bodyD = ptsToD(bodyPts) + (holeD ? holeD : '');
  const labelIn = morphing ? 1 - cl(qLin * 3) : prog(local, 0, 10, ease.out);
  const labelName = morphing && q > 0.5 ? S2.name : S.name;
  const shadowK = 1 - sinq * 0.35;
  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <ellipse cx={cx} cy={cy + 118 * size} rx={64 * size * shadowK} ry={9 * size * shadowK} fill="#000" opacity={0.1 * shadowK} />
        <g transform={`translate(${cx} ${cy + lift * size * 0.5}) scale(${size * intro * (1 + idle - arrive)})`}>
          <g transform={`rotate(${rot})`}>
            <g transform={`rotate(${stretchAng}) scale(${1 + sq} ${1 - sq * 0.7}) rotate(${-stretchAng})`}>
              {partDs.length > 0 && <path d={partDs.join('')} fill={partFill} fillRule="nonzero" />}
              <path d={bodyD} fill={fill} fillRule="evenodd" />
            </g>
          </g>
        </g>
        {showLabels && (
          <>
            <text
              x={cx}
              y={cy + 118 * size + 92 * u}
              textAnchor="middle"
              fontFamily={mg1Fonts.geo}
              fontWeight={700}
              fontSize={64 * u}
              letterSpacing={14 * u}
              fill={mixHex(fill, '#1b1b2f', 0.55)}
              opacity={labelIn}
            >
              {labelName.toUpperCase()}
            </text>
            {/* progress dots */}
            {shapes.map((_, i) => {
              const active = i === (morphing && q > 0.5 ? idx + 1 : idx);
              return <circle key={i} cx={cx + (i - (n - 1) / 2) * 34 * u} cy={h - 90 * u} r={(active ? 9 : 6) * u} fill={mixHex(fill, '#1b1b2f', 0.5)} opacity={active ? 1 : 0.35} />;
            })}
          </>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const shapeMorphChain = defineMotion<Props>({
  id: 'shape-morph-chain',
  title: 'Shape morph chain',
  category: 'shape',
  description:
    'A solid flat icon (mug, sun, paper plane, pin, heart, star) morphs into the next through a circle, rotating and stretching on the way; its sub-parts (steam, rays, wing folds, highlights) morph in lockstep through constant-count slots, and the field colour changes with each shape. Any SVG outline can be fed in.',
  source: ['mg-styles-15 demos/08-morph/index.html (sampleD, resamplePoly, bestShift, alignTo) (MIT)'],
  useFor: 'Product-to-benefit explainers, logo reveals and icon sequences for slides: the core visual-storytelling grammar of one shape becoming the next.',
  durationInFrames: 300,
  defaultProps: {
    shapes: DEFAULT_SHAPES,
    via: 'circle',
    holdFrames: 28,
    morphFrames: 22,
    startAt: 8,
    squash: 0.13,
    rotate: 22,
    points: 160,
    showLabels: true,
  },
  propDocs: {
    shapes: 'shapes[{name, fill, partFill, bg, body: svg path d, hole?: path d, parts?: path d[] (max 8)}] in a ±100 box',
    via: "'circle' | 'capsule' | 'none': the shape every outline passes through",
    holdFrames: 'frames each icon rests',
    morphFrames: 'frames of each morph (halves ~ 0.35 s at 30 fps)',
    startAt: 'frame the first morph cycle starts',
    squash: 'stretch along travel at mid-morph (0.12-0.14)',
    rotate: 'degrees of twist at mid-morph (18-26)',
    points: 'outline resolution of the body (more = smoother)',
    showLabels: 'show the icon name and progress dots',
  },
  component: ShapeMorphChain,
  tags: ['morph', 'shape morph', 'icons', 'flat vector', 'transform', 'storytelling', 'path interpolation', 'logo reveal', 'explainer', 'sequence'],
});
