import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {GlossySphere} from '../../core/shapes';
import {PaperTexture, Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video4 "Listening": a glossy dot on paper emits 3 sonar rings (easeOutQuad, 13 f life,
 * 4 f apart, stroke 20->4 px, dash break-up near the edge). Echo arcs fly back from a
 * direction (easeInQuad) and a circular picture window pops out toward that direction
 * (4 f in, hold, 4 f out).
 */
type Props = {
  background: string;
  color: string;
  pings: number;
  pingEvery: number;
  ringCount: number;
  ringGap: number;
  ringLife: number;
  echoAngles: number[];
  windowImages: string[];
  windowColors: string[];
  windowSize: number;
  paper: boolean;
};

const Rings: React.FC<{t0: number; color: string; count: number; gap: number; life: number; cx: number; cy: number; R: number; u: number; seed: number}> = ({t0, color, count, gap, life, cx, cy, R, u, seed}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const l = frame - t0 - i * gap;
        if (l < 0 || l > life * 1.4) return null;
        const t = clamp(l / (life * 1.4));
        const r = R * (1 - (1 - t) * (1 - t));
        const sw = (20 * Math.pow(0.7, i) * (1 - t) + 2) * u;
        const breakup = clamp((r - R * 0.55) / (R * 0.3));
        const rr = rng(seed * 31 + i);
        const dash = breakup > 0 ? Array.from({length: 8}, (_, k) => (k % 2 ? (10 + rr() * 30) * breakup : 40 + rr() * 80) * u).join(' ') : undefined;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={dash} opacity={1 - clamp((t - 0.75) / 0.25)} />;
      })}
    </>
  );
};

const SonarPing: React.FC<Props> = ({background, color, pings, pingEvery, ringCount, ringGap, ringLife, echoAngles, windowImages, windowColors, windowSize, paper}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const R = Math.min(w, h) * 0.82;
  return (
    <AbsoluteFill style={{background}}>
      {paper && <PaperTexture opacity={0.4} />}
      <Svg>
        {Array.from({length: pings}, (_, k) => {
          const t0 = 6 + k * pingEvery;
          const ang = ((echoAngles[k % echoAngles.length] ?? 45) * Math.PI) / 180;
          // echo arcs: appear ~0.45 of the cycle later, fly inward with easeInQuad
          const e0 = t0 + pingEvery * 0.32;
          const e = prog(frame, e0, e0 + pingEvery * 0.18, ease.in);
          // window pop toward echo direction
          const w0 = e0 + pingEvery * 0.2;
          const pin = prog(frame, w0, w0 + 4, ease.out);
          const pout = prog(frame, t0 + pingEvery - 6, t0 + pingEvery - 2, ease.in);
          const s = pin * (1 - pout);
          const D = windowSize * Math.min(w, h);
          const wx = cx + Math.cos(ang) * D * 0.25 * s;
          const wy = cy + Math.sin(ang) * D * 0.25 * s;
          const img = windowImages[k % Math.max(1, windowImages.length)];
          const col = windowColors[k % windowColors.length];
          return (
            <g key={k}>
              <Rings t0={t0} color={color} count={ringCount} gap={ringGap} life={ringLife} cx={cx} cy={cy} R={R} u={u} seed={k} />
              {frame >= e0 && e < 1 &&
                [0, 1, 2].map((j) => {
                  const rr = (h * 0.65 - (h * 0.65 - 30 * u) * clamp(e * 1.15 - j * 0.08)) + j * 24 * u;
                  const span = (40 * Math.PI) / 180;
                  const a0 = ang - span / 2;
                  const a1 = ang + span / 2;
                  return (
                    <path
                      key={j}
                      d={`M ${cx + Math.cos(a0) * rr} ${cy + Math.sin(a0) * rr} A ${rr} ${rr} 0 0 1 ${cx + Math.cos(a1) * rr} ${cy + Math.sin(a1) * rr}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={(2 + 4 * e) * u}
                      strokeLinecap="round"
                    />
                  );
                })}
              {s > 0.001 && (
                <g>
                  <defs>
                    <clipPath id={`win${k}`}>
                      <circle cx={wx} cy={wy} r={(D / 2) * s} />
                    </clipPath>
                    <radialGradient id={`wg${k}`} cx="50%" cy="40%" r="70%">
                      <stop offset="0%" stopColor={col} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={col} />
                    </radialGradient>
                  </defs>
                  <g clipPath={`url(#win${k})`}>
                    {img ? (
                      <foreignObject x={wx - D * 0.6} y={wy - D * 0.6} width={D * 1.2} height={D * 1.2}>
                        <Img src={resolveSrc(img)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.15 - 0.05 * s})`}} />
                      </foreignObject>
                    ) : (
                      <rect x={wx - D} y={wy - D} width={D * 2} height={D * 2} fill={`url(#wg${k})`} />
                    )}
                  </g>
                  <circle cx={wx} cy={wy} r={(D / 2) * s} fill="none" stroke={color} strokeWidth={3 * u} />
                </g>
              )}
            </g>
          );
        })}
        <GlossySphere cx={cx} cy={cy} r={22 * u * (1 + 0.2 * Math.max(0, 1 - Math.abs(((frame - 6) % pingEvery) - 1) / 2))} color={color === '#3383CB' ? '#3780E7' : color} id="listener" />
      </Svg>
      {paper && <Vignette strength={0.28} color="120,110,95" />}
    </AbsoluteFill>
  );
};

export const sonarPing = defineMotion<Props>({
  id: 'sonar-ping',
  title: 'Sonar ping + echo window',
  category: 'shape',
  description: 'Glossy dot on paper emits sonar rings; echo arcs return and pop open a circular picture window.',
  source: ['video4 0:00-4:46'],
  useFor: 'Listening / broadcasting / searching beats; reveal examples one by one from an anchor point.',
  durationInFrames: 150,
  defaultProps: {
    background: '#ECE4D7',
    color: '#3383CB',
    pings: 3,
    pingEvery: 48,
    ringCount: 3,
    ringGap: 4,
    ringLife: 13,
    echoAngles: [40, -70, 160],
    windowImages: [],
    windowColors: ['#2b6e8f', '#3b2a6b', '#a34b6b'],
    windowSize: 0.53,
    paper: true,
  },
  propDocs: {
    pings: 'number of ping cycles',
    pingEvery: 'frames per ping cycle',
    echoAngles: 'degrees (0 = right, 90 = down) each echo comes from',
    windowImages: 'public/ paths of images shown in the pop-out windows (falls back to colour gradients)',
    windowSize: 'window diameter as a fraction of the short side',
  },
  component: SonarPing,
  tags: ['radar', 'pulse', 'signal', 'reveal'],
});
