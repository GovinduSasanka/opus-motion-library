// Adapted from lemo-opuscar/styles/spy-titles/demo/chars.js ideas (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {CutFigure, fx, h1, lerp, lf, mixHex, rigPose, seg, useUid} from '../../core/r2-lb2-kit';

/**
 * Cut-paper spy chase: a flat black agent (narrow-brim hat, broad jacket, pointed shoes, one red tie streaming
 * back) sprints on twos across red rooftops under a paper moon, leaping the gaps; a taller villain in a wide brim
 * and A-line coat (red lining flashing while he runs) chases with a mustard case on a black backing.
 */

type Props = {
  action: 'chase' | 'run' | 'walk';
  caption: string;
  background: string;
  ground: string;
  ink: string;
  accentColor: string;
  objectColor: string;
  moon: boolean;
  moonColor: string;
  speed: number;
  scale: number;
  seed: number;
};

type Bld = {x0: number; x1: number; top: number; win: number};

const SilhouetteRunner: React.FC<Props> = ({action, caption, background, ground, ink, accentColor, objectColor, moon, moonColor, speed, scale, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useUid('srun');
  const H = 230 * u * scale; // figure height
  const pxPerF = (action === 'walk' ? 5.5 : 15) * u * speed;
  // buildings along the world x
  const blds: Bld[] = [];
  let x = -400 * u;
  for (let i = 0; i < 40; i++) {
    const bw = (260 + h1(i, seed) * 260) * u;
    const top = h * (portrait ? 0.66 : 0.62) + (h1(i + 50, seed) - 0.5) * 70 * u;
    blds.push({x0: x, x1: x + bw, top, win: Math.floor(h1(i + 9, seed) * 3)});
    x += bw + (60 + h1(i + 20, seed) * 40) * u;
  }
  const roofAt = (wx: number) => {
    for (let i = 0; i < blds.length; i++) {
      const b = blds[i];
      const nb = blds[i + 1];
      if (wx >= b.x0 - 50 * u && nb && wx <= nb.x0 + 50 * u) {
        // jump zone spans the gap with run-up margins
        const j0 = b.x1 - 40 * u;
        const j1 = nb.x0 + 40 * u;
        if (wx >= j0 && wx <= j1) {
          const s = (wx - j0) / (j1 - j0);
          return {y: lerp(b.top, nb.top, s) - Math.sin(Math.PI * s) * 70 * u * Math.max(0.6, scale), air: s > 0.08 && s < 0.92};
        }
        if (wx < j0) return {y: b.top, air: false};
      }
    }
    return {y: blds[0].top, air: false};
  };
  const agentX = 200 * u + frame * pxPerF;
  const villainX = agentX - (action === 'chase' ? 330 * u * scale + Math.sin(frame * 0.05) * 30 * u : 99999 * u);
  const camX = agentX - w * (portrait ? 0.62 : 0.6);
  const a = roofAt(agentX);
  const v = roofAt(villainX);
  const act = action === 'walk' ? 'walk' : 'run';
  const poseA = a.air ? rigPose('leap', frame) : rigPose(act, frame, 0, true, action === 'walk' ? 24 : 14);
  const poseV = v.air ? rigPose('leap', frame) : rigPose(act, frame, 0.37, true, 16);
  const moonR = Math.min(w, h) * (portrait ? 0.34 : 0.3);
  const moonX = w * 0.5 - camX * 0.04;
  const moonY = h * (portrait ? 0.38 : 0.36);
  const capIn = seg(frame, 24, 34);
  const capFont = lf('outfit');
  const capSize = 34 * u;
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <defs>
          <filter id={`${id}cut`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={0.06 / u} numOctaves={2} seed={seed} />
            <feDisplacementMap in="SourceGraphic" scale={2.2 * u} />
          </filter>
          <filter id={`${id}sh`} x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx={0} dy={4 * u} stdDeviation={3 * u} floodColor="#000" floodOpacity={0.35} />
          </filter>
        </defs>
        {moon && (
          <g filter={`url(#${id}sh)`}>
            <circle cx={moonX} cy={moonY} r={moonR} fill={moonColor} filter={`url(#${id}cut)`} />
            <circle cx={moonX + moonR * 0.3} cy={moonY - moonR * 0.25} r={moonR * 0.12} fill={mixHex(moonColor, '#000', 0.06)} />
            <circle cx={moonX - moonR * 0.35} cy={moonY + moonR * 0.3} r={moonR * 0.08} fill={mixHex(moonColor, '#000', 0.05)} />
          </g>
        )}
        {/* far rooftops (darker ground), slow parallax */}
        <g transform={`translate(${fx(-camX * 0.35)},0)`}>
          {blds.map((b, i) => (
            <rect key={i} x={b.x0 * 0.9 + 80 * u} y={b.top - 110 * u - h1(i + 3, seed) * 60 * u} width={(b.x1 - b.x0) * 0.8} height={h} fill={mixHex(ground, '#000', 0.38)} />
          ))}
        </g>
        {/* figures and near roofs */}
        <g transform={`translate(${fx(-camX)},0)`}>
          {blds.map((b, i) => {
            if (b.x1 < camX - 100 * u || b.x0 > camX + w + 100 * u) return null;
            const cols = Math.max(2, Math.floor((b.x1 - b.x0) / (70 * u)));
            const rows = Math.ceil((h - b.top) / (90 * u));
            return (
              <g key={i} filter={`url(#${id}sh)`}>
                <rect x={b.x0} y={b.top} width={b.x1 - b.x0} height={h - b.top + 20 * u} fill={ground} filter={`url(#${id}cut)`} />
                <rect x={b.x0 - 8 * u} y={b.top - 10 * u} width={b.x1 - b.x0 + 16 * u} height={14 * u} fill={mixHex(ground, '#000', 0.25)} />
                {Array.from({length: cols * rows}, (_, k) => {
                  const cx = k % cols;
                  const ry = Math.floor(k / cols);
                  if (h1(k + i * 31, seed + b.win) < 0.45) return null;
                  return <rect key={k} x={b.x0 + 26 * u + cx * ((b.x1 - b.x0 - 40 * u) / cols)} y={b.top + 40 * u + ry * 90 * u} width={24 * u} height={34 * u} fill={objectColor} />;
                })}
              </g>
            );
          })}
          {action === 'chase' && (
            <g transform={`translate(${fx(villainX)},${fx(v.y - 10 * u)})`}>
              <CutFigure kind="villain" pose={poseV} H={H * 1.2} ink={ink} accent={accentColor} ground={background} object={objectColor} frame={frame} />
            </g>
          )}
          <g transform={`translate(${fx(agentX)},${fx(a.y - 10 * u)})`}>
            <CutFigure kind="agent" pose={poseA} H={H} ink={ink} accent={accentColor} ground={background} frame={frame} running={action !== 'walk'} />
          </g>
        </g>
        {caption && (
          <g opacity={capIn} transform={`translate(${fx(56 * u)},${fx(h - 120 * u)}) rotate(-1.5)`}>
            <rect x={0} y={-capSize * 1.2} width={Math.min(w - 112 * u, caption.length * capSize * 0.5 + 90 * u) * capIn} height={capSize * 1.9} fill="#efe6d2" />
            <rect x={22 * u} y={-capSize * 0.62} width={8 * u} height={capSize * 0.9} fill={accentColor} />
            <text x={46 * u} y={capSize * 0.12} fontFamily={capFont} fontWeight={600} fontSize={capSize} fill={ink}>
              {caption}
            </text>
          </g>
        )}
      </Svg>
      <PaperTexture opacity={0.28} seed={seed + 4} tint="#6b5030" />
    </AbsoluteFill>
  );
};

export const silhouetteRunner = defineMotion<Props>({
  id: 'silhouette-runner',
  title: 'Silhouette runner (cut-paper chase)',
  category: 'character',
  description:
    'A flat black cut-paper agent with a streaming red tie sprints on twos across red rooftops under a paper moon, leaping the gaps, chased by a taller villain in a wide brim whose red coat lining flashes as he runs.',
  source: ['lemo-opuscar styles/spy-titles (chars.js, DEMO.md "Silhouette figures") (MIT, LemoLab)'],
  useFor: 'Chases, heists, couriers on a deadline, detective or spy-themed explainers and title sequences.',
  durationInFrames: 180,
  defaultProps: {
    action: 'chase',
    caption: 'Tonight, the courier runs out of roof.',
    background: '#141216',
    ground: '#c8321e',
    ink: '#111014',
    accentColor: '#d8261c',
    objectColor: '#e0a526',
    moon: true,
    moonColor: '#efe6d2',
    speed: 1,
    scale: 1,
    seed: 3,
  },
  propDocs: {
    action: "'chase' (agent + villain), 'run' (agent only) or 'walk'",
    caption: 'subtitle strip text (empty = none)',
    background: 'night sky colour',
    ground: 'rooftop colour (flat red)',
    ink: 'silhouette colour',
    accentColor: 'the only colour on the figures: tie and coat lining',
    objectColor: 'mustard windows and the carried case',
    moon: 'show the big paper moon',
    moonColor: 'moon / caption paper colour',
    speed: 'run speed multiplier',
    scale: 'figure size multiplier',
    seed: 'rooftop layout seed',
  },
  component: SilhouetteRunner,
  tags: ['spy', 'silhouette', 'cut paper', 'chase', 'run cycle', 'on twos', 'rooftop', 'heist', 'detective', 'noir', 'character', 'saul bass', 'titles', 'courier'],
});
