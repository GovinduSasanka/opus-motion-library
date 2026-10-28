// Adapted from mg-styles-15/demos/10-synthwave/index.html (sceneTime) and audio.py (tape stop) (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {TapeRemap, TapeSeg, hash, tapeFrame} from '../../core/r2-mg2b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * The picture itself behaves like worn tape: it steps down to 15 fps while "tracking", blips two or three frames
 * backwards (a rewind jolt), drags at 15 fps into the drop and finally winds down at half speed. The demo subject is a
 * cassette with turning reels, a VU meter and a bouncing ball so every skipped, repeated and slowed frame is visible; a
 * small OSD and a source-time curve show the remap. `TapeRemap` (exported from `src/core/r2-mg2b-kit.tsx`) applies the
 * same segments to any other motion.
 */
type Props = {
  segments: {from: number; to: number; mode: 'normal' | 'step' | 'reverse' | 'half'}[];
  stepEvery: number;
  jitter: number;
  showGraph: boolean;
  label: string;
  body: string;
  accent: string;
  background: string;
};

const MODE_LABEL: Record<string, string> = {normal: 'PLAY ▶', step: 'TRACKING 15', reverse: '◀ REW', half: 'SLOW 1/2'};

const Cassette: React.FC<{body: string; accent: string; label: string}> = ({body, accent, label}) => {
  const t = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const cw = Math.min(w * 0.7, 820 * u);
  const ch = cw * 0.62;
  const x0 = cx - cw / 2;
  const y0 = cy - ch / 2 - h * 0.04;
  const reel = (rx: number, dir: number, r: number) => (
    <g transform={`translate(${rx},${y0 + ch * 0.47}) rotate(${t * 9 * dir})`}>
      <circle r={r} fill="#14101c" stroke="#e9e4f2" strokeWidth={4 * u} />
      {Array.from({length: 6}, (_, i) => (
        <rect key={i} x={-r * 0.12} y={-r * 0.96} width={r * 0.24} height={r * 0.34} fill="#e9e4f2" transform={`rotate(${i * 60})`} />
      ))}
      <circle r={r * 0.36} fill="none" stroke="#e9e4f2" strokeWidth={5 * u} />
    </g>
  );
  const bars = Array.from({length: 14}, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(t * 0.21 + i * 0.7) * Math.cos(t * 0.13 + i)));
  const bx = cx - cw * 0.36;
  const by = y0 + ch + 56 * u;
  const bounceP = (t % 80) / 80;
  const ballX = x0 + bounceP * cw;
  const ballY = by + 58 * u - Math.abs(Math.sin(bounceP * Math.PI * 3)) * 110 * u;
  return (
    <g>
      <rect x={x0} y={y0} width={cw} height={ch} rx={26 * u} fill={body} stroke="#05040a" strokeWidth={6 * u} />
      <rect x={x0 + cw * 0.08} y={y0 + ch * 0.08} width={cw * 0.84} height={ch * 0.26} rx={10 * u} fill="#f3ecda" />
      <rect x={x0 + cw * 0.08} y={y0 + ch * 0.08} width={cw * 0.84} height={ch * 0.07} fill={accent} />
      <text x={cx} y={y0 + ch * 0.27} textAnchor="middle" fontFamily={fonts.display} fontSize={ch * 0.11} fill="#2a1f3a">
        {label}
      </text>
      <rect x={x0 + cw * 0.14} y={y0 + ch * 0.36} width={cw * 0.72} height={ch * 0.3} rx={ch * 0.15} fill="#0c0914" />
      {reel(x0 + cw * 0.3, 1, ch * 0.13)}
      {reel(x0 + cw * 0.7, 1, ch * 0.13)}
      <path d={`M${x0 + cw * 0.26} ${y0 + ch * 0.76} L${x0 + cw * 0.74} ${y0 + ch * 0.76}`} stroke="#14101c" strokeWidth={12 * u} />
      <polygon points={`${x0 + cw * 0.22},${y0 + ch} ${x0 + cw * 0.28},${y0 + ch * 0.8} ${x0 + cw * 0.72},${y0 + ch * 0.8} ${x0 + cw * 0.78},${y0 + ch}`} fill="#1a1528" />
      {bars.map((b, i) => (
        <rect key={i} x={bx + i * (cw * 0.72 / 14)} y={by + 40 * u - b * 70 * u} width={cw * 0.72 / 14 - 6 * u} height={b * 70 * u} fill={i > 10 ? '#ff4d6d' : i > 7 ? '#ffd23a' : accent} opacity={0.92} />
      ))}
      <circle cx={ballX} cy={ballY} r={18 * u} fill="#fff" />
      <circle cx={ballX - 5 * u} cy={ballY - 6 * u} r={5 * u} fill="#ffffffaa" />
    </g>
  );
};

const TapeStutter: React.FC<Props> = ({segments, stepEvery, jitter, showGraph, label, body, accent, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames} = useStage();
  const segs = segments as TapeSeg[];
  const cur = segs.find((s) => frame >= s.from && frame < s.to);
  const mode = cur?.mode ?? 'normal';
  const src = tapeFrame(frame, segs, stepEvery);
  const jx = mode !== 'normal' ? (hash(frame * 3 + 1) - 0.5) * jitter * u : 0;
  const jy = mode === 'reverse' ? (hash(frame * 3 + 2) - 0.5) * jitter * 1.6 * u : 0;
  // graph geometry
  const gw = Math.min(w * 0.7, 820 * u);
  const gh = 120 * u;
  const gx = w / 2 - gw / 2;
  const gy = h - 190 * u;
  const pts = Array.from({length: durationInFrames}, (_, f) => `${gx + (f / (durationInFrames - 1)) * gw},${gy + gh - (tapeFrame(f, segs, stepEvery) / (durationInFrames - 1)) * gh}`).join(' ');
  const px = gx + (frame / (durationInFrames - 1)) * gw;
  const py = gy + gh - (src / (durationInFrames - 1)) * gh;
  const sec = (f: number) => (f / fps).toFixed(2);
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <defs>
          <linearGradient id="tsbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b1030" />
            <stop offset="1" stopColor="#07040f" />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill="url(#tsbg)" opacity={0.9} />
      </Svg>
      <AbsoluteFill style={{transform: `translate(${jx}px,${jy}px)`}}>
        <TapeRemap segments={segs} stepEvery={stepEvery}>
          <Svg>
            <Cassette body={body} accent={accent} label={label} />
          </Svg>
        </TapeRemap>
      </AbsoluteFill>
      <Svg>
        {mode !== 'normal' &&
          Array.from({length: 3}, (_, i) => {
            const yy = ((hash(frame * 7 + i) * 0.9 + 0.05) * h) | 0;
            return <rect key={i} x={0} y={yy} width={w} height={(2 + hash(frame + i) * 5) * u} fill="#fff" opacity={0.1 + 0.12 * hash(frame * 5 + i)} />;
          })}
        <text x={64 * u} y={96 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={44 * u} fill={mode === 'reverse' ? '#ff4d6d' : '#c8ffd0'} style={{letterSpacing: 3 * u}}>
          {MODE_LABEL[mode]}
        </text>
        <text x={w - 64 * u} y={96 * u} textAnchor="end" fontFamily={fonts.mono} fontSize={30 * u} fill="#ffffffbb">
          {`OUT ${sec(frame)}  SRC ${sec(src)}`}
        </text>
        {showGraph && (
          <g>
            <rect x={gx} y={gy} width={gw} height={gh} fill="#ffffff08" stroke="#ffffff33" strokeWidth={2 * u} />
            <line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy} stroke="#ffffff30" strokeWidth={2 * u} strokeDasharray={`${8 * u} ${8 * u}`} />
            <polyline points={pts} fill="none" stroke={accent} strokeWidth={3.5 * u} />
            <circle cx={px} cy={py} r={9 * u} fill="#fff" />
            <text x={gx} y={gy + gh + 34 * u} fontFamily={fonts.mono} fontSize={24 * u} fill="#ffffff99">
              source time vs. output time
            </text>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const tapeStutter = defineMotion<Props>({
  id: 'tape-stutter',
  title: 'Tape stutter',
  category: 'fx',
  description:
    'The picture behaves like worn tape: it steps down to 15 fps while tracking, jolts two or three frames backwards, drags at 15 fps into the drop and winds down at half speed; a cassette demo with a source-time curve and OSD makes each skipped frame visible.',
  source: ['mg-styles-15 demos/10-synthwave sceneTime + audio.py tape_stop (MIT)', 'video 10-synthwave 0-3 s'],
  useFor: 'Pre-drop tension, retro / found-tape feel and rhythm edits: wrap any motion in `TapeRemap` with the same segments, or reuse the remap curve for a tape-stop ending.',
  durationInFrames: 240,
  defaultProps: {
    segments: [
      {from: 30, to: 96, mode: 'step'},
      {from: 96, to: 99, mode: 'reverse'},
      {from: 99, to: 150, mode: 'step'},
      {from: 200, to: 240, mode: 'half'},
    ],
    stepEvery: 2,
    jitter: 10,
    showGraph: true,
    label: 'MIXTAPE 90',
    body: '#2a2145',
    accent: '#35e0c0',
    background: '#07040f',
  },
  propDocs: {
    segments: 'list of {from,to,mode} in frames; mode = normal | step (hold every Nth frame) | reverse (rewind blip) | half (half speed)',
    stepEvery: 'frames held per step in step / half modes (2 = 15 fps at 30)',
    jitter: 'horizontal picture jitter in px while the tape misbehaves',
    showGraph: 'show the source-time curve and playhead',
    label: 'text on the cassette label',
    body: 'cassette body colour',
    accent: 'accent colour (label stripe, meter, curve)',
    background: 'backdrop colour',
  },
  component: TapeStutter,
  tags: ['tape', 'stutter', 'time remap', 'vhs', 'retro', '15fps', 'rewind', 'tape stop', 'step', 'glitch', 'cassette', 'rhythm', 'wrapper', 'edit'],
});
