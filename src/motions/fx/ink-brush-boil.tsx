// Adapted from mg-styles-15/demos/05-cel-boil/js/engine.js (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
// (boil / outline / inkW / inkLoop / fillShape / hatch, ported to frame-driven SVG in src/core/r2-mg1-kit.tsx)
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {CEL, CelPaper, IP, P2, Slate, arclen, circlePts, clamp01, dens, fillShape, hatchStrokes, inkLoop, inkStroke, inv, polyD, spline, springT, E} from '../../core/r2-mg1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Subject = 'bulb' | 'mug' | 'star' | 'heart' | 'custom';
type Props = {
  background: string;
  subject: Subject;
  strokes: number[][][];
  caption: string;
  ink: string;
  fillColors: string[];
  inkWidth: number;
  boilAmp: number;
  boilScale: number;
  boilEvery: number;
  taper: number;
  heavySide: number;
  offRegister: number;
  drawDuration: number;
  hatch: boolean;
  size: number;
  slate: boolean;
  seed: number;
};

type Item = {kind: 'loop' | 'stroke'; pts: IP[]; fill?: number; w?: number; hi?: boolean};
type Shape = {items: Item[]; hatch?: P2[]};

const SUBJECTS: Record<Exclude<Subject, 'custom'>, Shape> = {
  mug: {
    items: [
      {kind: 'loop', fill: 0, pts: [[-150, -125, 1], [150, -125, 1], [142, 60], [120, 138], [72, 168], [-72, 168], [-120, 138], [-142, 60]]},
      {kind: 'loop', fill: 2, pts: circlePts(0, -125, 24, 40, 150), w: 0.8},
      {kind: 'stroke', pts: [[148, -72], [222, -78], [248, -4], [218, 66], [142, 84]], w: 1.15},
      {kind: 'stroke', pts: [[-235, 176], [-120, 204], [0, 212], [120, 204], [235, 176]]},
      {kind: 'stroke', pts: [[-55, -175], [-80, -215], [-45, -260], [-70, -310]], w: 0.7},
      {kind: 'stroke', pts: [[5, -180], [-20, -225], [15, -275], [-10, -330]], w: 0.7},
      {kind: 'stroke', pts: [[65, -175], [40, -215], [75, -258], [50, -305]], w: 0.7},
      {kind: 'stroke', pts: [[-105, -60], [-112, 30], [-92, 110]], w: 1.2, hi: true},
    ],
    hatch: [
      [60, 186],
      [300, 180],
      [330, 222],
      [40, 226],
    ],
  },
  bulb: {
    items: [
      {
        kind: 'loop',
        fill: 1,
        pts: [[-58, 110, 1], [-66, 60], [-128, -20], [-150, -110], [-112, -200], [0, -242], [112, -200], [150, -110], [128, -20], [66, 60], [58, 110, 1]],
      },
      {kind: 'loop', fill: 3, pts: [[-62, 112, 1], [62, 112, 1], [56, 196, 1], [-56, 196, 1]], w: 0.9},
      {kind: 'stroke', pts: [[-62, 140], [62, 140]], w: 0.7},
      {kind: 'stroke', pts: [[-58, 168], [58, 168]], w: 0.7},
      {kind: 'stroke', pts: [[-28, 198], [0, 226], [28, 198]], w: 0.9},
      {kind: 'stroke', pts: [[-34, 104], [-30, -40], [-15, -82], [0, -50], [15, -82], [30, -40], [34, 104]], w: 0.75},
      {kind: 'stroke', pts: [[-95, -150], [-60, -190]], w: 1.1, hi: true},
      ...Array.from({length: 7}, (_, i): Item => {
        const a = (-160 + i * 23.3) * (Math.PI / 180);
        return {kind: 'stroke', pts: [[Math.cos(a) * 205, -95 + Math.sin(a) * 205], [Math.cos(a) * 262, -95 + Math.sin(a) * 262]], w: 0.9};
      }),
    ],
    hatch: [
      [-62, 112],
      [62, 112],
      [56, 196],
      [-56, 196],
    ],
  },
  star: {
    items: [
      {
        kind: 'loop',
        fill: 1,
        pts: Array.from({length: 10}, (_, i): IP => {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const r = i % 2 ? 100 : 225;
          return [Math.cos(a) * r, Math.sin(a) * r + 15, i % 2 ? 0 : 1];
        }),
      },
      {kind: 'stroke', pts: [[-60, -40], [-85, 20], [-70, 70]], w: 1.2, hi: true},
      {kind: 'stroke', pts: [[-330, 120], [-250, 100]], w: 0.8},
      {kind: 'stroke', pts: [[-340, 170], [-240, 150]], w: 0.8},
      {kind: 'stroke', pts: [[-310, 220], [-250, 205]], w: 0.8},
    ],
    hatch: [
      [-120, 230],
      [200, 230],
      [230, 262],
      [-150, 262],
    ],
  },
  heart: {
    items: [
      {
        kind: 'loop',
        fill: 0,
        pts: Array.from({length: 32}, (_, i): IP => {
          const t = (i / 32) * Math.PI * 2;
          const x = 16 * Math.pow(Math.sin(t), 3);
          const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          return [x * 13.5, y * 13.5 - 10, i === 0 || i === 16 ? 1 : 0];
        }),
      },
      {kind: 'stroke', pts: [[-140, -120], [-160, -60], [-130, -5]], w: 1.2, hi: true},
      {kind: 'stroke', pts: [[200, -210], [240, -250]], w: 0.8},
      {kind: 'stroke', pts: [[225, -170], [280, -185]], w: 0.8},
    ],
    hatch: [
      [-120, 230],
      [140, 230],
      [170, 262],
      [-150, 262],
    ],
  },
};

const plen = (P: IP[]) => {
  let L = 0;
  for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  return L;
};

const InkBrushBoil: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const W = w / u;
  const H = h / u;
  const every = Math.max(1, Math.round(p.boilEvery));
  const id = Math.floor(frame / every);
  const fq = id * every;
  const tall = H > W * 1.2;
  const k = (tall ? 1.6 : 1.18) * p.size;
  const cx = W / 2;
  const cy = H / 2 - (tall ? 110 : 75);

  const shape: Shape = React.useMemo(() => {
    if (p.subject !== 'custom') return SUBJECTS[p.subject];
    const items: Item[] = (p.strokes || []).map((s) => {
      const pts = s.map(([x, y]) => [(x - 0.5) * 480, (y - 0.5) * 480] as IP);
      const closed = s.length > 2 && Math.hypot(s[0][0] - s[s.length - 1][0], s[0][1] - s[s.length - 1][1]) < 0.02;
      return closed ? {kind: 'loop', pts: pts.slice(0, -1), fill: 0} : {kind: 'stroke', pts};
    });
    return {items};
  }, [p.subject, p.strokes]);

  // per-item draw windows, proportional to length
  const lens = shape.items.map((it) => plen(it.kind === 'loop' ? [...it.pts, it.pts[0]] : it.pts) + 60);
  const tot = lens.reduce((a, b) => a + b, 0);
  const D0 = 6;
  let acc = 0;
  const windows = lens.map((L) => {
    const a = D0 + (acc / tot) * p.drawDuration;
    acc += L;
    return [a, D0 + (acc / tot) * p.drawDuration] as [number, number];
  });
  const endDraw = D0 + p.drawDuration;

  const T = (P: IP[]): IP[] => P.map(([x, y, c]) => [cx + x * k, cy + y * k, c]);
  // life after drawing: gentle bob on the drawing grid
  const bob = frame > endDraw ? Math.sin(((fq - endDraw) / 30) * Math.PI * 1.2) * 6 : 0;
  const settle = springT((fq - endDraw) / 30, 2.2, 0.35);
  const sq = frame > endDraw ? 1 + 0.05 * (1 - settle) * Math.cos((fq - endDraw) * 0.6) : 1;
  const BX = (P: IP[]): IP[] => P.map(([x, y, c]) => [x, cy + (y - cy) * sq + bob, c]);

  const ink = p.ink;
  const reg: [number, number] = [-p.offRegister, p.offRegister * 0.8];
  const base = {w: 7 * p.inkWidth, amp: 2.3 * p.boilAmp, scale: 70 * p.boilScale, heavy: p.heavySide, t0: 14 * p.taper, t1: 26 * p.taper};
  const fills: React.ReactNode[] = [];
  const lines: React.ReactNode[] = [];
  shape.items.forEach((it, i) => {
    const [a, b] = windows[i];
    const dp = E.io2(clamp01(inv(a, b, fq)));
    if (dp <= 0) return;
    const sd = p.seed * 131 + i * 17 + id * 7;
    const pts = BX(T(it.pts));
    const wmul = it.w ?? 1;
    if (it.kind === 'loop') {
      const dense = spline(pts, true, 4);
      if (it.fill !== undefined && fq >= b + 2) {
        const pop = springT((fq - b - 2) / 30, 3, 0.5);
        const col = p.fillColors[it.fill % p.fillColors.length];
        fills.push(<path key={'f' + i} d={fillShape(dense, {seed: sd + 1, amp: base.amp * 0.9, scale: base.scale, dx: reg[0] * pop, dy: reg[1] * pop})} fill={col} opacity={Math.min(1, pop * 1.4)} />);
      }
      inkLoop(dense, {...base, w: base.w * wmul, seed: sd, splits: 2, draw: dp}).forEach((d, j) => lines.push(<path key={`l${i}-${j}`} d={d} fill={ink} />));
    } else {
      (it.hi ? fills : lines).push(<path key={'s' + i} d={inkStroke(pts, {...base, w: base.w * wmul, seed: sd, draw: dp, heavy: it.hi ? 0 : base.heavy})} fill={it.hi ? CEL.hi : ink} />);
    }
  });

  // hatched cast shadow
  let hatchEl: React.ReactNode = null;
  if (p.hatch && shape.hatch && fq > endDraw - 10) {
    const hp = clamp01(inv(endDraw - 10, endDraw + 8, fq));
    const poly = BX(T(shape.hatch.map(([x, y]) => [x, y] as IP))).map(([x, y]) => [x, y] as P2);
    const hs2 = hatchStrokes(dens(poly, 8), {seed: p.seed * 7 + id, gap: 12, ang: -0.95, w: 2.1 * p.inkWidth, amp: 1.4 * p.boilAmp});
    const n = Math.ceil(hs2.length * hp);
    hatchEl = (
      <g>
        <clipPath id="mg1-ibb-hatch">
          <path d={polyD(poly)} />
        </clipPath>
        <g clipPath="url(#mg1-ibb-hatch)">
          {hs2.slice(0, n).map((d, i) => (
            <path key={i} d={d} fill={ink} opacity={0.85} />
          ))}
        </g>
      </g>
    );
  }

  // hand-lettered caption with a brush underline
  const capY = cy + 300 * k + (tall ? 40 : 0);
  const capP = clamp01(inv(endDraw + 4, endDraw + 22, fq));
  const capSize = Math.min(110, (W * 0.8) / Math.max(4, p.caption.length * 0.48));
  const ulW = Math.min(W * 0.7, p.caption.length * capSize * 0.5);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <g transform={`scale(${u})`}>
          <CelPaper w={W} h={H} color={p.background} drawing={id} id="mg1-ibb" />
          {fills}
          {hatchEl}
          {lines}
          {p.caption && capP > 0 && (
            <g>
              <clipPath id="mg1-ibb-cap">
                <rect x={cx - ulW / 2 - 40} y={capY - capSize} width={(ulW + 80) * capP} height={capSize * 1.4} />
              </clipPath>
              <text
                x={cx + (((id * 7) % 3) - 1)}
                y={capY + (((id * 5) % 3) - 1)}
                textAnchor="middle"
                fontFamily={fonts.hand}
                fontWeight={700}
                fontSize={capSize}
                fill={ink}
                clipPath="url(#mg1-ibb-cap)"
                transform={`rotate(${-1.5 + ((id % 3) - 1) * 0.3} ${cx} ${capY})`}
              >
                {p.caption}
              </text>
              <path
                d={inkStroke(
                  [
                    [cx - ulW / 2, capY + capSize * 0.3],
                    [cx, capY + capSize * 0.38],
                    [cx + ulW / 2, capY + capSize * 0.24],
                  ],
                  {...base, w: base.w * 1.1, seed: p.seed + id, draw: clamp01(inv(endDraw + 14, endDraw + 26, fq)), t1: 60},
                )}
                fill={p.fillColors[0]}
              />
            </g>
          )}
          {p.slate && <Slate W={W} H={H} scene="INK" drawing={id} step={every} font={fonts.hand} offset={1} />}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const inkBrushBoil = defineMotion<Props>({
  id: 'ink-brush-boil',
  title: 'Ink brush boil',
  category: 'fx',
  description:
    'A doodle (light bulb, mug, star, heart or your own strokes) inks itself on warm paper with real brush lines — tapered ends, pressure wobble, heavier on the shadow side — then flat fills drop in off-register, a hatched shadow scratches in, a hand-lettered caption writes on, and every line keeps breathing (re-drawn each exposure).',
  source: ['mg-styles-15 05-cel-boil engine.js boil/outline/inkW/inkLoop/hatch (MIT, Vincentwei1021) — technique after mg-styles-15'],
  useFor: 'Hand-made, craft or "drawn for you" moments: ideas (bulb), coffee breaks, ratings, love/likes, or any line art you feed as strokes; the kit upgrades any doodle to brush ink.',
  durationInFrames: 180,
  defaultProps: {
    background: '#F4E9D0',
    subject: 'bulb',
    strokes: [],
    caption: 'bright idea',
    ink: '#1C1613',
    fillColors: ['#E5402B', '#FFC425', '#3B2A22', '#B9B0A2'],
    inkWidth: 1,
    boilAmp: 1,
    boilScale: 1,
    boilEvery: 2,
    taper: 1,
    heavySide: 0.35,
    offRegister: 5,
    drawDuration: 70,
    hatch: true,
    size: 1,
    slate: true,
    seed: 1,
  },
  propDocs: {
    background: 'paper colour',
    subject: 'bulb | mug | star | heart | custom (uses `strokes`)',
    strokes: 'custom: list of strokes, each a list of [x,y] in 0..1; a stroke whose last point equals its first is a filled loop',
    caption: 'hand-lettered caption under the drawing ("" to hide)',
    ink: 'ink colour',
    fillColors: 'flat fill colours (subject parts pick by index; first is also the underline)',
    inkWidth: 'brush width multiplier (6 px base at 1080p)',
    boilAmp: 'boil amplitude multiplier (2.3 px base)',
    boilScale: 'boil noise scale multiplier (70 px base; bigger = smoother wobble)',
    boilEvery: 'frames per drawing (2 = on twos, 3 = on threes)',
    taper: 'taper length multiplier (14 px in / 26 px out)',
    heavySide: 'extra weight on the lower-right shadow side (0–1)',
    offRegister: 'colour-to-line misregistration in px',
    drawDuration: 'frames to ink the whole drawing',
    hatch: 'hatched cast shadow',
    size: 'drawing scale',
    slate: 'show the drawing counter',
    seed: 'variation seed',
  },
  component: InkBrushBoil,
  tags: ['ink', 'brush', 'line boil', 'hand-drawn', 'doodle', 'cel', 'tapered stroke', 'pressure', 'off-register', 'hatch', 'paper', 'on twos', 'draw on', 'light bulb', 'idea', 'mug', 'star', 'heart', 'mg-styles-15', 'cel-boil'],
});
