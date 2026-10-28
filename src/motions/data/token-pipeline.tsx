import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {easeInOutSine, easeInQuad, easeOutQuad, h01, lin, shadeHex, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x7 token-pipeline: a Rube-Goldberg glass lab. Small glowing cubes swirl in a source bulb, stream out one by one
 * (≈ 0.07 s apart) through an arched glass tube, spiral down a gold-ringed glass coil and run to a dropper that
 * swells a drop (0.5 s easeOutQuad), glints for a frame, and lets it fall with gravity into a labelled flask.
 * The camera follows the flow vessel to vessel (easeInOutSine) and pulls back at the end to show the whole lab.
 */
type Props = {
  background: string;
  cubeColor: string;
  outputColor: string;
  glass: string;
  gold: string;
  count: number;
  gap: number;
  speed: number;
  sourceLabel: string;
  targetLabel: string;
  dropAt: number;
  seed: number;
};

type P = [number, number];

const buildPath = (): P[] => {
  const pts: P[] = [];
  // out of the bulb top, up the arch
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const a = Math.PI * (1 - t);
    pts.push([0.55 + Math.cos(a) * 0.55, -0.3 - Math.sin(a) * 0.32]);
  }
  // down into the coil (4 turns)
  const top = -0.25;
  const bot = 0.38;
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const a = t * Math.PI * 2 * 4;
    pts.push([1.1 + Math.sin(a) * 0.12, top + (bot - top) * t + Math.cos(a) * 0.02]);
  }
  // across to the dropper
  for (let i = 1; i <= 20; i++) {
    const t = i / 20;
    pts.push([1.1 + 0.55 * t, 0.38 + Math.sin(Math.PI * t) * -0.1 - 0.18 * t]);
  }
  pts.push([1.65, 0.28]);
  return pts;
};

const PATH = buildPath();
const LENS = (() => {
  const l = [0];
  for (let i = 1; i < PATH.length; i++) l.push(l[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]));
  return l;
})();
const TOTAL = LENS[LENS.length - 1];
const at = (d: number): P => {
  const dd = Math.max(0, Math.min(TOTAL, d));
  let i = 1;
  while (i < LENS.length - 1 && LENS[i] < dd) i++;
  const k = (dd - LENS[i - 1]) / Math.max(1e-6, LENS[i] - LENS[i - 1]);
  return [PATH[i - 1][0] + (PATH[i][0] - PATH[i - 1][0]) * k, PATH[i - 1][1] + (PATH[i][1] - PATH[i - 1][1]) * k];
};

const TokenPipeline: React.FC<Props> = ({background, cubeColor, outputColor, glass, gold, count, gap, speed, sourceLabel, targetLabel, dropAt, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const S = Math.min(w, h) * (portrait ? 0.95 : 1);
  const t = frame / fps;
  // camera anchors (world units) over time
  const anchors: {f: number; x: number; y: number; z: number}[] = [
    {f: 0, x: 0, y: 0, z: 1.25},
    {f: 18, x: 0.2, y: -0.2, z: 1.2},
    {f: 42, x: 0.9, y: -0.1, z: 1.15},
    {f: 66, x: 1.25, y: 0.2, z: 1.15},
    {f: dropAt, x: 1.6, y: 0.35, z: 1.2},
    {f: dropAt + 16, x: 1.6, y: 0.75, z: 1.05},
    {f: dropAt + 40, x: 0.85, y: 0.4, z: portrait ? 0.4 : 0.62},
  ];
  let ci = 0;
  while (ci < anchors.length - 2 && frame >= anchors[ci + 1].f) ci++;
  const A = anchors[ci];
  const B = anchors[ci + 1];
  const ck = easeInOutSine(lin(frame, A.f, B.f));
  const cam = {x: A.x + (B.x - A.x) * ck, y: A.y + (B.y - A.y) * ck, z: A.z + (B.z - A.z) * ck};
  const sc = S * cam.z * (portrait ? 0.78 : 1);
  const X = (x: number) => w / 2 + (x - cam.x) * sc;
  const Y = (y: number) => h / 2 + (y - cam.y) * sc;
  const L = (v: number) => v * sc;
  const tube = 'M' + PATH.slice(0, 31).map(([x, y]) => `${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(' L');
  const coilPath = 'M' + PATH.slice(31, 152).map(([x, y]) => `${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(' L');
  const outTube = 'M' + PATH.slice(151).map(([x, y]) => `${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(' L');
  const cubes: React.ReactNode[] = [];
  const spd = speed; // world units per second
  for (let i = 0; i < count; i++) {
    const start = 6 + i * gap;
    const d = ((frame - start) / fps) * spd;
    if (d < 0 || d > TOTAL) continue;
    const [x, y] = at(d);
    const s = L(0.022);
    cubes.push(
      <g key={i} transform={`translate(${X(x)} ${Y(y)}) rotate(${(frame - start) * 9 + i * 20})`}>
        <rect x={-s / 2} y={-s / 2} width={s} height={s} fill={cubeColor} />
        <rect x={-s / 2} y={-s / 2} width={s} height={s * 0.35} fill={shadeHex(cubeColor, 0.4)} />
      </g>,
    );
  }
  // swirling cubes inside the bulb (still waiting)
  const waiting = Array.from({length: 18}, (_, i) => {
    const a = t * 2.2 + i * 1.7;
    const r = 0.06 + 0.12 * h01(i, seed);
    const left = count - Math.floor(Math.max(0, frame - 6) / gap);
    if (i >= left) return null;
    const s = L(0.02);
    return <rect key={`w${i}`} x={X(Math.cos(a) * r) - s / 2} y={Y(-0.02 + Math.sin(a * 1.3) * r * 0.8) - s / 2} width={s} height={s} fill={cubeColor} transform={`rotate(${a * 60} ${X(Math.cos(a) * r)} ${Y(-0.02 + Math.sin(a * 1.3) * r * 0.8)})`} />;
  });
  // drop
  const swell = easeOutQuad(lin(frame, dropAt - 15, dropAt));
  const fall = lin(frame, dropAt + 1, dropAt + 11);
  const dropY = 0.33 + easeInQuad(fall) * 0.66;
  const landed = frame >= dropAt + 11;
  const fill = landed ? Math.min(1, 0.55 + 0.45 * lin(frame, dropAt + 11, dropAt + 20)) : 0.55;
  const glint = frame === dropAt;
  const glassStroke = {stroke: glass, strokeOpacity: 0.22, fill: 'none'} as const;
  const lfs = L(0.035);
  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id={`tp-g-${seed}`}>
            <stop offset="0%" stopColor={cubeColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={cubeColor} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`tp-l-${seed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shadeHex(outputColor, 0.3)} />
            <stop offset="100%" stopColor={shadeHex(outputColor, -0.2)} />
          </linearGradient>
        </defs>
        {/* faint background stars + rays */}
        {Array.from({length: 80}, (_, i) => (
          <circle key={i} cx={h01(i, 1) * w} cy={h01(i, 2) * h} r={1.2 * u} fill="#fff" opacity={0.15 + 0.2 * h01(i, 3)} />
        ))}
        {/* bulb on a stand */}
        <rect x={X(-0.12)} y={Y(0.27)} width={L(0.24)} height={L(0.2)} fill="#2C44B8" />
        <rect x={X(-0.16)} y={Y(0.45)} width={L(0.32)} height={L(0.05)} fill="#22349A" />
        <circle cx={X(0)} cy={Y(0)} r={L(0.4)} fill={`url(#tp-g-${seed})`} />
        <circle cx={X(0)} cy={Y(0)} r={L(0.28)} fill={glass} fillOpacity={0.08} stroke={glass} strokeOpacity={0.6} strokeWidth={L(0.008)} />
        <path d={`M${X(-0.2)} ${Y(-0.12)} A${L(0.24)} ${L(0.24)} 0 0 1 ${X(0.02)} ${Y(-0.25)}`} stroke="#fff" strokeWidth={L(0.012)} fill="none" opacity={0.7} strokeLinecap="round" />
        <path d={`M${X(0.24)} ${Y(0.08)} A${L(0.26)} ${L(0.26)} 0 0 1 ${X(0.14)} ${Y(0.22)}`} stroke="#F08A4B" strokeWidth={L(0.01)} fill="none" opacity={0.8} />
        {waiting}
        {/* source tag */}
        <g transform={`translate(${X(0.12)} ${Y(-0.3)}) rotate(8)`}>
          <rect x={0} y={-lfs} width={lfs * sourceLabel.length * 0.62 + lfs} height={lfs * 1.5} fill="#F3EAD6" stroke="#1A1430" strokeWidth={L(0.003)} />
          <text x={lfs * 0.5} y={lfs * 0.22} fontFamily={x58Fonts.lilita} fontSize={lfs} fill="#1A1430">
            {sourceLabel}
          </text>
        </g>
        {/* tubes */}
        <path d={tube} {...glassStroke} strokeWidth={L(0.04)} strokeLinecap="round" />
        <path d={tube} stroke="#fff" strokeOpacity={0.4} strokeWidth={L(0.006)} fill="none" transform={`translate(0 ${-L(0.012)})`} />
        {/* coil cage with gold rings */}
        <rect x={X(0.95)} y={Y(-0.3)} width={L(0.3)} height={L(0.75)} fill={glass} fillOpacity={0.06} stroke={glass} strokeOpacity={0.4} strokeWidth={L(0.004)} />
        <path d={coilPath} {...glassStroke} strokeWidth={L(0.03)} />
        <path d={coilPath} stroke="#fff" strokeOpacity={0.25} strokeWidth={L(0.004)} fill="none" />
        {[-0.3, -0.05, 0.2, 0.45].map((y, i) => (
          <ellipse key={i} cx={X(1.1)} cy={Y(y)} rx={L(0.17)} ry={L(0.035)} fill="none" stroke={gold} strokeWidth={L(0.018)} />
        ))}
        <path d={outTube} {...glassStroke} strokeWidth={L(0.03)} strokeLinecap="round" />
        <path d={outTube} stroke="#fff" strokeOpacity={0.35} strokeWidth={L(0.005)} fill="none" />
        {cubes}
        {/* dropper */}
        <rect x={X(1.62)} y={Y(0.22)} width={L(0.06)} height={L(0.08)} fill={gold} />
        <ellipse cx={X(1.65)} cy={Y(0.3)} rx={L(0.05)} ry={L(0.012)} fill={shadeHex(gold, -0.2)} />
        {frame < dropAt + 1 ? (
          <ellipse cx={X(1.65)} cy={Y(0.31 + 0.02 * swell)} rx={L(0.016 * swell)} ry={L(0.022 * swell)} fill={outputColor} />
        ) : !landed ? (
          <ellipse cx={X(1.65)} cy={Y(dropY)} rx={L(0.014)} ry={L(0.022)} fill={outputColor} />
        ) : null}
        {glint ? <path d={`M${X(1.66)} ${Y(0.29)} l${L(0.02)} ${L(0.02)} l${-L(0.02)} ${L(0.02)} l${-L(0.02)} ${-L(0.02)}Z`} fill="#fff" /> : null}
        {/* flask */}
        <path
          d={`M${X(1.6)} ${Y(0.7)} L${X(1.6)} ${Y(0.82)} L${X(1.44)} ${Y(1.12)} L${X(1.86)} ${Y(1.12)} L${X(1.7)} ${Y(0.82)} L${X(1.7)} ${Y(0.7)}Z`}
          fill={glass}
          fillOpacity={0.08}
          stroke={glass}
          strokeOpacity={0.7}
          strokeWidth={L(0.006)}
        />
        <clipPath id={`tp-fc-${seed}`}>
          <path d={`M${X(1.6)} ${Y(0.82)} L${X(1.44)} ${Y(1.12)} L${X(1.86)} ${Y(1.12)} L${X(1.7)} ${Y(0.82)}Z`} />
        </clipPath>
        <rect x={X(1.4)} y={Y(1.12 - 0.3 * fill * 0.7)} width={L(0.5)} height={L(0.3)} fill={`url(#tp-l-${seed})`} clipPath={`url(#tp-fc-${seed})`} />
        {landed && frame < dropAt + 20
          ? [0, 1, 2, 3].map((i) => {
              const k = lin(frame, dropAt + 11, dropAt + 20);
              return <circle key={i} cx={X(1.65 + (i - 1.5) * 0.03 * (1 + k * 2))} cy={Y(1.12 - 0.21 - k * 0.06 * (1 - Math.abs(i - 1.5) / 2))} r={L(0.008)} fill={outputColor} opacity={1 - k} />;
            })
          : null}
        <g transform={`translate(${X(1.52)} ${Y(1.02)}) rotate(-8)`}>
          <rect x={0} y={-lfs} width={lfs * targetLabel.length * 0.62 + lfs} height={lfs * 1.5} fill="#F3EAD6" stroke="#1A1430" strokeWidth={L(0.003)} />
          <text x={lfs * 0.5} y={lfs * 0.22} fontFamily={x58Fonts.lilita} fontSize={lfs} fill="#1A1430">
            {targetLabel}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const tokenPipeline = defineMotion<Props>({
  id: 'token-pipeline',
  title: 'Token pipeline',
  category: 'data',
  description:
    'A glass-lab pipeline: glowing cubes swirl in a source bulb, stream one by one through an arched tube, spiral down a gold-ringed glass coil and reach a dropper that swells a drop, glints and drips it into a labelled flask, while the camera follows the flow and pulls back to reveal the whole lab.',
  source: ['video x7 0.0-3.75 s (bulb, tube, coil, dropper, flask)'],
  useFor: 'Training / build / pipeline explainers ("your data goes in…"), product origin stories, "tokens in, model out" moments.',
  durationInFrames: 150,
  defaultProps: {
    background: '#070A24',
    cubeColor: '#F27A2E',
    outputColor: '#47AFF7',
    glass: '#CFE6FF',
    gold: '#D49A4A',
    count: 34,
    gap: 2,
    speed: 1.5,
    sourceLabel: 'DATA',
    targetLabel: 'v2.0',
    dropAt: 96,
    seed: 2,
  },
  propDocs: {
    background: 'scene background',
    cubeColor: 'token cube colour',
    outputColor: 'drop / flask liquid colour',
    glass: 'glass tint',
    gold: 'coil rings / dropper colour',
    count: 'cubes that travel the pipeline',
    gap: 'frames between cubes leaving the bulb',
    speed: 'cube speed along the tubes (world units per second)',
    sourceLabel: 'paper tag on the source bulb',
    targetLabel: 'paper tag on the flask',
    dropAt: 'frame the drop releases (it swells for 15 frames before)',
    seed: 'swirl seed',
  },
  component: TokenPipeline,
  tags: ['pipeline', 'tokens', 'data', 'lab', 'glass', 'flask', 'coil', 'process', 'training', 'build', 'flow', 'explainer', 'machine', 'product origin'],
});
