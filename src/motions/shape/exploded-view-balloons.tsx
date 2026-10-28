// Adapted from lemo-opuscar/styles/blueprint/demo/machine.js + sheet.js parts list (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {BlueprintPaper, eio3, eo3, lf, seg, settle} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A drawn assembly comes apart part by part along one axis, one part per beat (eased, on 8th notes); each
 * part trails a leader line and numbered balloon; a parts list fills in; then the parts return one per beat
 * and the balloons fade.
 */
type Props = {
  parts: {d: string; label: string; qty: number; dir: number[]; dist: number}[];
  explodeAt: number;
  returnAt: number;
  beatFrames: number;
  lineColor: string;
  accent: string;
  paperDark: string;
  paperLight: string;
  title: string;
  seed: number;
  camera: boolean;
};

// default assembly: a hand crank winch in a 0..100 box (back to front)
const WINCH: Props['parts'] = [
  {d: 'M18 78 L82 78 L86 90 L14 90 Z', label: 'Bed plate', qty: 1, dir: [0, 1], dist: 14},
  {d: 'M24 54 L32 54 L34 78 L22 78 Z', label: 'Frame, left', qty: 1, dir: [-0.7, -0.4], dist: 16},
  {d: 'M68 54 L76 54 L78 78 L66 78 Z', label: 'Frame, right', qty: 1, dir: [0.7, -0.4], dist: 16},
  {d: 'M34 58 L66 58 L66 70 L34 70 Z', label: 'Drum', qty: 1, dir: [0, -1], dist: 20},
  {d: 'M47 50 L53 50 L53 58 L47 58 Z', label: 'Axle cap', qty: 2, dir: [0, -1], dist: 32},
  {d: 'M76 60 L88 56 L90 60 L80 64 Z', label: 'Crank arm', qty: 1, dir: [1, -0.3], dist: 26},
  {d: 'M88 52 L92 52 L92 58 L88 58 Z', label: 'Handle', qty: 1, dir: [1, -0.5], dist: 34},
];

const ExplodedBalloons: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, fps} = useStage();
  const id = useSafeId('explb');
  const parts = p.parts.length ? p.parts : WINCH;
  const S = Math.min(w * (portrait ? 0.0088 : 0.0062), h * 0.008);
  const ox = (portrait ? w / 2 - 50 * S : w * 0.40 - 50 * S);
  const oy = h * (portrait ? 0.40 : 0.5) - 50 * S;
  const n = parts.length;
  // camera pulls back to make room while exploded
  const openK = eio3(seg(frame, p.explodeAt, p.explodeAt + p.beatFrames * n));
  const closeK = eio3(seg(frame, p.returnAt, p.returnAt + p.beatFrames * n));
  const spread = openK * (1 - closeK);
  const Z = p.camera ? lerp(1.12, 1, prog(frame, 0, 24, ease.out)) * lerp(1, 0.86, spread) : 1;
  const draw = seg(frame, 4, 34);

  const partOff = (i: number) => {
    const t0 = p.explodeAt + i * p.beatFrames;
    const t1 = p.returnAt + (n - 1 - i) * p.beatFrames;
    const out = eio3(seg(frame, t0, t0 + p.beatFrames * 2));
    const back = frame >= t1 ? 1 - settle((frame - t1) / fps, 6, 18) : 0;
    const k = out * (frame >= t1 ? clamp(1 - seg(frame, t1, t1 + p.beatFrames * 1.6)) + back * 0.06 : 1);
    return k;
  };
  const balloonR = Math.max(16 * u, 2.6 * S);
  const listX = portrait ? 60 * u : w * 0.72;
  const listY = portrait ? h * 0.715 : h * 0.2;
  const lk = portrait ? 1.45 : 1;
  const listIn = (i: number) => prog(frame, p.explodeAt + i * p.beatFrames + 6, p.explodeAt + i * p.beatFrames + 16, ease.out);
  const listFade = 1 - 0.65 * eio3(seg(frame, p.returnAt + n * p.beatFrames, p.returnAt + n * p.beatFrames + 16));
  const titleIn = prog(frame, 8, 26, ease.out);

  return (
    <AbsoluteFill style={{background: p.paperDark}}>
      <AbsoluteFill style={{transform: `scale(${Z})`, transformOrigin: `${ox + 50 * S}px ${oy + 55 * S}px`}}>
        <Svg>
          <BlueprintPaper id={id} w={w} h={h} u={u} dark={p.paperDark} light={p.paperLight} seed={p.seed} />
          {/* explode axis centre line */}
          <line x1={ox + 50 * S} y1={oy - 20 * S} x2={ox + 50 * S} y2={oy + 115 * S} stroke={p.lineColor} strokeWidth={1 * u} strokeDasharray={`${16 * u} ${7 * u} ${3 * u} ${7 * u}`} opacity={0.35} />
          {parts.map((part, i) => {
            const k = partOff(i);
            const dx = part.dir[0] * part.dist * k * S;
            const dy = part.dir[1] * part.dist * k * S;
            const pd = clamp(draw * n * 1.3 - i * 0.8);
            if (pd <= 0) return null;
            const m = part.d.match(/M\s*([\d.]+)[ ,]([\d.]+)/);
            const axp = ox + (m ? +m[1] : 50) * S + dx;
            const ayp = oy + (m ? +m[2] : 50) * S + dy;
            const bx = axp + (part.dir[0] >= 0 ? 1 : -1) * 9 * S * Math.max(0.35, k);
            const by = ayp - 7 * S * Math.max(0.35, k);
            const bOn = clamp((k - 0.15) * 4);
            return (
              <g key={i}>
                <g transform={`translate(${dx} ${dy})`}>
                  <g transform={`translate(${ox} ${oy}) scale(${S})`}>
                    <path d={part.d} fill="rgba(20,42,87,0.45)" stroke={p.lineColor} strokeWidth={2 / S * Math.max(1.4, 2.2 * u)} strokeLinejoin="round" pathLength={1} strokeDasharray={`${pd} 2`} />
                  </g>
                </g>
                {bOn > 0 && (
                  <g opacity={bOn * listFade}>
                    <line x1={axp} y1={ayp} x2={bx} y2={by} stroke={p.lineColor} strokeWidth={1.3 * u} />
                    <circle cx={axp} cy={ayp} r={2.4 * u} fill={p.lineColor} />
                    <circle cx={bx} cy={by} r={balloonR * (0.8 + 0.2 * eo3(bOn))} fill={p.paperDark} stroke={p.accent} strokeWidth={2.2 * u} />
                    <text x={bx} y={by + balloonR * 0.34} textAnchor="middle" fontFamily={lf.plex} fontWeight={700} fontSize={balloonR} fill={p.lineColor}>
                      {i + 1}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {/* parts list */}
          <g opacity={listFade}>
            <text x={listX} y={listY - 18 * u * lk} fontFamily={lf.plex} fontSize={(portrait ? 30 : 21) * u} letterSpacing={3 * u} fill={p.lineColor} opacity={0.8 * prog(frame, p.explodeAt, p.explodeAt + 10, ease.out)}>
              PARTS LIST
            </text>
            {parts.map((part, i) => {
              const k = listIn(i);
              if (k <= 0) return null;
              const y = listY + i * (portrait ? 54 : 42) * u;
              return (
                <g key={i} opacity={k} transform={`translate(${(1 - k) * 18 * u} 0)`}>
                  <circle cx={listX + 14 * u * lk} cy={y + 10 * u * lk} r={14 * u * lk} fill="none" stroke={p.accent} strokeWidth={1.8 * u} />
                  <text x={listX + 14 * u * lk} y={y + 16 * u * lk} textAnchor="middle" fontFamily={lf.plex} fontSize={17 * u * lk} fill={p.lineColor}>
                    {i + 1}
                  </text>
                  <text x={listX + 42 * u * lk} y={y + 17 * u * lk} fontFamily={lf.hand} fontSize={27 * u * lk} fill={p.lineColor}>
                    {part.label}
                  </text>
                  <text x={listX + (portrait ? w - 180 * u : w * 0.25)} y={y + 16 * u * lk} textAnchor="end" fontFamily={lf.plex} fontSize={19 * u * lk} fill={p.lineColor} opacity={0.85}>
                    ×{part.qty}
                  </text>
                  <line x1={listX + 42 * u * lk} y1={y + 26 * u * lk} x2={listX + (portrait ? w - 180 * u : w * 0.25)} y2={y + 26 * u * lk} stroke={p.lineColor} strokeWidth={0.8 * u} opacity={0.25} />
                </g>
              );
            })}
          </g>
          <text x={portrait ? w / 2 : ox + 50 * S} y={portrait ? h * 0.12 : h * 0.1} textAnchor="middle" fontFamily={lf.hand} fontWeight={700} fontSize={(portrait ? 54 : 50) * u} fill={p.lineColor} opacity={titleIn}>
            {p.title}
          </text>
        </Svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const explodedViewBalloons = defineMotion<Props>({
  id: 'exploded-view-balloons',
  title: 'Exploded view with balloons',
  category: 'shape',
  description:
    'A drawn blueprint assembly comes apart part by part, one per beat; each part trails a leader line and a numbered balloon, a parts list fills in on the side, then the parts click back together and the balloons fade.',
  source: ['lemo-opuscar styles/blueprint demo/machine.js, sheet.js parts list (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §5 exploded-view-balloons'],
  useFor: 'Product teardowns, feature lists, "what\'s inside" hardware or SaaS architecture diagrams.',
  durationInFrames: 210,
  defaultProps: {
    parts: [],
    explodeAt: 42,
    returnAt: 150,
    beatFrames: 8,
    lineColor: '#E7F0F9',
    accent: '#E7F0F9',
    paperDark: '#18336B',
    paperLight: '#2A58A6',
    title: 'The Hand Winch',
    seed: 5,
    camera: true,
  },
  propDocs: {
    parts: '[{d, label, qty, dir:[x,y], dist}] SVG paths in a 0..100 box, back to front; empty = built-in winch',
    explodeAt: 'frame the first part lifts',
    returnAt: 'frame the parts start returning (last part first)',
    beatFrames: 'frames per beat (one part per beat)',
    lineColor: 'line work colour',
    accent: 'balloon ring colour',
    paperDark: 'paper dark ramp end',
    paperLight: 'paper light ramp end',
    title: 'hand-lettered sheet title',
    seed: 'paper seed',
    camera: 'pull the camera back while exploded',
  },
  component: ExplodedBalloons,
  tags: ['exploded view', 'balloons', 'parts list', 'assembly', 'blueprint', 'teardown', 'engineering', 'diagram', 'leader lines', 'product', 'whats inside', 'technical drawing', 'bom'],
});
