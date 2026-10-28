// Adapted from mg-styles-15/demos/02-line-art/film.js (CT, camClock) (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {Hold, buildTimeRemap, cl, mix} from '../../core/r2-mg1b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  holds: Hold[];
  easeIn: number;
  release: number;
  length: number;
  background: string;
  color: string;
  remapColor: string;
  title: string;
};

const TimeRemapClock: React.FC<Props> = ({holds, easeIn, release, length, background, color, remapColor, title}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const ps = portrait ? 1.5 : 1;
  const key = JSON.stringify([holds, easeIn, release, length]);
  const M = useMemo(() => {
    const rm = buildTimeRemap(holds, {easeIn, release, total: length + 2});
    const N = 240;
    const vs: number[] = [];
    let vmax = 1.2;
    for (let i = 0; i <= N; i++) {
      const v = rm.speed((i / N) * length);
      vs.push(v);
      vmax = Math.max(vmax, v);
    }
    return {rm, vs, vmax: vmax * 1.08, N};
  }, [key]);
  const {rm, vs, vmax, N} = M;
  const t = Math.min(length, frame / fps);
  const clockT = Math.min(length, rm.remap(t));
  const v = rm.speed(t);
  const x0 = w * (portrait ? 0.09 : 0.12);
  const tw = w * (portrait ? 0.82 : 0.76);
  const y1 = h * (portrait ? 0.36 : 0.34);
  const y2 = y1 + 112 * u;
  const gy0 = y2 + 150 * u;
  const gh = Math.min(h * 0.2, 280 * u);
  const intro = cl(frame / 14);
  const px = (s: number) => x0 + (s / length) * tw;
  const gx = (s: number) => x0 + (s / length) * tw;
  const gv = (val: number) => gy0 + gh - (val / vmax) * gh;
  const inHold = v < 0.04;
  const boost = v > 1.25;
  const line = vs.map((s, i) => `${gx((i / N) * length).toFixed(1)},${gv(s).toFixed(1)}`).join(' ');
  const progN = Math.round((t / length) * N);
  const plotted = vs.slice(0, progN + 1).map((s, i) => `${gx((i / N) * length).toFixed(1)},${gv(s).toFixed(1)}`).join(' ');
  const mono = fonts.mono;
  const pulse = inHold ? 0.5 + 0.5 * Math.sin(frame * 0.5) : 0;

  return (
    <AbsoluteFill style={{background, opacity: intro}}>
      <Svg>
        <text x={x0} y={h * (portrait ? 0.2 : 0.2)} fill="#fff" fontFamily={fonts.grotesk} fontWeight={700} fontSize={54 * u * ps}>
          {title}
        </text>
        {portrait ? (
          <>
            <text x={x0} y={h * 0.2 + 64 * u} fill="#8a93b8" fontFamily={mono} fontSize={26 * u} letterSpacing={2 * u}>
              STOP ON THE HOLD · CATCH UP TO ~2x
            </text>
            <text x={x0} y={h * 0.2 + 100 * u} fill="#8a93b8" fontFamily={mono} fontSize={26 * u} letterSpacing={2 * u}>
              BACK ON THE TIMELINE
            </text>
          </>
        ) : (
          <text x={x0} y={h * 0.2 + 42 * u} fill="#8a93b8" fontFamily={mono} fontSize={22 * u * ps} letterSpacing={3 * u}>
            STOP ON THE HOLD · CATCH UP TO ~2x · BACK ON THE TIMELINE
          </text>
        )}

        {/* tracks */}
        {[
          {y: y1, label: 'TIMELINE', c: color, val: t},
          {y: y2, label: 'REMAPPED', c: remapColor, val: clockT},
        ].map((tr) => (
          <g key={tr.label}>
            <text x={x0} y={tr.y - 30 * u} fill={tr.c} fontFamily={mono} fontSize={20 * u * ps} letterSpacing={4 * u}>
              {tr.label}
            </text>
            <line x1={x0} x2={x0 + tw} y1={tr.y} y2={tr.y} stroke="#2a3050" strokeWidth={6 * u} strokeLinecap="round" />
            <line x1={x0} x2={px(tr.val)} y1={tr.y} y2={tr.y} stroke={tr.c} strokeWidth={6 * u} strokeLinecap="round" opacity={0.55} />
            {rm.holds.map((hd, i) => (
              <rect key={i} x={px(hd.at) - 2 * u} y={tr.y - 20 * u} width={4 * u} height={40 * u} rx={2 * u} fill="#ff6b81" opacity={0.7} />
            ))}
            <circle cx={px(tr.val)} cy={tr.y} r={(tr.label === 'REMAPPED' && inHold ? 22 + pulse * 6 : 20) * u} fill={tr.c} />
            <circle cx={px(tr.val) - 6 * u} cy={tr.y - 6 * u} r={6 * u} fill="#fff" opacity={0.6} />
          </g>
        ))}
        {/* difference connector */}
        <line x1={px(t)} x2={px(clockT)} y1={y1 + 24 * u} y2={y2 - 24 * u} stroke="#ffffff" strokeWidth={2 * u} strokeDasharray={`${6 * u} ${6 * u}`} opacity={0.35} />

        {/* speed graph */}
        <text x={x0} y={gy0 - 16 * u} fill="#8a93b8" fontFamily={mono} fontSize={20 * u * ps} letterSpacing={4 * u}>
          CLOCK SPEED
        </text>
        <rect x={x0} y={gy0} width={tw} height={gh} fill="#ffffff" opacity={0.03} rx={8 * u} />
        {rm.windows.map((wd, i) => (
          <rect key={i} x={px(wd.b)} y={gy0} width={px(wd.c) - px(wd.b)} height={gh} fill="#ff6b81" opacity={0.14} />
        ))}
        <line x1={x0} x2={x0 + tw} y1={gv(1)} y2={gv(1)} stroke="#ffffff" strokeWidth={1.5 * u} strokeDasharray={`${5 * u} ${7 * u}`} opacity={0.35} />
        <text x={x0 + tw + 10 * u} y={gv(1) + 7 * u} fill="#8a93b8" fontFamily={mono} fontSize={18 * u * ps}>
          1x
        </text>
        <polyline points={line} fill="none" stroke="#ffffff" strokeWidth={2 * u} opacity={0.22} />
        <polyline points={plotted} fill="none" stroke={remapColor} strokeWidth={4 * u} strokeLinejoin="round" />
        <line x1={gx(t)} x2={gx(t)} y1={gy0} y2={gy0 + gh} stroke="#fff" strokeWidth={2 * u} opacity={0.6} />
        <circle cx={gx(t)} cy={gv(v)} r={7 * u} fill={remapColor} />

        {/* readout */}
        <g fontFamily={mono} fontSize={26 * u * ps}>
          <text x={x0} y={gy0 + gh + 56 * u} fill={color}>
            t {t.toFixed(2)}s
          </text>
          <text x={x0 + tw * 0.34} y={gy0 + gh + 56 * u} fill={remapColor}>
            clock {clockT.toFixed(2)}s
          </text>
          <text x={x0 + tw * 0.7} y={gy0 + gh + 56 * u} fill={inHold ? '#ff6b81' : boost ? '#7CFFB2' : '#fff'}>
            {inHold ? 'HOLD' : `x${v.toFixed(2)}`}
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const timeRemapClock = defineMotion<Props>({
  id: 'time-remap-clock',
  title: 'Time remap clock',
  category: 'camera',
  description:
    'Explains and demonstrates the punctuation-hold clock: two balls on a track, one on the constant timeline, one on the remapped clock that eases to a full stop on each hold, then runs up to ~2x to catch back up; a live speed graph shows the dip, the stop and the sin² catch-up. The same pure remap (buildTimeRemap in src/core/r2-mg1b-kit.tsx) can drive any motion for musical breaths.',
  source: ['mg-styles-15 demos/02-line-art/film.js CT / camClock + demos/04-3d-render R(t) (MIT)'],
  useFor: 'Visualising or tuning holds / slow-mo on beats; template for retiming any library motion without drifting off the timeline.',
  durationInFrames: 240,
  defaultProps: {
    holds: [
      {at: 1.6, dur: 0.4},
      {at: 3.6, dur: 0.4},
      {at: 5.5, dur: 0.4},
    ],
    easeIn: 0.133,
    release: 0.9,
    length: 7.5,
    background: '#10142A',
    color: '#6C8CFF',
    remapColor: '#FFB44D',
    title: 'Time remap',
  },
  propDocs: {
    holds: 'holds [{at seconds on the timeline, dur seconds}]',
    easeIn: 'seconds easing into each hold',
    release: 'seconds of the catch-up run after each hold',
    length: 'timeline length in seconds shown on the track',
    background: 'page colour',
    color: 'timeline colour',
    remapColor: 'remapped clock colour',
    title: 'heading',
  },
  component: TimeRemapClock,
  tags: ['time remap', 'hold', 'slow motion', 'beat sync', 'camera', 'speed ramp', 'clock', 'catch-up', 'explainer', 'helper'],
});
