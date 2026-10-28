import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {DemoScreen, DemoTone, DEMO, Pt, Rect, Stroke, edgePts, jitter, lineD, smoothD, textW, useExit, useNorm} from '../../core/r3-annot-kit';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Tutorial overlay: a marker pen circles, underlines, boxes or highlights a region of the footage. Each stroke is
 * drawn on with a wobbly hand, circles overshoot their start like a real loop, underlines scribble back. Transparent
 * by default; regions are 0-1 rectangles (x, y = top-left).
 */
type Mark = Rect & {
  type?: 'circle' | 'underline' | 'box' | 'highlight';
  label?: string;
  color?: string;
  at?: number;
};
type Props = {
  marks: Mark[];
  color: string;
  fontFamily: string;
  strokeWidth: number;
  passes: number;
  boil: boolean;
  startAt: number;
  stagger: number;
  speed: number;
  exitAt: number;
  seed: number;
  demoBackground: boolean;
  demoTone: DemoTone;
};

const ScribbleCircleHighlight: React.FC<Props> = ({marks, color, fontFamily, strokeWidth, passes, boil, startAt, stagger, speed, exitAt, seed, demoBackground, demoTone}) => {
  const frame = useCurrentFrame();
  const {w, h, u, px} = useNorm();
  const out = useExit(frame, exitAt);
  const sp = Math.max(0.2, speed);
  const bf = boil ? Math.floor(frame / 3) * 0.6 : 0;
  const sw = strokeWidth * u;

  return (
    <AbsoluteFill>
      <DemoScreen show={demoBackground} tone={demoTone} />
      <Svg>
        {marks.map((m, i) => {
          const at = m.at ?? startAt + i * stagger;
          const f = (frame - at) * sp;
          if (f < 0) return null;
          const col = m.color ?? color;
          const type = m.type ?? 'circle';
          const [x0, y0] = px(m.x, m.y);
          const rw = m.w * w;
          const rh = m.h * h;
          const cx = x0 + rw / 2;
          const cy = y0 + rh / 2;
          const s = `scr${seed}-${i}`;
          const els: React.ReactNode[] = [];
          let labelPos: Pt = [cx, y0 - 16 * u];

          if (type === 'circle') {
            const n = Math.max(1, Math.round(passes));
            for (let p = 0; p < n; p++) {
              const a = rw / 2 * (1.22 + p * 0.07) + 14 * u;
              const b = rh / 2 * (1.32 + p * 0.07) + 14 * u;
              const th0 = -2.2 + p * 0.9 + (i % 3) * 0.5;
              const turns = Math.PI * 2 * (1.14 + p * 0.04);
              const tilt = (-0.1 + p * 0.07) * (i % 2 ? -1 : 1);
              const pts: Pt[] = Array.from({length: 64}, (_, k) => {
                const q = k / 63;
                const th = th0 + turns * q;
                const grow = 0.955 + 0.095 * q;
                const ex = Math.cos(th) * a * grow;
                const ey = Math.sin(th) * b * grow;
                return [cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)] as Pt;
              });
              const d = smoothD(jitter(pts, s + 'c' + p, 2.4 * u, bf, 0.22));
              const t = prog(f, p * 6, p * 6 + 22, ease.out);
              els.push(<Stroke key={'c' + p} d={d} color={col} width={sw * (p ? 0.75 : 1)} t={t} opacity={p ? 0.85 : 1} />);
            }
            labelPos = [cx, cy - rh / 2 * 1.32 - 34 * u];
          } else if (type === 'underline') {
            const gy = y0 + rh + 10 * u;
            const slope = ((i % 2) * 2 - 1) * 5 * u;
            const A: Pt[] = edgePts([x0 - 8 * u, gy], [x0 + rw + 12 * u, gy + slope], 14);
            const B: Pt[] = edgePts([x0 + rw + 2 * u, gy + 12 * u + slope], [x0 + rw * 0.08, gy + 11 * u], 12);
            els.push(<Stroke key="a" d={smoothD(jitter(A, s + 'a', 2.2 * u, bf))} color={col} width={sw} t={prog(f, 0, 14, ease.out)} />);
            els.push(<Stroke key="b" d={smoothD(jitter(B, s + 'b', 2.4 * u, bf + 2))} color={col} width={sw * 0.8} t={prog(f, 10, 22, ease.out)} opacity={0.9} />);
            labelPos = [cx, y0 - 16 * u];
          } else if (type === 'box') {
            const pad = 8 * u;
            const L = x0 - pad;
            const R = x0 + rw + pad;
            const T = y0 - pad;
            const B = y0 + rh + pad;
            const ov = 10 * u;
            const n = Math.max(6, Math.round(Math.max(rw, rh) / (60 * u)));
            const poly: Pt[] = [
              ...edgePts([L - ov * 0.6, T + 2 * u], [R + ov, T - 2 * u], n),
              ...edgePts([R + 2 * u, T - ov], [R - 2 * u, B + ov * 0.8], n).slice(1),
              ...edgePts([R + ov * 0.7, B - 2 * u], [L - ov, B + 3 * u], n).slice(1),
              ...edgePts([L - 2 * u, B + ov], [L + 3 * u, T - ov * 1.4], n).slice(1),
            ];
            // sharp corners: jitter each straight run separately by keeping edges as sampled lines
            const j = jitter(poly, s + 'b', 1.7 * u, bf, 0.4);
            els.push(<Stroke key="box" d={lineD(j)} color={col} width={sw} t={prog(f, 0, 26, ease.inOut)} />);
            labelPos = [L + 4 * u, T - 22 * u];
          } else {
            // highlight: marker swath behind the text, drawn left to right
            const thick = Math.max(rh * 0.95, 16 * u);
            const my = cy + (i % 2 ? 1 : -1) * 1.5 * u;
            const pts: Pt[] = edgePts([x0 - 6 * u, my + 2 * u], [x0 + rw + 8 * u, my - 2 * u], 14);
            const d = smoothD(jitter(pts, s + 'h', 2.5 * u, bf));
            const t = prog(f, 0, 18, ease.out);
            if (t > 0.001) {
              els.push(
                <path key="h" d={d} fill="none" stroke={col} strokeOpacity={0.5} strokeWidth={thick} strokeLinecap="butt" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(t)} />,
              );
              els.push(
                <path key="h2" d={d} fill="none" stroke={col} strokeOpacity={0.35} strokeWidth={thick * 0.6} strokeLinecap="butt" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(prog(f, 4, 20, ease.out))} transform={`translate(0 ${thick * 0.12})`} />,
              );
            }
            labelPos = [cx, y0 - thick * 0.5 - 14 * u];
          }

          // label
          const label = m.label;
          const tl = prog(f, 14, 24, ease.back);
          const fs = 40 * u;
          let lab: React.ReactNode = null;
          if (label && tl > 0) {
            let [lx, ly] = labelPos;
            const lw = textW(label, fs, 0.44);
            lx = clamp(lx, lw / 2 + 16 * u, w - lw / 2 - 16 * u);
            if (ly < fs) ly = y0 + rh + fs * 1.3 + 22 * u;
            lab = (
              <g transform={`translate(${lx} ${ly}) rotate(${((i * 53) % 5) - 2}) scale(${tl})`}>
                <text textAnchor="middle" fill={col} stroke="rgba(6,8,14,0.92)" strokeWidth={fs * 0.22} paintOrder="stroke" strokeLinejoin="round" fontFamily={fontFamily} fontWeight={700} fontSize={fs}>
                  {label}
                </text>
              </g>
            );
          }
          return (
            <g key={i} opacity={out}>
              {els}
              {lab}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const scribbleCircleHighlight = defineMotion<Props>({
  id: 'scribble-circle-highlight',
  title: 'Scribble circle highlight',
  category: 'hud',
  description:
    'Tutorial annotation overlay on a transparent background: a marker pen draws a looping circle, a scribbled underline, a sketchy box or a translucent highlighter swath around chosen regions of the footage, each with an optional handwritten label.',
  source: ['screen-recording tutorial annotation'],
  useFor: 'Circle the button, underline the setting, box the table or highlight the number in any screen recording: pass `marks` with the region (x, y, w, h in 0-1), the mark `type` and your own label.',
  durationInFrames: 180,
  defaultProps: {
    marks: [
      {type: 'circle', x: DEMO.button.x, y: DEMO.button.y, w: DEMO.button.w, h: DEMO.button.h, label: 'New project'},
      {type: 'box', x: DEMO.chart.x + 0.02, y: DEMO.chart.y + 0.1, w: 0.46, h: 0.25, label: 'Spot the dip'},
      {type: 'underline', x: DEMO.stat1.x + 0.02, y: DEMO.stat1.y + 0.075, w: 0.12, h: 0.04},
      {type: 'highlight', x: DEMO.stat3.x + 0.02, y: DEMO.stat3.y + 0.075, w: 0.17, h: 0.04, label: 'Total'},
    ],
    color: '#FF9F0A',
    fontFamily: fonts.hand,
    strokeWidth: 7,
    passes: 2,
    boil: true,
    startAt: 8,
    stagger: 36,
    speed: 1,
    exitAt: 0,
    seed: 5,
    demoBackground: false,
    demoTone: 'light',
  },
  propDocs: {
    marks: 'array of {type: circle|underline|box|highlight, x, y, w, h (0-1 region, x/y = top-left), label?, color?, at?}',
    color: 'marker colour (per-mark override with `color`)',
    fontFamily: 'CSS font-family for labels',
    strokeWidth: 'marker width in u',
    passes: 'loops drawn for circle marks (1-3)',
    boil: 'redraw the wobble on threes',
    startAt: 'frame of the first mark',
    stagger: 'frames between marks',
    speed: 'animation speed multiplier',
    exitAt: 'frame everything fades at (0 = just before the end)',
    seed: 'wobble seed',
    demoBackground: 'true paints a neutral mock screen behind (previews); false = transparent overlay',
    demoTone: 'light | dark mock screen',
  },
  component: ScribbleCircleHighlight,
  tags: ['circle', 'highlight', 'marker', 'underline', 'box', 'annotation', 'tutorial', 'screen recording', 'hand-drawn', 'overlay', 'scribble', 'emphasis'],
});
